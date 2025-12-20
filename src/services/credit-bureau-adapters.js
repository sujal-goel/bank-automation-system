const https = require('https');
const crypto = require('crypto');

/**
 * Base Credit Bureau Adapter
 * Provides common functionality for all bureau adapters
 */
class BaseCreditBureauAdapter {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableMockMode: config.enableMockMode || false,
      ...config
    };
  }

  /**
   * Make HTTP request with retry logic
   * @param {Object} options - Request options
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(options, data = null) {
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
}

/**
 * CIBIL (Credit Information Bureau India Limited) Adapter
 * Handles integration with CIBIL credit bureau API
 */
class CIBILAdapter extends BaseCreditBureauAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.cibil?.baseUrl || 'https://api.cibil.com/v1';
    this.apiKey = config.cibil?.apiKey || 'test-api-key';
    this.secretKey = config.cibil?.secretKey || 'test-secret-key';
    this.memberId = config.cibil?.memberId || 'test-member-id';
  }

  /**
   * Get credit score from CIBIL
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} CIBIL credit score response
   */
  async getCreditScore(customerData) {
    if (this.config.enableMockMode) {
      return this.getMockCreditScore(customerData);
    }

    const requestData = this.buildCIBILScoreRequest(customerData);
    const options = this.buildRequestOptions('/credit-score', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      return this.parseCIBILScoreResponse(response);
    } catch (error) {
      throw this.transformCIBILError(error);
    }
  }

  /**
   * Get comprehensive credit report from CIBIL
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} CIBIL credit report response
   */
  async getCreditReport(customerData) {
    if (this.config.enableMockMode) {
      return this.getMockCreditReport(customerData);
    }

    const requestData = this.buildCIBILReportRequest(customerData);
    const options = this.buildRequestOptions('/credit-report', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      return this.parseCIBILReportResponse(response);
    } catch (error) {
      throw this.transformCIBILError(error);
    }
  }

  /**
   * Build CIBIL credit score request
   * @param {Object} customerData - Customer data
   * @returns {Object} CIBIL request format
   */
  buildCIBILScoreRequest(customerData) {
    return {
      memberId: this.memberId,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      applicant: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        dateOfBirth: customerData.dateOfBirth.toISOString().split('T')[0],
        pan: customerData.pan,
        aadhaar: customerData.aadhaar,
        mobileNumber: customerData.mobileNumber,
        address: customerData.address
      }
    };
  }

  /**
   * Build CIBIL credit report request
   * @param {Object} customerData - Customer data
   * @returns {Object} CIBIL request format
   */
  buildCIBILReportRequest(customerData) {
    const scoreRequest = this.buildCIBILScoreRequest(customerData);
    return {
      ...scoreRequest,
      reportType: 'COMPREHENSIVE',
      includeScore: true,
      includeAccounts: true,
      includeInquiries: true
    };
  }

  /**
   * Build request options for CIBIL API
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
        'X-Member-Id': this.memberId,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      }
    };
  }

  /**
   * Parse CIBIL credit score response
   * @param {Object} response - Raw CIBIL response
   * @returns {Object} Parsed score data
   */
  parseCIBILScoreResponse(response) {
    return {
      score: response.creditScore,
      reportDate: new Date(response.reportDate),
      inquiryCount: response.inquiries?.length || 0,
      accountCount: response.accounts?.length || 0,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Parse CIBIL credit report response
   * @param {Object} response - Raw CIBIL response
   * @returns {Object} Parsed report data
   */
  parseCIBILReportResponse(response) {
    return {
      creditScore: response.creditScore,
      reportDate: new Date(response.reportDate),
      personalInfo: response.personalInfo,
      accounts: response.accounts || [],
      inquiries: response.inquiries || [],
      publicRecords: response.publicRecords || [],
      summary: response.summary,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Transform CIBIL-specific errors
   * @param {Error} error - Original error
   * @returns {Error} Transformed error
   */
  transformCIBILError(error) {
    const transformedError = new Error(error.message);
    transformedError.originalError = error;
    
    if (error.message.includes('Invalid PAN')) {
      transformedError.code = 'INVALID_PAN';
    } else if (error.message.includes('Invalid Aadhaar')) {
      transformedError.code = 'INVALID_AADHAAR';
    } else if (error.message.includes('Customer not found')) {
      transformedError.code = 'CUSTOMER_NOT_FOUND';
    } else if (error.statusCode === 401) {
      transformedError.code = 'AUTHENTICATION_FAILED';
    } else if (error.statusCode === 429) {
      transformedError.code = 'RATE_LIMIT_EXCEEDED';
    } else {
      transformedError.code = 'CIBIL_API_ERROR';
    }
    
    return transformedError;
  }

  /**
   * Generate mock credit score for testing
   * @param {Object} customerData - Customer data
   * @returns {Object} Mock credit score response
   */
  getMockCreditScore(customerData) {
    const baseScore = 650;
    const variation = Math.floor(Math.random() * 200) - 100; // -100 to +100
    const score = Math.max(300, Math.min(900, baseScore + variation));
    
    return {
      score: score,
      reportDate: new Date(),
      inquiryCount: Math.floor(Math.random() * 10),
      accountCount: Math.floor(Math.random() * 15) + 1,
      status: 'SUCCESS',
      errors: []
    };
  }

  /**
   * Generate mock credit report for testing
   * @param {Object} customerData - Customer data
   * @returns {Object} Mock credit report response
   */
  getMockCreditReport(customerData) {
    const scoreData = this.getMockCreditScore(customerData);
    
    return {
      ...scoreData,
      creditScore: scoreData.score,
      personalInfo: {
        name: `${customerData.firstName} ${customerData.lastName}`,
        addresses: [customerData.address].filter(Boolean),
        employers: [],
        phoneNumbers: [customerData.mobileNumber].filter(Boolean)
      },
      accounts: this.generateMockAccounts(),
      inquiries: this.generateMockInquiries(),
      publicRecords: [],
      summary: {
        totalAccounts: scoreData.accountCount,
        openAccounts: Math.floor(scoreData.accountCount * 0.8),
        totalBalance: Math.floor(Math.random() * 1000000),
        totalInquiries: scoreData.inquiryCount,
        derogatory: Math.floor(Math.random() * 3)
      }
    };
  }

  /**
   * Generate mock account data
   * @returns {Array} Mock accounts
   */
  generateMockAccounts() {
    const accountTypes = ['Credit Card', 'Personal Loan', 'Home Loan', 'Auto Loan'];
    const accounts = [];
    const count = Math.floor(Math.random() * 10) + 1;
    
    for (let i = 0; i < count; i++) {
      accounts.push({
        accountType: accountTypes[Math.floor(Math.random() * accountTypes.length)],
        accountNumber: `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        balance: Math.floor(Math.random() * 500000),
        status: Math.random() > 0.2 ? 'Active' : 'Closed',
        openDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)
      });
    }
    
    return accounts;
  }

  /**
   * Generate mock inquiry data
   * @returns {Array} Mock inquiries
   */
  generateMockInquiries() {
    const inquiries = [];
    const count = Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
      inquiries.push({
        inquiryType: 'Credit Card',
        inquiryDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        inquirer: `Bank ${i + 1}`
      });
    }
    
    return inquiries;
  }
}

/**
 * Experian Adapter
 * Handles integration with Experian credit bureau API
 */
class ExperianAdapter extends BaseCreditBureauAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.experian?.baseUrl || 'https://api.experian.com/v1';
    this.apiKey = config.experian?.apiKey || 'test-api-key';
    this.clientId = config.experian?.clientId || 'test-client-id';
    this.clientSecret = config.experian?.clientSecret || 'test-client-secret';
  }

  /**
   * Get credit score from Experian
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} Experian credit score response
   */
  async getCreditScore(customerData) {
    if (this.config.enableMockMode) {
      return this.getMockCreditScore(customerData);
    }

    const requestData = this.buildExperianScoreRequest(customerData);
    const options = this.buildRequestOptions('/credit-profile', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      return this.parseExperianScoreResponse(response);
    } catch (error) {
      throw this.transformExperianError(error);
    }
  }

  /**
   * Get comprehensive credit report from Experian
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} Experian credit report response
   */
  async getCreditReport(customerData) {
    if (this.config.enableMockMode) {
      return this.getMockCreditReport(customerData);
    }

    const requestData = this.buildExperianReportRequest(customerData);
    const options = this.buildRequestOptions('/credit-report', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      return this.parseExperianReportResponse(response);
    } catch (error) {
      throw this.transformExperianError(error);
    }
  }

  /**
   * Build Experian credit score request
   * @param {Object} customerData - Customer data
   * @returns {Object} Experian request format
   */
  buildExperianScoreRequest(customerData) {
    return {
      requestId: crypto.randomUUID(),
      consumerPii: {
        primaryApplicant: {
          name: {
            firstName: customerData.firstName,
            lastName: customerData.lastName
          },
          dateOfBirth: customerData.dateOfBirth.toISOString().split('T')[0],
          ssn: customerData.ssn,
          currentAddress: customerData.address,
          phoneNumber: customerData.phoneNumber
        }
      },
      requestOptions: {
        includeScore: true,
        scoreModel: 'FICO'
      }
    };
  }

  /**
   * Build Experian credit report request
   * @param {Object} customerData - Customer data
   * @returns {Object} Experian request format
   */
  buildExperianReportRequest(customerData) {
    const scoreRequest = this.buildExperianScoreRequest(customerData);
    return {
      ...scoreRequest,
      requestOptions: {
        ...scoreRequest.requestOptions,
        includeFullReport: true,
        includeTradelines: true,
        includeInquiries: true,
        includePublicRecords: true
      }
    };
  }

  /**
   * Build request options for Experian API
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
   * Parse Experian credit score response
   * @param {Object} response - Raw Experian response
   * @returns {Object} Parsed score data
   */
  parseExperianScoreResponse(response) {
    const creditProfile = response.creditProfile || {};
    const score = creditProfile.score || {};
    
    return {
      creditScore: score.riskScore,
      lastUpdated: new Date(response.lastUpdated),
      totalInquiries: creditProfile.inquiries?.length || 0,
      totalAccounts: creditProfile.tradelines?.length || 0,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Parse Experian credit report response
   * @param {Object} response - Raw Experian response
   * @returns {Object} Parsed report data
   */
  parseExperianReportResponse(response) {
    const creditProfile = response.creditProfile || {};
    
    return {
      creditScore: creditProfile.score?.riskScore,
      lastUpdated: new Date(response.lastUpdated),
      personalInfo: creditProfile.consumerIdentity,
      accounts: creditProfile.tradelines || [],
      inquiries: creditProfile.inquiries || [],
      publicRecords: creditProfile.publicRecords || [],
      summary: creditProfile.summary,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Transform Experian-specific errors
   * @param {Error} error - Original error
   * @returns {Error} Transformed error
   */
  transformExperianError(error) {
    const transformedError = new Error(error.message);
    transformedError.originalError = error;
    
    if (error.message.includes('Invalid SSN')) {
      transformedError.code = 'INVALID_SSN';
    } else if (error.message.includes('Invalid date of birth')) {
      transformedError.code = 'INVALID_DOB';
    } else if (error.message.includes('Consumer not found')) {
      transformedError.code = 'CUSTOMER_NOT_FOUND';
    } else if (error.statusCode === 401) {
      transformedError.code = 'AUTHENTICATION_FAILED';
    } else if (error.statusCode === 429) {
      transformedError.code = 'RATE_LIMIT_EXCEEDED';
    } else {
      transformedError.code = 'EXPERIAN_API_ERROR';
    }
    
    return transformedError;
  }

  /**
   * Generate mock credit score for testing
   * @param {Object} customerData - Customer data
   * @returns {Object} Mock credit score response
   */
  getMockCreditScore(customerData) {
    const baseScore = 700;
    const variation = Math.floor(Math.random() * 200) - 100;
    const score = Math.max(300, Math.min(850, baseScore + variation));
    
    return {
      creditScore: score,
      lastUpdated: new Date(),
      totalInquiries: Math.floor(Math.random() * 8),
      totalAccounts: Math.floor(Math.random() * 12) + 1,
      status: 'SUCCESS',
      errors: []
    };
  }

  /**
   * Generate mock credit report for testing
   * @param {Object} customerData - Customer data
   * @returns {Object} Mock credit report response
   */
  getMockCreditReport(customerData) {
    const scoreData = this.getMockCreditScore(customerData);
    
    return {
      ...scoreData,
      personalInfo: {
        name: {
          firstName: customerData.firstName,
          lastName: customerData.lastName
        },
        addresses: [customerData.address].filter(Boolean),
        phoneNumbers: [customerData.phoneNumber].filter(Boolean)
      },
      accounts: this.generateMockAccounts(),
      inquiries: this.generateMockInquiries(),
      publicRecords: [],
      summary: {
        totalAccounts: scoreData.totalAccounts,
        openAccounts: Math.floor(scoreData.totalAccounts * 0.75),
        totalBalance: Math.floor(Math.random() * 800000),
        totalInquiries: scoreData.totalInquiries,
        derogatory: Math.floor(Math.random() * 2)
      }
    };
  }

  /**
   * Generate mock account data
   * @returns {Array} Mock accounts
   */
  generateMockAccounts() {
    const accountTypes = ['Revolving', 'Installment', 'Mortgage', 'Auto'];
    const accounts = [];
    const count = Math.floor(Math.random() * 8) + 1;
    
    for (let i = 0; i < count; i++) {
      accounts.push({
        accountType: accountTypes[Math.floor(Math.random() * accountTypes.length)],
        creditorName: `Creditor ${i + 1}`,
        balance: Math.floor(Math.random() * 300000),
        paymentStatus: Math.random() > 0.15 ? 'Current' : 'Late',
        openDate: new Date(Date.now() - Math.random() * 4 * 365 * 24 * 60 * 60 * 1000)
      });
    }
    
    return accounts;
  }

  /**
   * Generate mock inquiry data
   * @returns {Array} Mock inquiries
   */
  generateMockInquiries() {
    const inquiries = [];
    const count = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < count; i++) {
      inquiries.push({
        inquiryType: 'Hard',
        inquiryDate: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
        subscriber: `Lender ${i + 1}`
      });
    }
    
    return inquiries;
  }
}

/**
 * Equifax Adapter
 * Handles integration with Equifax credit bureau API
 */
class EquifaxAdapter extends BaseCreditBureauAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.equifax?.baseUrl || 'https://api.equifax.com/v1';
    this.apiKey = config.equifax?.apiKey || 'test-api-key';
    this.username = config.equifax?.username || 'test-username';
    this.password = config.equifax?.password || 'test-password';
  }

  /**
   * Get credit score from Equifax
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} Equifax credit score response
   */
  async getCreditScore(customerData) {
    if (this.config.enableMockMode) {
      return this.getMockCreditScore(customerData);
    }

    const requestData = this.buildEquifaxScoreRequest(customerData);
    const options = this.buildRequestOptions('/credit-score', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      return this.parseEquifaxScoreResponse(response);
    } catch (error) {
      throw this.transformEquifaxError(error);
    }
  }

  /**
   * Get comprehensive credit report from Equifax
   * @param {Object} customerData - Customer identification data
   * @returns {Promise<Object>} Equifax credit report response
   */
  async getCreditReport(customerData) {
    if (this.config.enableMockMode) {
      return this.getMockCreditReport(customerData);
    }

    const requestData = this.buildEquifaxReportRequest(customerData);
    const options = this.buildRequestOptions('/credit-report', 'POST', requestData);
    
    try {
      const response = await this.makeRequest(options, requestData);
      return this.parseEquifaxReportResponse(response);
    } catch (error) {
      throw this.transformEquifaxError(error);
    }
  }

  /**
   * Build Equifax credit score request
   * @param {Object} customerData - Customer data
   * @returns {Object} Equifax request format
   */
  buildEquifaxScoreRequest(customerData) {
    return {
      requestId: crypto.randomUUID(),
      subject: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        dateOfBirth: customerData.dateOfBirth.toISOString().split('T')[0],
        socialSecurityNumber: customerData.ssn,
        currentAddress: customerData.address,
        phoneNumber: customerData.phoneNumber
      },
      options: {
        scoreType: 'BEACON',
        includeFactors: true
      }
    };
  }

  /**
   * Build Equifax credit report request
   * @param {Object} customerData - Customer data
   * @returns {Object} Equifax request format
   */
  buildEquifaxReportRequest(customerData) {
    const scoreRequest = this.buildEquifaxScoreRequest(customerData);
    return {
      ...scoreRequest,
      options: {
        ...scoreRequest.options,
        includeFullReport: true,
        includeTrades: true,
        includeInquiries: true,
        includeCollections: true
      }
    };
  }

  /**
   * Build request options for Equifax API
   * @param {string} path - API path
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Object} Request options
   */
  buildRequestOptions(path, method, data) {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    
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
   * Parse Equifax credit score response
   * @param {Object} response - Raw Equifax response
   * @returns {Object} Parsed score data
   */
  parseEquifaxScoreResponse(response) {
    const scoreData = response.score || {};
    
    return {
      score: scoreData.value,
      asOfDate: new Date(response.asOfDate),
      inquiries: response.inquiries?.length || 0,
      accounts: response.trades?.length || 0,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Parse Equifax credit report response
   * @param {Object} response - Raw Equifax response
   * @returns {Object} Parsed report data
   */
  parseEquifaxReportResponse(response) {
    return {
      score: response.score?.value,
      asOfDate: new Date(response.asOfDate),
      personalInfo: response.subject,
      accounts: response.trades || [],
      inquiries: response.inquiries || [],
      publicRecords: response.publicRecords || [],
      summary: response.summary,
      status: response.status,
      errors: response.errors || []
    };
  }

  /**
   * Transform Equifax-specific errors
   * @param {Error} error - Original error
   * @returns {Error} Transformed error
   */
  transformEquifaxError(error) {
    const transformedError = new Error(error.message);
    transformedError.originalError = error;
    
    if (error.message.includes('Invalid ID')) {
      transformedError.code = 'INVALID_ID';
    } else if (error.message.includes('Invalid address')) {
      transformedError.code = 'INVALID_ADDRESS';
    } else if (error.message.includes('Subject not found')) {
      transformedError.code = 'CUSTOMER_NOT_FOUND';
    } else if (error.statusCode === 401) {
      transformedError.code = 'AUTHENTICATION_FAILED';
    } else if (error.statusCode === 429) {
      transformedError.code = 'RATE_LIMIT_EXCEEDED';
    } else {
      transformedError.code = 'EQUIFAX_API_ERROR';
    }
    
    return transformedError;
  }

  /**
   * Generate mock credit score for testing
   * @param {Object} customerData - Customer data
   * @returns {Object} Mock credit score response
   */
  getMockCreditScore(customerData) {
    const baseScore = 680;
    const variation = Math.floor(Math.random() * 200) - 100;
    const score = Math.max(300, Math.min(850, baseScore + variation));
    
    return {
      score: score,
      asOfDate: new Date(),
      inquiries: Math.floor(Math.random() * 6),
      accounts: Math.floor(Math.random() * 10) + 1,
      status: 'SUCCESS',
      errors: []
    };
  }

  /**
   * Generate mock credit report for testing
   * @param {Object} customerData - Customer data
   * @returns {Object} Mock credit report response
   */
  getMockCreditReport(customerData) {
    const scoreData = this.getMockCreditScore(customerData);
    
    return {
      ...scoreData,
      personalInfo: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        addresses: [customerData.address].filter(Boolean),
        phoneNumbers: [customerData.phoneNumber].filter(Boolean)
      },
      accounts: this.generateMockAccounts(),
      inquiries: this.generateMockInquiries(),
      publicRecords: [],
      summary: {
        totalAccounts: scoreData.accounts,
        openAccounts: Math.floor(scoreData.accounts * 0.8),
        totalBalance: Math.floor(Math.random() * 600000),
        totalInquiries: scoreData.inquiries,
        derogatory: Math.floor(Math.random() * 2)
      }
    };
  }

  /**
   * Generate mock account data
   * @returns {Array} Mock accounts
   */
  generateMockAccounts() {
    const accountTypes = ['Credit Card', 'Installment', 'Mortgage', 'Line of Credit'];
    const accounts = [];
    const count = Math.floor(Math.random() * 7) + 1;
    
    for (let i = 0; i < count; i++) {
      accounts.push({
        accountType: accountTypes[Math.floor(Math.random() * accountTypes.length)],
        creditor: `Financial Institution ${i + 1}`,
        balance: Math.floor(Math.random() * 250000),
        status: Math.random() > 0.1 ? 'Open' : 'Closed',
        openDate: new Date(Date.now() - Math.random() * 6 * 365 * 24 * 60 * 60 * 1000)
      });
    }
    
    return accounts;
  }

  /**
   * Generate mock inquiry data
   * @returns {Array} Mock inquiries
   */
  generateMockInquiries() {
    const inquiries = [];
    const count = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < count; i++) {
      inquiries.push({
        inquiryType: 'Credit Application',
        inquiryDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        creditor: `Institution ${i + 1}`
      });
    }
    
    return inquiries;
  }
}

module.exports = {
  BaseCreditBureauAdapter,
  CIBILAdapter,
  ExperianAdapter,
  EquifaxAdapter
};