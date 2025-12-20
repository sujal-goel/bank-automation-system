const CircuitBreaker = require('./circuit-breaker');
const AuditService = require('./audit-service');
const { CIBILAdapter, ExperianAdapter, EquifaxAdapter } = require('./credit-bureau-adapters');
const { v4: uuidv4 } = require('uuid');

/**
 * Credit Bureau Integration Interface
 * Provides unified interface for CIBIL, Experian, and Equifax credit bureau APIs
 * Implements circuit breaker pattern for resilience and comprehensive error handling
 */
class CreditBureauInterface {
  constructor(options = {}) {
    this.config = {
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      enableMockMode: options.enableMockMode || false,
      ...options
    };

    // Initialize circuit breakers for each bureau
    this.circuitBreakers = {
      cibil: new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        expectedErrors: ['INVALID_PAN', 'INVALID_AADHAAR', 'CUSTOMER_NOT_FOUND']
      }),
      experian: new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        expectedErrors: ['INVALID_SSN', 'INVALID_DOB', 'CUSTOMER_NOT_FOUND']
      }),
      equifax: new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        expectedErrors: ['INVALID_ID', 'INVALID_ADDRESS', 'CUSTOMER_NOT_FOUND']
      })
    };

    // Initialize bureau adapters
    this.bureaus = {
      cibil: new CIBILAdapter(this.config),
      experian: new ExperianAdapter(this.config),
      equifax: new EquifaxAdapter(this.config)
    };

    // Initialize audit service
    this.auditService = new AuditService();

    console.log('Credit Bureau Interface initialized with mock mode:', this.config.enableMockMode);
  }

  /**
   * Retrieve credit score from specified bureau
   * @param {string} bureau - Bureau name (cibil, experian, equifax)
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} Credit score and report data
   */
  async getCreditScore(bureau, customerData) {
    const startTime = Date.now();
    const customerId = customerData?.customerId || uuidv4();
    const systemUserId = uuidv4(); // System user ID for audit
    
    try {
      // Validate inputs
      this.validateBureau(bureau);
      this.validateCustomerData(customerData);

      // Log audit trail
      await this.auditService.log(
        'CreditBureauRequest',
        customerId,
        'GET_CREDIT_SCORE',
        systemUserId,
        null,
        null,
        {
          bureau,
          requestTime: new Date(),
          customerIdentifiers: this.sanitizeCustomerData(customerData)
        }
      );

      // Execute request through circuit breaker
      const result = await this.circuitBreakers[bureau].execute(
        this.bureaus[bureau].getCreditScore.bind(this.bureaus[bureau]),
        customerData
      );

      // Transform and validate response
      const transformedResult = this.transformCreditResponse(bureau, result);
      
      // Log successful response
      await this.auditService.log(
        'CreditBureauResponse',
        customerId,
        'CREDIT_SCORE_RETRIEVED',
        systemUserId,
        null,
        null,
        {
          bureau,
          responseTime: Date.now() - startTime,
          creditScore: transformedResult.creditScore,
          success: true
        }
      );

      return transformedResult;

    } catch (error) {
      // Log error
      await this.auditService.log(
        'CreditBureauError',
        customerId,
        'CREDIT_SCORE_ERROR',
        systemUserId,
        null,
        null,
        {
          bureau,
          error: error.message,
          errorCode: error.code,
          responseTime: Date.now() - startTime
        }
      );

      throw this.transformError(bureau, error);
    }
  }

  /**
   * Retrieve comprehensive credit report from specified bureau
   * @param {string} bureau - Bureau name
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} Comprehensive credit report
   */
  async getCreditReport(bureau, customerData) {
    const startTime = Date.now();
    const customerId = customerData?.customerId || uuidv4();
    const systemUserId = uuidv4(); // System user ID for audit
    
    try {
      this.validateBureau(bureau);
      this.validateCustomerData(customerData);

      await this.auditService.log(
        'CreditBureauRequest',
        customerId,
        'GET_CREDIT_REPORT',
        systemUserId,
        null,
        null,
        {
          bureau,
          requestTime: new Date(),
          customerIdentifiers: this.sanitizeCustomerData(customerData)
        }
      );

      const result = await this.circuitBreakers[bureau].execute(
        this.bureaus[bureau].getCreditReport.bind(this.bureaus[bureau]),
        customerData
      );

      const transformedResult = this.transformCreditReportResponse(bureau, result);
      
      await this.auditService.log(
        'CreditBureauResponse',
        customerId,
        'CREDIT_REPORT_RETRIEVED',
        systemUserId,
        null,
        null,
        {
          bureau,
          responseTime: Date.now() - startTime,
          reportSections: Object.keys(transformedResult.sections || {}),
          success: true
        }
      );

      return transformedResult;

    } catch (error) {
      await this.auditService.log(
        'CreditBureauError',
        customerId,
        'CREDIT_REPORT_ERROR',
        systemUserId,
        null,
        null,
        {
          bureau,
          error: error.message,
          errorCode: error.code,
          responseTime: Date.now() - startTime
        }
      );

      throw this.transformError(bureau, error);
    }
  }

  /**
   * Get credit scores from multiple bureaus for comparison
   * @param {Array<string>} bureaus - Array of bureau names
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} Combined credit scores from multiple bureaus
   */
  async getMultiBureauCreditScore(bureaus, customerData) {
    const results = {};
    const errors = {};

    // Execute requests in parallel
    const promises = bureaus.map(async (bureau) => {
      try {
        const result = await this.getCreditScore(bureau, customerData);
        results[bureau] = result;
      } catch (error) {
        errors[bureau] = {
          error: error.message,
          code: error.code,
          timestamp: new Date()
        };
      }
    });

    await Promise.allSettled(promises);

    // Calculate average score if multiple scores available
    const scores = Object.values(results).map(r => r.creditScore).filter(s => s != null);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    return {
      results,
      errors,
      summary: {
        successfulBureaus: Object.keys(results).length,
        failedBureaus: Object.keys(errors).length,
        averageScore,
        timestamp: new Date()
      }
    };
  }

  /**
   * Validate bureau name
   * @param {string} bureau - Bureau name to validate
   */
  validateBureau(bureau) {
    const validBureaus = ['cibil', 'experian', 'equifax'];
    if (!validBureaus.includes(bureau.toLowerCase())) {
      throw new Error(`Invalid bureau: ${bureau}. Valid bureaus: ${validBureaus.join(', ')}`);
    }
  }

  /**
   * Validate customer data for credit bureau request
   * @param {Object} customerData - Customer data to validate
   */
  validateCustomerData(customerData) {
    if (!customerData) {
      throw new Error('Customer data is required');
    }

    const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
    const missingFields = requiredFields.filter(field => !customerData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate date of birth
    if (customerData.dateOfBirth && !(customerData.dateOfBirth instanceof Date)) {
      throw new Error('Date of birth must be a valid Date object');
    }
  }

  /**
   * Sanitize customer data for audit logging (remove sensitive information)
   * @param {Object} customerData - Customer data to sanitize
   * @returns {Object} Sanitized customer data
   */
  sanitizeCustomerData(customerData) {
    return {
      customerId: customerData.customerId,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      hasSSN: !!customerData.ssn,
      hasPAN: !!customerData.pan,
      hasAadhaar: !!customerData.aadhaar,
      dateOfBirth: customerData.dateOfBirth
    };
  }

  /**
   * Transform credit score response to standardized format
   * @param {string} bureau - Bureau name
   * @param {Object} response - Raw bureau response
   * @returns {Object} Standardized credit response
   */
  transformCreditResponse(bureau, response) {
    const baseResponse = {
      bureau,
      timestamp: new Date(),
      creditScore: null,
      scoreRange: { min: 300, max: 850 },
      riskCategory: null,
      lastUpdated: null,
      inquiries: 0,
      accounts: 0,
      rawResponse: response
    };

    switch (bureau.toLowerCase()) {
      case 'cibil':
        return {
          ...baseResponse,
          creditScore: response.score,
          scoreRange: { min: 300, max: 900 },
          riskCategory: this.mapCIBILRiskCategory(response.score),
          lastUpdated: response.reportDate,
          inquiries: response.inquiryCount || 0,
          accounts: response.accountCount || 0
        };

      case 'experian':
        return {
          ...baseResponse,
          creditScore: response.creditScore,
          riskCategory: this.mapExperianRiskCategory(response.creditScore),
          lastUpdated: response.lastUpdated,
          inquiries: response.totalInquiries || 0,
          accounts: response.totalAccounts || 0
        };

      case 'equifax':
        return {
          ...baseResponse,
          creditScore: response.score,
          riskCategory: this.mapEquifaxRiskCategory(response.score),
          lastUpdated: response.asOfDate,
          inquiries: response.inquiries || 0,
          accounts: response.accounts || 0
        };

      default:
        return baseResponse;
    }
  }

  /**
   * Transform credit report response to standardized format
   * @param {string} bureau - Bureau name
   * @param {Object} response - Raw bureau response
   * @returns {Object} Standardized credit report
   */
  transformCreditReportResponse(bureau, response) {
    return {
      bureau,
      timestamp: new Date(),
      creditScore: response.creditScore || response.score,
      personalInfo: this.extractPersonalInfo(bureau, response),
      accounts: this.extractAccounts(bureau, response),
      inquiries: this.extractInquiries(bureau, response),
      publicRecords: this.extractPublicRecords(bureau, response),
      summary: this.extractSummary(bureau, response),
      rawResponse: response
    };
  }

  /**
   * Map CIBIL score to risk category
   * @param {number} score - CIBIL score
   * @returns {string} Risk category
   */
  mapCIBILRiskCategory(score) {
    if (score >= 750) return 'EXCELLENT';
    if (score >= 700) return 'GOOD';
    if (score >= 650) return 'FAIR';
    if (score >= 550) return 'POOR';
    return 'VERY_POOR';
  }

  /**
   * Map Experian score to risk category
   * @param {number} score - Experian score
   * @returns {string} Risk category
   */
  mapExperianRiskCategory(score) {
    if (score >= 800) return 'EXCELLENT';
    if (score >= 740) return 'VERY_GOOD';
    if (score >= 670) return 'GOOD';
    if (score >= 580) return 'FAIR';
    return 'POOR';
  }

  /**
   * Map Equifax score to risk category
   * @param {number} score - Equifax score
   * @returns {string} Risk category
   */
  mapEquifaxRiskCategory(score) {
    if (score >= 800) return 'EXCELLENT';
    if (score >= 740) return 'VERY_GOOD';
    if (score >= 670) return 'GOOD';
    if (score >= 580) return 'FAIR';
    return 'POOR';
  }

  /**
   * Extract personal information from bureau response
   * @param {string} bureau - Bureau name
   * @param {Object} response - Bureau response
   * @returns {Object} Extracted personal information
   */
  extractPersonalInfo(bureau, response) {
    // Implementation would vary by bureau format
    return {
      name: response.name || response.fullName,
      addresses: response.addresses || [],
      employers: response.employers || [],
      phoneNumbers: response.phoneNumbers || []
    };
  }

  /**
   * Extract account information from bureau response
   * @param {string} bureau - Bureau name
   * @param {Object} response - Bureau response
   * @returns {Array} Extracted account information
   */
  extractAccounts(bureau, response) {
    return response.accounts || response.creditAccounts || [];
  }

  /**
   * Extract inquiry information from bureau response
   * @param {string} bureau - Bureau name
   * @param {Object} response - Bureau response
   * @returns {Array} Extracted inquiry information
   */
  extractInquiries(bureau, response) {
    return response.inquiries || response.creditInquiries || [];
  }

  /**
   * Extract public records from bureau response
   * @param {string} bureau - Bureau name
   * @param {Object} response - Bureau response
   * @returns {Array} Extracted public records
   */
  extractPublicRecords(bureau, response) {
    return response.publicRecords || response.bankruptcies || [];
  }

  /**
   * Extract summary information from bureau response
   * @param {string} bureau - Bureau name
   * @param {Object} response - Bureau response
   * @returns {Object} Extracted summary
   */
  extractSummary(bureau, response) {
    return {
      totalAccounts: response.totalAccounts || 0,
      openAccounts: response.openAccounts || 0,
      totalBalance: response.totalBalance || 0,
      totalInquiries: response.totalInquiries || 0,
      derogatory: response.derogatory || 0
    };
  }

  /**
   * Transform bureau-specific errors to standardized format
   * @param {string} bureau - Bureau name
   * @param {Error} error - Original error
   * @returns {Error} Standardized error
   */
  transformError(bureau, error) {
    const standardError = new Error(`Credit bureau ${bureau} error: ${error.message}`);
    standardError.code = error.code || 'BUREAU_ERROR';
    standardError.bureau = bureau;
    standardError.originalError = error;
    standardError.timestamp = new Date();
    
    // Map common error codes
    if (error.code === 'CIRCUIT_OPEN') {
      standardError.code = 'SERVICE_UNAVAILABLE';
      standardError.message = `Credit bureau ${bureau} is temporarily unavailable`;
    } else if (error.code === 'CIRCUIT_TIMEOUT') {
      standardError.code = 'REQUEST_TIMEOUT';
      standardError.message = `Credit bureau ${bureau} request timed out`;
    }

    return standardError;
  }

  /**
   * Get health status of all credit bureaus
   * @returns {Object} Health status of all bureaus
   */
  getHealthStatus() {
    const status = {};
    
    Object.keys(this.circuitBreakers).forEach(bureau => {
      const breakerState = this.circuitBreakers[bureau].getState();
      status[bureau] = {
        healthy: breakerState.state !== 'OPEN',
        state: breakerState.state,
        failureCount: breakerState.failureCount,
        lastFailure: breakerState.lastFailureTime,
        stats: breakerState.stats
      };
    });

    return {
      overall: Object.values(status).every(s => s.healthy),
      bureaus: status,
      timestamp: new Date()
    };
  }
}

module.exports = CreditBureauInterface;