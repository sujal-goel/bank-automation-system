// Government Database Integration Adapters
// Provides standardized interfaces for Aadhaar, PAN, and other government databases

const https = require('https');
const crypto = require('crypto');
const CircuitBreaker = require('./circuit-breaker');
const AuditService = require('./audit-service');

/**
 * Base Government Database Adapter
 * Provides common functionality for all government database integrations
 */
class BaseGovernmentDatabaseAdapter {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableMockMode: config.enableMockMode || false,
      ...config
    };
    
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000,
      expectedErrors: ['INVALID_DOCUMENT', 'DOCUMENT_NOT_FOUND', 'VALIDATION_FAILED']
    });
    
    this.auditService = new AuditService();
  }

  /**
   * Make HTTP request with retry logic and circuit breaker protection
   * @param {Object} options - Request options
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(options, data = null) {
    return await this.circuitBreaker.execute(async () => {
      let lastError;
      
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          return await this.executeRequest(options, data);
        } catch (error) {
          lastError = error;
          
          // Don't retry on client errors (4xx)
          if (error.statusCode >= 400 && error.statusCode < 500) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < this.config.retryAttempts) {
            await this.delay(this.config.retryDelay * Math.pow(2, attempt - 1));
          }
        }
      }
      
      throw lastError;
    });
  }

  /**
   * Execute HTTP request
   * @param {Object} options - Request options
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  executeRequest(options, data) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsedData = JSON.parse(responseData);
              resolve(parsedData);
            } else {
              const error = new Error(`HTTP ${res.statusCode}: ${responseData}`);
              error.statusCode = res.statusCode;
              error.response = responseData;
              reject(error);
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(this.config.timeout);

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate request signature for authentication
   * @param {string} data - Data to sign
   * @param {string} secret - Secret key
   * @returns {string} Generated signature
   */
  generateSignature(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Log audit event for government database access
   * @param {string} operation - Operation performed
   * @param {Object} requestData - Request data (sanitized)
   * @param {Object} response - Response data (sanitized)
   * @param {string} userId - User performing the operation
   */
  async logAuditEvent(operation, requestData, response, userId) {
    try {
      await this.auditService.log(
        'GOVERNMENT_DATABASE',
        requestData.documentNumber || requestData.aadhaarNumber || 'unknown',
        operation,
        userId,
        null,
        {
          operation,
          success: response.success || false,
          timestamp: new Date(),
          sanitizedRequest: this.sanitizeRequestData(requestData),
          sanitizedResponse: this.sanitizeResponseData(response)
        }
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Sanitize request data for audit logging
   * @param {Object} data - Request data
   * @returns {Object} Sanitized data
   */
  sanitizeRequestData(data) {
    const sanitized = { ...data };
    
    // Mask sensitive information
    if (sanitized.aadhaarNumber) {
      sanitized.aadhaarNumber = this.maskSensitiveData(sanitized.aadhaarNumber);
    }
    if (sanitized.panNumber) {
      sanitized.panNumber = this.maskSensitiveData(sanitized.panNumber);
    }
    if (sanitized.passportNumber) {
      sanitized.passportNumber = this.maskSensitiveData(sanitized.passportNumber);
    }
    
    return sanitized;
  }

  /**
   * Sanitize response data for audit logging
   * @param {Object} data - Response data
   * @returns {Object} Sanitized data
   */
  sanitizeResponseData(data) {
    const sanitized = { ...data };
    
    // Remove sensitive personal information from audit logs
    if (sanitized.personalInfo) {
      delete sanitized.personalInfo.aadhaarNumber;
      delete sanitized.personalInfo.panNumber;
      delete sanitized.personalInfo.passportNumber;
    }
    
    return sanitized;
  }

  /**
   * Mask sensitive data for logging
   * @param {string} data - Sensitive data
   * @returns {string} Masked data
   */
  maskSensitiveData(data) {
    if (!data || data.length < 4) return '****';
    return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
  }
}

/**
 * Aadhaar Database Adapter
 * Handles integration with Aadhaar verification services
 */
class AadhaarAdapter extends BaseGovernmentDatabaseAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.aadhaar?.baseUrl || 'https://api.uidai.gov.in/v1';
    this.apiKey = config.aadhaar?.apiKey || 'test-api-key';
    this.agencyId = config.aadhaar?.agencyId || 'test-agency-id';
    this.secretKey = config.aadhaar?.secretKey || 'test-secret-key';
  }

  /**
   * Verify Aadhaar number and get basic demographics
   * @param {Object} verificationData - Aadhaar verification data
   * @returns {Promise<Object>} Aadhaar verification response
   */
  async verifyAadhaar(verificationData) {
    if (this.config.enableMockMode) {
      return this.getMockAadhaarVerification(verificationData);
    }

    const requestData = this.buildAadhaarVerificationRequest(verificationData);
    const options = this.buildRequestOptions('/verify-demographics', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      const parsedResponse = this.parseAadhaarVerificationResponse(response);
      
      await this.logAuditEvent('AADHAAR_VERIFICATION', verificationData, parsedResponse, verificationData.userId);
      
      return parsedResponse;
    } catch (error) {
      await this.logAuditEvent('AADHAAR_VERIFICATION_FAILED', verificationData, { error: error.message }, verificationData.userId);
      throw this.transformAadhaarError(error);
    }
  }

  /**
   * Perform Aadhaar OTP authentication
   * @param {Object} otpData - OTP authentication data
   * @returns {Promise<Object>} OTP authentication response
   */
  async authenticateWithOTP(otpData) {
    if (this.config.enableMockMode) {
      return this.getMockOTPAuthentication(otpData);
    }

    const requestData = this.buildOTPAuthenticationRequest(otpData);
    const options = this.buildRequestOptions('/authenticate-otp', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      const parsedResponse = this.parseOTPAuthenticationResponse(response);
      
      await this.logAuditEvent('AADHAAR_OTP_AUTH', otpData, parsedResponse, otpData.userId);
      
      return parsedResponse;
    } catch (error) {
      await this.logAuditEvent('AADHAAR_OTP_AUTH_FAILED', otpData, { error: error.message }, otpData.userId);
      throw this.transformAadhaarError(error);
    }
  }

  /**
   * Build Aadhaar verification request
   * @param {Object} verificationData - Verification data
   * @returns {Object} Aadhaar request format
   */
  buildAadhaarVerificationRequest(verificationData) {
    return {
      agencyId: this.agencyId,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      aadhaarNumber: verificationData.aadhaarNumber,
      demographics: {
        name: verificationData.name,
        dateOfBirth: verificationData.dateOfBirth,
        gender: verificationData.gender,
        address: verificationData.address
      }
    };
  }

  /**
   * Build OTP authentication request
   * @param {Object} otpData - OTP data
   * @returns {Object} OTP request format
   */
  buildOTPAuthenticationRequest(otpData) {
    return {
      agencyId: this.agencyId,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      aadhaarNumber: otpData.aadhaarNumber,
      otp: otpData.otp,
      transactionId: otpData.transactionId
    };
  }

  /**
   * Build request options for Aadhaar API
   * @param {string} path - API path
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Object} Request options
   */
  buildRequestOptions(path, method, data) {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(JSON.stringify(data) + timestamp, this.secretKey);
    
    return {
      hostname: new URL(this.baseUrl).hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Agency-Id': this.agencyId,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      }
    };
  }

  /**
   * Parse Aadhaar verification response
   * @param {Object} response - Raw Aadhaar response
   * @returns {Object} Parsed verification data
   */
  parseAadhaarVerificationResponse(response) {
    return {
      verified: response.status === 'SUCCESS',
      matchScore: response.matchScore || 0,
      demographics: response.demographics || {},
      verificationDate: new Date(response.timestamp),
      transactionId: response.transactionId,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Parse OTP authentication response
   * @param {Object} response - Raw OTP response
   * @returns {Object} Parsed authentication data
   */
  parseOTPAuthenticationResponse(response) {
    return {
      authenticated: response.status === 'SUCCESS',
      authToken: response.authToken,
      validUntil: new Date(response.validUntil),
      transactionId: response.transactionId,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Transform Aadhaar-specific errors
   * @param {Error} error - Original error
   * @returns {Error} Transformed error
   */
  transformAadhaarError(error) {
    const transformedError = new Error(error.message);
    transformedError.originalError = error;
    
    if (error.message.includes('Invalid Aadhaar')) {
      transformedError.code = 'INVALID_AADHAAR';
    } else if (error.message.includes('Demographics mismatch')) {
      transformedError.code = 'DEMOGRAPHICS_MISMATCH';
    } else if (error.message.includes('Invalid OTP')) {
      transformedError.code = 'INVALID_OTP';
    } else if (error.message.includes('OTP expired')) {
      transformedError.code = 'OTP_EXPIRED';
    } else if (error.statusCode === 401) {
      transformedError.code = 'AUTHENTICATION_FAILED';
    } else if (error.statusCode === 429) {
      transformedError.code = 'RATE_LIMIT_EXCEEDED';
    } else {
      transformedError.code = 'AADHAAR_API_ERROR';
    }
    
    return transformedError;
  }

  /**
   * Generate mock Aadhaar verification for testing
   * @param {Object} verificationData - Verification data
   * @returns {Object} Mock verification response
   */
  getMockAadhaarVerification(verificationData) {
    const isValid = verificationData.aadhaarNumber && verificationData.aadhaarNumber.length === 12;
    const matchScore = isValid ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 50);
    
    return {
      verified: isValid && matchScore >= 70,
      matchScore: matchScore,
      demographics: {
        name: verificationData.name,
        dateOfBirth: verificationData.dateOfBirth,
        gender: verificationData.gender,
        address: verificationData.address
      },
      verificationDate: new Date(),
      transactionId: crypto.randomUUID(),
      status: isValid && matchScore >= 70 ? 'SUCCESS' : 'FAILED',
      errors: isValid && matchScore >= 70 ? [] : ['Demographics verification failed']
    };
  }

  /**
   * Generate mock OTP authentication for testing
   * @param {Object} otpData - OTP data
   * @returns {Object} Mock authentication response
   */
  getMockOTPAuthentication(otpData) {
    const isValidOTP = otpData.otp === '123456'; // Mock valid OTP
    
    return {
      authenticated: isValidOTP,
      authToken: isValidOTP ? crypto.randomBytes(32).toString('hex') : null,
      validUntil: isValidOTP ? new Date(Date.now() + 30 * 60 * 1000) : null, // 30 minutes
      transactionId: otpData.transactionId,
      status: isValidOTP ? 'SUCCESS' : 'FAILED',
      errors: isValidOTP ? [] : ['Invalid OTP']
    };
  }
}

/**
 * PAN Database Adapter
 * Handles integration with PAN verification services
 */
class PANAdapter extends BaseGovernmentDatabaseAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.pan?.baseUrl || 'https://api.incometax.gov.in/v1';
    this.apiKey = config.pan?.apiKey || 'test-api-key';
    this.clientId = config.pan?.clientId || 'test-client-id';
    this.clientSecret = config.pan?.clientSecret || 'test-client-secret';
  }

  /**
   * Verify PAN number and get taxpayer details
   * @param {Object} verificationData - PAN verification data
   * @returns {Promise<Object>} PAN verification response
   */
  async verifyPAN(verificationData) {
    if (this.config.enableMockMode) {
      return this.getMockPANVerification(verificationData);
    }

    const requestData = this.buildPANVerificationRequest(verificationData);
    const options = this.buildRequestOptions('/verify-pan', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      const parsedResponse = this.parsePANVerificationResponse(response);
      
      await this.logAuditEvent('PAN_VERIFICATION', verificationData, parsedResponse, verificationData.userId);
      
      return parsedResponse;
    } catch (error) {
      await this.logAuditEvent('PAN_VERIFICATION_FAILED', verificationData, { error: error.message }, verificationData.userId);
      throw this.transformPANError(error);
    }
  }

  /**
   * Get PAN details including name and status
   * @param {Object} panData - PAN data
   * @returns {Promise<Object>} PAN details response
   */
  async getPANDetails(panData) {
    if (this.config.enableMockMode) {
      return this.getMockPANDetails(panData);
    }

    const requestData = this.buildPANDetailsRequest(panData);
    const options = this.buildRequestOptions('/pan-details', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      const parsedResponse = this.parsePANDetailsResponse(response);
      
      await this.logAuditEvent('PAN_DETAILS_LOOKUP', panData, parsedResponse, panData.userId);
      
      return parsedResponse;
    } catch (error) {
      await this.logAuditEvent('PAN_DETAILS_LOOKUP_FAILED', panData, { error: error.message }, panData.userId);
      throw this.transformPANError(error);
    }
  }

  /**
   * Build PAN verification request
   * @param {Object} verificationData - Verification data
   * @returns {Object} PAN request format
   */
  buildPANVerificationRequest(verificationData) {
    return {
      clientId: this.clientId,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      panNumber: verificationData.panNumber,
      name: verificationData.name,
      dateOfBirth: verificationData.dateOfBirth
    };
  }

  /**
   * Build PAN details request
   * @param {Object} panData - PAN data
   * @returns {Object} PAN details request format
   */
  buildPANDetailsRequest(panData) {
    return {
      clientId: this.clientId,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      panNumber: panData.panNumber
    };
  }

  /**
   * Build request options for PAN API
   * @param {string} path - API path
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Object} Request options
   */
  buildRequestOptions(path, method, data) {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    return {
      hostname: new URL(this.baseUrl).hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'X-API-Key': this.apiKey
      }
    };
    
  }

  /**
   * Parse PAN verification response
   * @param {Object} response - Raw PAN response
   * @returns {Object} Parsed verification data
   */
  parsePANVerificationResponse(response) {
    return {
      verified: response.status === 'VALID',
      panNumber: response.panNumber,
      name: response.name,
      nameMatch: response.nameMatch || false,
      dobMatch: response.dobMatch || false,
      panStatus: response.panStatus,
      verificationDate: new Date(response.timestamp),
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Parse PAN details response
   * @param {Object} response - Raw PAN details response
   * @returns {Object} Parsed PAN details
   */
  parsePANDetailsResponse(response) {
    return {
      panNumber: response.panNumber,
      name: response.name,
      panStatus: response.panStatus,
      category: response.category,
      lastUpdated: new Date(response.lastUpdated),
      aadhaarLinked: response.aadhaarLinked || false,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Transform PAN-specific errors
   * @param {Error} error - Original error
   * @returns {Error} Transformed error
   */
  transformPANError(error) {
    const transformedError = new Error(error.message);
    transformedError.originalError = error;
    
    if (error.message.includes('Invalid PAN')) {
      transformedError.code = 'INVALID_PAN';
    } else if (error.message.includes('PAN not found')) {
      transformedError.code = 'PAN_NOT_FOUND';
    } else if (error.message.includes('Name mismatch')) {
      transformedError.code = 'NAME_MISMATCH';
    } else if (error.message.includes('PAN inactive')) {
      transformedError.code = 'PAN_INACTIVE';
    } else if (error.statusCode === 401) {
      transformedError.code = 'AUTHENTICATION_FAILED';
    } else if (error.statusCode === 429) {
      transformedError.code = 'RATE_LIMIT_EXCEEDED';
    } else {
      transformedError.code = 'PAN_API_ERROR';
    }
    
    return transformedError;
  }

  /**
   * Generate mock PAN verification for testing
   * @param {Object} verificationData - Verification data
   * @returns {Object} Mock verification response
   */
  getMockPANVerification(verificationData) {
    const isValidPAN = verificationData.panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(verificationData.panNumber);
    const nameMatch = verificationData.name && verificationData.name.length > 2;
    
    return {
      verified: isValidPAN && nameMatch,
      panNumber: verificationData.panNumber,
      name: verificationData.name,
      nameMatch: nameMatch,
      dobMatch: true,
      panStatus: isValidPAN ? 'ACTIVE' : 'INVALID',
      verificationDate: new Date(),
      status: isValidPAN && nameMatch ? 'VALID' : 'INVALID',
      errors: isValidPAN && nameMatch ? [] : ['PAN verification failed']
    };
  }

  /**
   * Generate mock PAN details for testing
   * @param {Object} panData - PAN data
   * @returns {Object} Mock PAN details response
   */
  getMockPANDetails(panData) {
    const isValidPAN = panData.panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panData.panNumber);
    
    return {
      panNumber: panData.panNumber,
      name: isValidPAN ? 'MOCK TAXPAYER NAME' : null,
      panStatus: isValidPAN ? 'ACTIVE' : 'INVALID',
      category: isValidPAN ? 'INDIVIDUAL' : null,
      lastUpdated: new Date(),
      aadhaarLinked: isValidPAN ? Math.random() > 0.3 : false,
      status: isValidPAN ? 'SUCCESS' : 'FAILED',
      errors: isValidPAN ? [] : ['Invalid PAN number']
    };
  }
}

/**
 * Passport Database Adapter
 * Handles integration with passport verification services
 */
class PassportAdapter extends BaseGovernmentDatabaseAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.passport?.baseUrl || 'https://api.passportindia.gov.in/v1';
    this.apiKey = config.passport?.apiKey || 'test-api-key';
    this.agencyCode = config.passport?.agencyCode || 'test-agency';
    this.secretKey = config.passport?.secretKey || 'test-secret-key';
  }

  /**
   * Verify passport number and get passport details
   * @param {Object} verificationData - Passport verification data
   * @returns {Promise<Object>} Passport verification response
   */
  async verifyPassport(verificationData) {
    if (this.config.enableMockMode) {
      return this.getMockPassportVerification(verificationData);
    }

    const requestData = this.buildPassportVerificationRequest(verificationData);
    const options = this.buildRequestOptions('/verify-passport', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      const parsedResponse = this.parsePassportVerificationResponse(response);
      
      await this.logAuditEvent('PASSPORT_VERIFICATION', verificationData, parsedResponse, verificationData.userId);
      
      return parsedResponse;
    } catch (error) {
      await this.logAuditEvent('PASSPORT_VERIFICATION_FAILED', verificationData, { error: error.message }, verificationData.userId);
      throw this.transformPassportError(error);
    }
  }

  /**
   * Check passport status and validity
   * @param {Object} passportData - Passport data
   * @returns {Promise<Object>} Passport status response
   */
  async checkPassportStatus(passportData) {
    if (this.config.enableMockMode) {
      return this.getMockPassportStatus(passportData);
    }

    const requestData = this.buildPassportStatusRequest(passportData);
    const options = this.buildRequestOptions('/passport-status', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      const parsedResponse = this.parsePassportStatusResponse(response);
      
      await this.logAuditEvent('PASSPORT_STATUS_CHECK', passportData, parsedResponse, passportData.userId);
      
      return parsedResponse;
    } catch (error) {
      await this.logAuditEvent('PASSPORT_STATUS_CHECK_FAILED', passportData, { error: error.message }, passportData.userId);
      throw this.transformPassportError(error);
    }
  }

  /**
   * Build passport verification request
   * @param {Object} verificationData - Verification data
   * @returns {Object} Passport request format
   */
  buildPassportVerificationRequest(verificationData) {
    return {
      agencyCode: this.agencyCode,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      passportNumber: verificationData.passportNumber,
      dateOfBirth: verificationData.dateOfBirth,
      name: verificationData.name,
      placeOfBirth: verificationData.placeOfBirth
    };
  }

  /**
   * Build passport status request
   * @param {Object} passportData - Passport data
   * @returns {Object} Passport status request format
   */
  buildPassportStatusRequest(passportData) {
    return {
      agencyCode: this.agencyCode,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      passportNumber: passportData.passportNumber,
      fileNumber: passportData.fileNumber
    };
  }

  /**
   * Build request options for Passport API
   * @param {string} path - API path
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Object} Request options
   */
  buildRequestOptions(path, method, data) {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(JSON.stringify(data) + timestamp, this.secretKey);
    
    return {
      hostname: new URL(this.baseUrl).hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Agency-Code': this.agencyCode,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      }
    };
  }

  /**
   * Parse passport verification response
   * @param {Object} response - Raw passport response
   * @returns {Object} Parsed verification data
   */
  parsePassportVerificationResponse(response) {
    return {
      verified: response.status === 'VERIFIED',
      passportNumber: response.passportNumber,
      name: response.name,
      dateOfBirth: new Date(response.dateOfBirth),
      placeOfBirth: response.placeOfBirth,
      issueDate: new Date(response.issueDate),
      expiryDate: new Date(response.expiryDate),
      passportStatus: response.passportStatus,
      verificationDate: new Date(response.timestamp),
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Parse passport status response
   * @param {Object} response - Raw passport status response
   * @returns {Object} Parsed status data
   */
  parsePassportStatusResponse(response) {
    return {
      passportNumber: response.passportNumber,
      status: response.passportStatus,
      isValid: response.isValid,
      issueDate: new Date(response.issueDate),
      expiryDate: new Date(response.expiryDate),
      isExpired: new Date(response.expiryDate) < new Date(),
      applicationStatus: response.applicationStatus,
      lastUpdated: new Date(response.lastUpdated),
      errors: response.errors || []
    };
  }

  /**
   * Transform passport-specific errors
   * @param {Error} error - Original error
   * @returns {Error} Transformed error
   */
  transformPassportError(error) {
    const transformedError = new Error(error.message);
    transformedError.originalError = error;
    
    if (error.message.includes('Invalid passport')) {
      transformedError.code = 'INVALID_PASSPORT';
    } else if (error.message.includes('Passport not found')) {
      transformedError.code = 'PASSPORT_NOT_FOUND';
    } else if (error.message.includes('Passport expired')) {
      transformedError.code = 'PASSPORT_EXPIRED';
    } else if (error.message.includes('Details mismatch')) {
      transformedError.code = 'DETAILS_MISMATCH';
    } else if (error.statusCode === 401) {
      transformedError.code = 'AUTHENTICATION_FAILED';
    } else if (error.statusCode === 429) {
      transformedError.code = 'RATE_LIMIT_EXCEEDED';
    } else {
      transformedError.code = 'PASSPORT_API_ERROR';
    }
    
    return transformedError;
  }

  /**
   * Generate mock passport verification for testing
   * @param {Object} verificationData - Verification data
   * @returns {Object} Mock verification response
   */
  getMockPassportVerification(verificationData) {
    const isValidPassport = verificationData.passportNumber && verificationData.passportNumber.length >= 8;
    const nameMatch = verificationData.name && verificationData.name.length > 2;
    
    return {
      verified: isValidPassport && nameMatch,
      passportNumber: verificationData.passportNumber,
      name: verificationData.name,
      dateOfBirth: verificationData.dateOfBirth,
      placeOfBirth: verificationData.placeOfBirth,
      issueDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 years ago
      expiryDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
      passportStatus: isValidPassport ? 'ACTIVE' : 'INVALID',
      verificationDate: new Date(),
      status: isValidPassport && nameMatch ? 'VERIFIED' : 'FAILED',
      errors: isValidPassport && nameMatch ? [] : ['Passport verification failed']
    };
  }

  /**
   * Generate mock passport status for testing
   * @param {Object} passportData - Passport data
   * @returns {Object} Mock status response
   */
  getMockPassportStatus(passportData) {
    const isValidPassport = passportData.passportNumber && passportData.passportNumber.length >= 8;
    const expiryDate = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
    
    return {
      passportNumber: passportData.passportNumber,
      status: isValidPassport ? 'ACTIVE' : 'INVALID',
      isValid: isValidPassport,
      issueDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
      expiryDate: expiryDate,
      isExpired: expiryDate < new Date(),
      applicationStatus: isValidPassport ? 'COMPLETED' : 'NOT_FOUND',
      lastUpdated: new Date(),
      errors: isValidPassport ? [] : ['Passport not found']
    };
  }
}

/**
 * Government Database Service Factory
 * Creates appropriate adapter instances based on database type
 */
class GovernmentDatabaseFactory {
  /**
   * Create government database adapter
   * @param {string} databaseType - Type of database (aadhaar, pan, passport)
   * @param {Object} config - Configuration options
   * @returns {BaseGovernmentDatabaseAdapter} Database adapter instance
   */
  static createAdapter(databaseType, config = {}) {
    switch (databaseType.toLowerCase()) {
      case 'aadhaar':
        return new AadhaarAdapter(config);
      case 'pan':
        return new PANAdapter(config);
      case 'passport':
        return new PassportAdapter(config);
      default:
        throw new Error(`Unsupported government database type: ${databaseType}`);
    }
  }

  /**
   * Get list of supported database types
   * @returns {string[]} Supported database types
   */
  static getSupportedDatabases() {
    return ['aadhaar', 'pan', 'passport'];
  }
}

module.exports = {
  BaseGovernmentDatabaseAdapter,
  AadhaarAdapter,
  PANAdapter,
  PassportAdapter,
  GovernmentDatabaseFactory
};

/**
 * Government Database Service Manager
 * Manages multiple government database adapters with fallback mechanisms
 */
class GovernmentDatabaseServiceManager {
  constructor(config = {}) {
    this.config = config;
    this.adapters = new Map();
    this.fallbackStrategies = new Map();
    this.serviceHealthStatus = new Map();
    
    // Initialize adapters
    this.initializeAdapters();
    
    // Set up health monitoring
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, config.healthCheckInterval || 300000); // 5 minutes
  }

  /**
   * Initialize all government database adapters
   */
  initializeAdapters() {
    const supportedDatabases = GovernmentDatabaseFactory.getSupportedDatabases();
    
    supportedDatabases.forEach(dbType => {
      try {
        const adapter = GovernmentDatabaseFactory.createAdapter(dbType, this.config);
        this.adapters.set(dbType, adapter);
        this.serviceHealthStatus.set(dbType, { healthy: true, lastCheck: new Date(), consecutiveFailures: 0 });
        
        // Set up fallback strategies
        this.setupFallbackStrategy(dbType);
      } catch (error) {
        console.error(`Failed to initialize ${dbType} adapter:`, error);
        this.serviceHealthStatus.set(dbType, { healthy: false, lastCheck: new Date(), consecutiveFailures: 1 });
      }
    });
  }

  /**
   * Set up fallback strategies for each database type
   * @param {string} dbType - Database type
   */
  setupFallbackStrategy(dbType) {
    const strategies = {
      aadhaar: {
        primary: 'aadhaar',
        fallbacks: ['manual_verification'],
        timeout: 30000
      },
      pan: {
        primary: 'pan',
        fallbacks: ['manual_verification'],
        timeout: 30000
      },
      passport: {
        primary: 'passport',
        fallbacks: ['manual_verification'],
        timeout: 30000
      }
    };
    
    this.fallbackStrategies.set(dbType, strategies[dbType] || { primary: dbType, fallbacks: [], timeout: 30000 });
  }

  /**
   * Verify document with fallback mechanisms
   * @param {string} databaseType - Type of database
   * @param {string} operation - Operation to perform
   * @param {Object} data - Verification data
   * @returns {Promise<Object>} Verification result
   */
  async verifyWithFallback(databaseType, operation, data) {
    const strategy = this.fallbackStrategies.get(databaseType);
    if (!strategy) {
      throw new Error(`No fallback strategy defined for ${databaseType}`);
    }

    // Try primary service first
    try {
      const result = await this.executeVerification(databaseType, operation, data);
      this.updateServiceHealth(databaseType, true);
      return result;
    } catch (error) {
      console.warn(`Primary ${databaseType} service failed:`, error.message);
      this.updateServiceHealth(databaseType, false);
      
      // Try fallback mechanisms
      return await this.executeFallbackVerification(databaseType, operation, data, error);
    }
  }

  /**
   * Execute verification on primary service
   * @param {string} databaseType - Database type
   * @param {string} operation - Operation to perform
   * @param {Object} data - Verification data
   * @returns {Promise<Object>} Verification result
   */
  async executeVerification(databaseType, operation, data) {
    const adapter = this.adapters.get(databaseType);
    if (!adapter) {
      throw new Error(`No adapter available for ${databaseType}`);
    }

    // Check if service is healthy
    const healthStatus = this.serviceHealthStatus.get(databaseType);
    if (!healthStatus.healthy && healthStatus.consecutiveFailures >= 3) {
      throw new Error(`${databaseType} service is marked as unhealthy`);
    }

    // Execute the operation based on database type and operation
    switch (databaseType) {
      case 'aadhaar':
        if (operation === 'verify') {
          return await adapter.verifyAadhaar(data);
        } else if (operation === 'authenticate') {
          return await adapter.authenticateWithOTP(data);
        }
        break;
      case 'pan':
        if (operation === 'verify') {
          return await adapter.verifyPAN(data);
        } else if (operation === 'details') {
          return await adapter.getPANDetails(data);
        }
        break;
      case 'passport':
        if (operation === 'verify') {
          return await adapter.verifyPassport(data);
        } else if (operation === 'status') {
          return await adapter.checkPassportStatus(data);
        }
        break;
      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }

    throw new Error(`Unsupported operation: ${operation} for ${databaseType}`);
  }

  /**
   * Execute fallback verification mechanisms
   * @param {string} databaseType - Database type
   * @param {string} operation - Operation to perform
   * @param {Object} data - Verification data
   * @param {Error} primaryError - Error from primary service
   * @returns {Promise<Object>} Fallback verification result
   */
  async executeFallbackVerification(databaseType, operation, data, primaryError) {
    const strategy = this.fallbackStrategies.get(databaseType);
    
    for (const fallbackMethod of strategy.fallbacks) {
      try {
        switch (fallbackMethod) {
          case 'manual_verification':
            return await this.createManualVerificationTask(databaseType, operation, data, primaryError);
          case 'cached_data':
            return await this.getCachedVerificationData(databaseType, data);
          case 'alternative_service':
            return await this.tryAlternativeService(databaseType, operation, data);
          default:
            console.warn(`Unknown fallback method: ${fallbackMethod}`);
        }
      } catch (fallbackError) {
        console.warn(`Fallback method ${fallbackMethod} failed:`, fallbackError.message);
      }
    }

    // If all fallbacks fail, return a structured error response
    return {
      verified: false,
      status: 'SERVICE_UNAVAILABLE',
      fallbackUsed: true,
      primaryError: primaryError.message,
      requiresManualReview: true,
      errors: ['All verification services are currently unavailable. Manual review required.']
    };
  }

  /**
   * Create manual verification task when automated services fail
   * @param {string} databaseType - Database type
   * @param {string} operation - Operation
   * @param {Object} data - Verification data
   * @param {Error} primaryError - Primary service error
   * @returns {Promise<Object>} Manual verification task result
   */
  async createManualVerificationTask(databaseType, operation, data, primaryError) {
    const taskId = crypto.randomUUID();
    
    // In a real system, this would create a task in a workflow management system
    const manualTask = {
      taskId: taskId,
      databaseType: databaseType,
      operation: operation,
      data: this.sanitizeDataForManualReview(data),
      primaryError: primaryError.message,
      createdAt: new Date(),
      status: 'PENDING_MANUAL_REVIEW',
      priority: this.determinePriority(databaseType, data),
      estimatedCompletionTime: this.estimateManualReviewTime(databaseType)
    };

    console.log(`Created manual verification task: ${taskId} for ${databaseType} ${operation}`);

    return {
      verified: false,
      status: 'PENDING_MANUAL_REVIEW',
      taskId: taskId,
      fallbackUsed: true,
      manualReviewRequired: true,
      estimatedCompletionTime: manualTask.estimatedCompletionTime,
      errors: [`${databaseType} service unavailable. Manual review task created: ${taskId}`]
    };
  }

  /**
   * Sanitize data for manual review (remove sensitive information)
   * @param {Object} data - Original data
   * @returns {Object} Sanitized data
   */
  sanitizeDataForManualReview(data) {
    const sanitized = { ...data };
    
    // Remove sensitive fields that shouldn't be in manual review tasks
    delete sanitized.userId;
    delete sanitized.otp;
    
    // Mask sensitive document numbers
    if (sanitized.aadhaarNumber) {
      sanitized.aadhaarNumber = this.maskSensitiveData(sanitized.aadhaarNumber);
    }
    if (sanitized.panNumber) {
      sanitized.panNumber = this.maskSensitiveData(sanitized.panNumber);
    }
    if (sanitized.passportNumber) {
      sanitized.passportNumber = this.maskSensitiveData(sanitized.passportNumber);
    }
    
    return sanitized;
  }

  /**
   * Determine priority for manual review tasks
   * @param {string} databaseType - Database type
   * @param {Object} data - Verification data
   * @returns {string} Priority level
   */
  determinePriority(databaseType, data) {
    // High priority for loan applications or account opening
    if (data.applicationId || data.accountId) {
      return 'HIGH';
    }
    
    // Medium priority for KYC updates
    if (data.kycUpdate) {
      return 'MEDIUM';
    }
    
    return 'NORMAL';
  }

  /**
   * Estimate manual review completion time
   * @param {string} databaseType - Database type
   * @returns {Date} Estimated completion time
   */
  estimateManualReviewTime(databaseType) {
    const baseHours = {
      aadhaar: 4,
      pan: 2,
      passport: 6
    };
    
    const hours = baseHours[databaseType] || 4;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  /**
   * Get cached verification data if available
   * @param {string} databaseType - Database type
   * @param {Object} data - Verification data
   * @returns {Promise<Object>} Cached verification result
   */
  async getCachedVerificationData(databaseType, data) {
    // In a real system, this would check a cache/database for recent verification results
    // For now, return a placeholder indicating cache miss
    throw new Error('No cached verification data available');
  }

  /**
   * Try alternative service for verification
   * @param {string} databaseType - Database type
   * @param {string} operation - Operation
   * @param {Object} data - Verification data
   * @returns {Promise<Object>} Alternative service result
   */
  async tryAlternativeService(databaseType, operation, data) {
    // In a real system, this might try a different API provider or service
    // For now, throw an error indicating no alternative service is available
    throw new Error('No alternative service available');
  }

  /**
   * Update service health status
   * @param {string} databaseType - Database type
   * @param {boolean} healthy - Whether the service is healthy
   */
  updateServiceHealth(databaseType, healthy) {
    const currentStatus = this.serviceHealthStatus.get(databaseType);
    if (!currentStatus) return;

    if (healthy) {
      currentStatus.healthy = true;
      currentStatus.consecutiveFailures = 0;
    } else {
      currentStatus.consecutiveFailures++;
      if (currentStatus.consecutiveFailures >= 3) {
        currentStatus.healthy = false;
      }
    }
    
    currentStatus.lastCheck = new Date();
    this.serviceHealthStatus.set(databaseType, currentStatus);
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks() {
    for (const [databaseType, adapter] of this.adapters) {
      try {
        // Perform a lightweight health check (could be a ping endpoint)
        const healthStatus = this.serviceHealthStatus.get(databaseType);
        
        // Simple health check - if circuit breaker is healthy, consider service healthy
        if (adapter.circuitBreaker && adapter.circuitBreaker.isHealthy()) {
          this.updateServiceHealth(databaseType, true);
        } else {
          this.updateServiceHealth(databaseType, false);
        }
      } catch (error) {
        console.warn(`Health check failed for ${databaseType}:`, error.message);
        this.updateServiceHealth(databaseType, false);
      }
    }
  }

  /**
   * Get service health status for all databases
   * @returns {Object} Health status for all services
   */
  getServiceHealthStatus() {
    const status = {};
    for (const [databaseType, healthInfo] of this.serviceHealthStatus) {
      status[databaseType] = { ...healthInfo };
    }
    return status;
  }

  /**
   * Mask sensitive data for logging
   * @param {string} data - Sensitive data
   * @returns {string} Masked data
   */
  maskSensitiveData(data) {
    if (!data || data.length < 4) return '****';
    return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Export the service manager along with other classes
module.exports = {
  BaseGovernmentDatabaseAdapter,
  AadhaarAdapter,
  PANAdapter,
  PassportAdapter,
  GovernmentDatabaseFactory,
  GovernmentDatabaseServiceManager
};