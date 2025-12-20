/**
 * Credit Bureau Mock Service
 * Provides realistic mock responses for testing and development
 * Simulates various scenarios including errors, delays, and edge cases
 */
class CreditBureauMockService {
  constructor(options = {}) {
    this.config = {
      simulateDelay: options.simulateDelay !== false, // Default true
      minDelay: options.minDelay || 100,
      maxDelay: options.maxDelay || 2000,
      errorRate: options.errorRate || 0.1, // 10% error rate
      timeoutRate: options.timeoutRate || 0.05, // 5% timeout rate
      ...options
    };

    // Predefined customer scenarios for consistent testing
    this.scenarios = {
      'excellent-credit': {
        creditScore: 820,
        riskCategory: 'EXCELLENT',
        accounts: 8,
        inquiries: 1,
        derogatory: 0
      },
      'good-credit': {
        creditScore: 740,
        riskCategory: 'GOOD',
        accounts: 6,
        inquiries: 2,
        derogatory: 0
      },
      'fair-credit': {
        creditScore: 650,
        riskCategory: 'FAIR',
        accounts: 4,
        inquiries: 4,
        derogatory: 1
      },
      'poor-credit': {
        creditScore: 580,
        riskCategory: 'POOR',
        accounts: 3,
        inquiries: 6,
        derogatory: 3
      },
      'no-credit': {
        creditScore: null,
        riskCategory: 'NO_HISTORY',
        accounts: 0,
        inquiries: 0,
        derogatory: 0
      },
      'error-customer': {
        error: 'CUSTOMER_NOT_FOUND',
        message: 'Customer not found in bureau database'
      },
      'timeout-customer': {
        error: 'TIMEOUT',
        message: 'Request timeout'
      }
    };

    console.log('Credit Bureau Mock Service initialized with error rate:', this.config.errorRate);
  }

  /**
   * Get mock credit score for any bureau
   * @param {string} bureau - Bureau name
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Mock credit score response
   */
  async getMockCreditScore(bureau, customerData) {
    await this.simulateNetworkDelay();
    
    // Check for predefined scenarios
    const scenario = this.getCustomerScenario(customerData);
    if (scenario) {
      if (scenario.error) {
        throw this.createMockError(scenario.error, scenario.message);
      }
      return this.createMockScoreResponse(bureau, scenario, customerData);
    }

    // Simulate random errors
    if (Math.random() < this.config.errorRate) {
      throw this.createRandomError();
    }

    // Generate random but realistic credit score
    const baseScore = this.generateRealisticCreditScore(customerData);
    const scenario_data = {
      creditScore: baseScore,
      riskCategory: this.mapScoreToRiskCategory(baseScore),
      accounts: Math.floor(Math.random() * 12) + 1,
      inquiries: Math.floor(Math.random() * 8),
      derogatory: Math.floor(Math.random() * 4)
    };

    return this.createMockScoreResponse(bureau, scenario_data, customerData);
  }

  /**
   * Get mock credit report for any bureau
   * @param {string} bureau - Bureau name
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Mock credit report response
   */
  async getMockCreditReport(bureau, customerData) {
    await this.simulateNetworkDelay();
    
    // Get score data first
    const scoreData = await this.getMockCreditScore(bureau, customerData);
    
    // Enhance with full report data
    return {
      ...scoreData,
      personalInfo: this.generateMockPersonalInfo(customerData),
      accounts: this.generateMockAccounts(scoreData.accounts || 5),
      inquiries: this.generateMockInquiries(scoreData.inquiries || 2),
      publicRecords: this.generateMockPublicRecords(scoreData.derogatory || 0),
      summary: this.generateMockSummary(scoreData),
      reportSections: {
        personalInfo: true,
        accounts: true,
        inquiries: true,
        publicRecords: true,
        score: true
      }
    };
  }

  /**
   * Get customer scenario based on identifiers
   * @param {Object} customerData - Customer data
   * @returns {Object|null} Scenario data or null
   */
  getCustomerScenario(customerData) {
    // Check for scenario indicators in customer data
    const email = customerData.email || '';
    const lastName = customerData.lastName || '';
    
    // Email-based scenarios
    if (email.includes('excellent')) return this.scenarios['excellent-credit'];
    if (email.includes('good')) return this.scenarios['good-credit'];
    if (email.includes('fair')) return this.scenarios['fair-credit'];
    if (email.includes('poor')) return this.scenarios['poor-credit'];
    if (email.includes('nocredit')) return this.scenarios['no-credit'];
    if (email.includes('error')) return this.scenarios['error-customer'];
    if (email.includes('timeout')) return this.scenarios['timeout-customer'];
    
    // Last name-based scenarios
    if (lastName.toLowerCase().includes('excellent')) return this.scenarios['excellent-credit'];
    if (lastName.toLowerCase().includes('error')) return this.scenarios['error-customer'];
    if (lastName.toLowerCase().includes('timeout')) return this.scenarios['timeout-customer'];
    
    return null;
  }

  /**
   * Generate realistic credit score based on customer data
   * @param {Object} customerData - Customer data
   * @returns {number} Credit score
   */
  generateRealisticCreditScore(customerData) {
    let baseScore = 650; // Average starting point
    
    // Age factor (older customers tend to have higher scores)
    if (customerData.dateOfBirth) {
      const age = new Date().getFullYear() - customerData.dateOfBirth.getFullYear();
      if (age > 50) baseScore += 50;
      else if (age > 30) baseScore += 25;
      else if (age < 25) baseScore -= 25;
    }
    
    // Add some randomness
    const variation = Math.floor(Math.random() * 200) - 100; // -100 to +100
    baseScore += variation;
    
    // Ensure score is within valid range
    return Math.max(300, Math.min(850, baseScore));
  }

  /**
   * Map credit score to risk category
   * @param {number} score - Credit score
   * @returns {string} Risk category
   */
  mapScoreToRiskCategory(score) {
    if (score >= 800) return 'EXCELLENT';
    if (score >= 740) return 'VERY_GOOD';
    if (score >= 670) return 'GOOD';
    if (score >= 580) return 'FAIR';
    return 'POOR';
  }

  /**
   * Create mock score response in bureau-specific format
   * @param {string} bureau - Bureau name
   * @param {Object} scenario - Scenario data
   * @param {Object} customerData - Customer data
   * @returns {Object} Mock score response
   */
  createMockScoreResponse(bureau, scenario, customerData) {
    const baseResponse = {
      bureau,
      timestamp: new Date(),
      creditScore: scenario.creditScore,
      riskCategory: scenario.riskCategory,
      lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
      status: 'SUCCESS'
    };

    // Bureau-specific formatting
    switch (bureau.toLowerCase()) {
      case 'cibil':
        return {
          ...baseResponse,
          score: scenario.creditScore,
          scoreRange: { min: 300, max: 900 },
          reportDate: baseResponse.lastUpdated,
          inquiryCount: scenario.inquiries,
          accountCount: scenario.accounts
        };

      case 'experian':
        return {
          ...baseResponse,
          creditScore: scenario.creditScore,
          scoreRange: { min: 300, max: 850 },
          lastUpdated: baseResponse.lastUpdated,
          totalInquiries: scenario.inquiries,
          totalAccounts: scenario.accounts
        };

      case 'equifax':
        return {
          ...baseResponse,
          score: scenario.creditScore,
          scoreRange: { min: 300, max: 850 },
          asOfDate: baseResponse.lastUpdated,
          inquiries: scenario.inquiries,
          accounts: scenario.accounts
        };

      default:
        return baseResponse;
    }
  }

  /**
   * Generate mock personal information
   * @param {Object} customerData - Customer data
   * @returns {Object} Mock personal info
   */
  generateMockPersonalInfo(customerData) {
    return {
      name: `${customerData.firstName} ${customerData.lastName}`,
      addresses: [
        {
          street: customerData.address?.street || '123 Main St',
          city: customerData.address?.city || 'Anytown',
          state: customerData.address?.state || 'ST',
          zipCode: customerData.address?.zipCode || '12345',
          type: 'Current',
          reportedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        }
      ],
      employers: [
        {
          name: 'ABC Corporation',
          position: 'Software Engineer',
          reportedDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000)
        }
      ],
      phoneNumbers: [
        {
          number: customerData.phoneNumber || '555-123-4567',
          type: 'Mobile',
          reportedDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
        }
      ]
    };
  }

  /**
   * Generate mock account data
   * @param {number} count - Number of accounts to generate
   * @returns {Array} Mock accounts
   */
  generateMockAccounts(count) {
    const accountTypes = [
      'Credit Card', 'Personal Loan', 'Auto Loan', 'Mortgage', 
      'Student Loan', 'Line of Credit', 'Retail Card'
    ];
    
    const accounts = [];
    
    for (let i = 0; i < count; i++) {
      const accountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
      const openDate = new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000);
      const isOpen = Math.random() > 0.2; // 80% chance of being open
      
      accounts.push({
        accountType,
        creditorName: `${accountType} Provider ${i + 1}`,
        accountNumber: `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        balance: isOpen ? Math.floor(Math.random() * 50000) : 0,
        creditLimit: accountType.includes('Card') || accountType.includes('Line') 
          ? Math.floor(Math.random() * 25000) + 5000 : null,
        status: isOpen ? 'Open' : 'Closed',
        paymentStatus: Math.random() > 0.15 ? 'Current' : 'Late',
        openDate,
        lastPaymentDate: isOpen ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) : null,
        monthsReviewed: Math.floor(Math.random() * 60) + 12
      });
    }
    
    return accounts;
  }

  /**
   * Generate mock inquiry data
   * @param {number} count - Number of inquiries to generate
   * @returns {Array} Mock inquiries
   */
  generateMockInquiries(count) {
    const inquiryTypes = [
      'Credit Card Application', 'Auto Loan', 'Personal Loan', 
      'Mortgage', 'Account Review', 'Insurance Quote'
    ];
    
    const inquiries = [];
    
    for (let i = 0; i < count; i++) {
      inquiries.push({
        inquiryType: inquiryTypes[Math.floor(Math.random() * inquiryTypes.length)],
        inquirer: `Financial Institution ${i + 1}`,
        inquiryDate: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000), // Within 2 years
        type: Math.random() > 0.3 ? 'Hard' : 'Soft'
      });
    }
    
    return inquiries;
  }

  /**
   * Generate mock public records
   * @param {number} count - Number of records to generate
   * @returns {Array} Mock public records
   */
  generateMockPublicRecords(count) {
    const recordTypes = ['Bankruptcy', 'Tax Lien', 'Judgment', 'Foreclosure'];
    const records = [];
    
    for (let i = 0; i < count; i++) {
      records.push({
        recordType: recordTypes[Math.floor(Math.random() * recordTypes.length)],
        filingDate: new Date(Date.now() - Math.random() * 7 * 365 * 24 * 60 * 60 * 1000), // Within 7 years
        amount: Math.floor(Math.random() * 100000) + 1000,
        status: Math.random() > 0.5 ? 'Satisfied' : 'Unsatisfied',
        court: `District Court ${i + 1}`
      });
    }
    
    return records;
  }

  /**
   * Generate mock summary data
   * @param {Object} scoreData - Score data
   * @returns {Object} Mock summary
   */
  generateMockSummary(scoreData) {
    const totalAccounts = scoreData.accounts || 5;
    const openAccounts = Math.floor(totalAccounts * 0.8);
    
    return {
      totalAccounts,
      openAccounts,
      closedAccounts: totalAccounts - openAccounts,
      totalBalance: Math.floor(Math.random() * 500000),
      totalCreditLimit: Math.floor(Math.random() * 100000) + 50000,
      totalInquiries: scoreData.inquiries || 2,
      derogatoryMarks: scoreData.derogatory || 0,
      oldestAccount: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000),
      newestAccount: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Simulate network delay
   * @returns {Promise} Promise that resolves after delay
   */
  async simulateNetworkDelay() {
    if (!this.config.simulateDelay) return;
    
    // Simulate timeout
    if (Math.random() < this.config.timeoutRate) {
      const delay = this.config.maxDelay * 2; // Extra long delay for timeout
      await new Promise(resolve => setTimeout(resolve, delay));
      throw this.createMockError('TIMEOUT', 'Request timeout');
    }
    
    const delay = Math.random() * (this.config.maxDelay - this.config.minDelay) + this.config.minDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Create mock error
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @returns {Error} Mock error
   */
  createMockError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.timestamp = new Date();
    return error;
  }

  /**
   * Create random error for testing
   * @returns {Error} Random error
   */
  createRandomError() {
    const errors = [
      { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found in bureau database' },
      { code: 'INVALID_SSN', message: 'Invalid Social Security Number format' },
      { code: 'INVALID_DOB', message: 'Invalid date of birth' },
      { code: 'AUTHENTICATION_FAILED', message: 'API authentication failed' },
      { code: 'RATE_LIMIT_EXCEEDED', message: 'API rate limit exceeded' },
      { code: 'SERVICE_UNAVAILABLE', message: 'Bureau service temporarily unavailable' }
    ];
    
    const randomError = errors[Math.floor(Math.random() * errors.length)];
    return this.createMockError(randomError.code, randomError.message);
  }

  /**
   * Get mock service statistics
   * @returns {Object} Service statistics
   */
  getStatistics() {
    return {
      config: this.config,
      scenarios: Object.keys(this.scenarios),
      timestamp: new Date()
    };
  }

  /**
   * Reset mock service configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Mock service configuration updated:', this.config);
  }
}

module.exports = CreditBureauMockService;