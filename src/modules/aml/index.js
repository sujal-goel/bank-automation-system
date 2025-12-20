// AML Module - Anti-Money Laundering screening and monitoring

const { v4: uuidv4 } = require('uuid');
const { Transaction } = require('../../shared/interfaces');
const { NotificationService } = require('../../services/notification-service');

/**
 * AML Module - Handles anti-money laundering screening and monitoring
 */
class AMLModule {
  constructor(config = {}) {
    this.config = {
      enableRealTimeScreening: config.enableRealTimeScreening !== false,
      suspiciousAmountThreshold: config.suspiciousAmountThreshold || 10000,
      rapidTransactionThreshold: config.rapidTransactionThreshold || 5,
      rapidTransactionWindow: config.rapidTransactionWindow || 3600000, // 1 hour in ms
      highRiskCountries: config.highRiskCountries || ['KP', 'IR', 'SY'],
      ...config
    };

    // Initialize components
    this.transactionMonitor = new TransactionMonitor(this.config);
    this.patternDetector = new PatternDetector(this.config);
    this.sanctionScreener = new SanctionScreener(this.config);
    this.sarGenerator = new SARGenerator(this.config);
    this.notificationService = new NotificationService(config.notificationConfig);

    // Metrics
    this.metrics = {
      totalTransactionsScreened: 0,
      flaggedTransactions: 0,
      sarsGenerated: 0,
      sanctionHits: 0
    };
  }

  /**
   * Screen transaction for AML compliance
   * @param {Transaction} transaction - Transaction to screen
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>} Screening result
   */
  async screenTransaction(transaction, customer) {
    if (!this.config.enableRealTimeScreening) {
      return {
        success: true,
        transactionId: transaction.transactionId,
        screened: false,
        message: 'Real-time screening is disabled'
      };
    }

    try {
      this.metrics.totalTransactionsScreened++;

      // Perform sanction screening
      const sanctionResult = await this.sanctionScreener.screen(transaction, customer);
      
      // Monitor transaction patterns
      const monitoringResult = await this.transactionMonitor.monitor(transaction, customer);
      
      // Detect suspicious patterns
      const patternResult = await this.patternDetector.detect(transaction, customer);

      // Combine results
      const isSuspicious = sanctionResult.hit || monitoringResult.suspicious || patternResult.suspicious;
      const flags = [
        ...sanctionResult.flags,
        ...monitoringResult.flags,
        ...patternResult.flags
      ];

      // Add flags to transaction
      flags.forEach(flag => transaction.addAMLFlag(flag));

      if (isSuspicious) {
        this.metrics.flaggedTransactions++;
        
        // Generate SAR if needed
        if (this.shouldGenerateSAR(flags)) {
          const sar = await this.sarGenerator.generate(transaction, customer, flags);
          this.metrics.sarsGenerated++;
          
          // Alert compliance officer
          await this.alertComplianceOfficer(transaction, customer, flags, sar);
        }
      }

      return {
        success: true,
        transactionId: transaction.transactionId,
        screened: true,
        suspicious: isSuspicious,
        flags,
        sanctionHit: sanctionResult.hit,
        riskScore: this.calculateRiskScore(flags),
        requiresReview: isSuspicious
      };

    } catch (error) {
      return {
        success: false,
        transactionId: transaction.transactionId,
        error: error.message
      };
    }
  }

  /**
   * Determine if SAR should be generated
   * @param {Array} flags - AML flags
   * @returns {boolean} Whether to generate SAR
   */
  shouldGenerateSAR(flags) {
    const criticalFlags = ['SANCTION_HIT', 'STRUCTURING', 'HIGH_RISK_COUNTRY'];
    return flags.some(flag => criticalFlags.includes(flag));
  }

  /**
   * Calculate risk score based on flags
   * @param {Array} flags - AML flags
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(flags) {
    const flagWeights = {
      'SANCTION_HIT': 100,
      'HIGH_RISK_COUNTRY': 80,
      'STRUCTURING': 70,
      'LARGE_AMOUNT': 50,
      'RAPID_TRANSACTIONS': 40,
      'UNUSUAL_PATTERN': 30
    };

    let score = 0;
    flags.forEach(flag => {
      score = Math.max(score, flagWeights[flag] || 20);
    });

    return Math.min(score, 100);
  }

  /**
   * Alert compliance officer about suspicious activity
   * @param {Transaction} transaction - Transaction
   * @param {Object} customer - Customer
   * @param {Array} flags - AML flags
   * @param {Object} sar - SAR object
   * @returns {Promise<Object>} Alert result
   */
  async alertComplianceOfficer(transaction, customer, flags, sar) {
    const alertMessage = `
SUSPICIOUS ACTIVITY ALERT

Transaction ID: ${transaction.transactionId}
Customer: ${customer.personalInfo.firstName} ${customer.personalInfo.lastName}
Amount: ${transaction.amount} ${transaction.currency}
Flags: ${flags.join(', ')}
SAR ID: ${sar ? sar.sarId : 'N/A'}

Immediate review required.
    `.trim();

    try {
      // In real implementation, would send to compliance system
      await this.notificationService.sendEmail(
        'compliance@securebank.com',
        'URGENT: Suspicious Activity Detected',
        alertMessage
      );

      return {
        success: true,
        alertSent: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get AML statistics
   * @returns {Object} AML statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      flagRate: this.metrics.totalTransactionsScreened > 0 
        ? (this.metrics.flaggedTransactions / this.metrics.totalTransactionsScreened * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

/**
 * Transaction Monitor - Real-time transaction screening
 */
class TransactionMonitor {
  constructor(config) {
    this.config = config;
    this.transactionHistory = new Map(); // customerId -> transactions[]
  }

  /**
   * Monitor transaction for suspicious activity
   * @param {Transaction} transaction - Transaction to monitor
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>} Monitoring result
   */
  async monitor(transaction, customer) {
    const flags = [];
    let suspicious = false;

    // Check large amount threshold
    if (transaction.amount >= this.config.suspiciousAmountThreshold) {
      flags.push('LARGE_AMOUNT');
      suspicious = true;
    }

    // Check rapid transactions
    const recentTransactions = this.getRecentTransactions(customer.customerId);
    if (recentTransactions.length >= this.config.rapidTransactionThreshold) {
      flags.push('RAPID_TRANSACTIONS');
      suspicious = true;
    }

    // Store transaction in history
    this.addTransactionToHistory(customer.customerId, transaction);

    return {
      suspicious,
      flags,
      recentTransactionCount: recentTransactions.length
    };
  }

  /**
   * Get recent transactions for customer
   * @param {string} customerId - Customer ID
   * @returns {Array} Recent transactions
   */
  getRecentTransactions(customerId) {
    const transactions = this.transactionHistory.get(customerId) || [];
    const cutoffTime = Date.now() - this.config.rapidTransactionWindow;
    
    return transactions.filter(tx => {
      const txTime = tx.timestamp || tx.processedAt || new Date();
      return txTime.getTime() > cutoffTime;
    });
  }

  /**
   * Add transaction to history
   * @param {string} customerId - Customer ID
   * @param {Transaction} transaction - Transaction
   */
  addTransactionToHistory(customerId, transaction) {
    if (!this.transactionHistory.has(customerId)) {
      this.transactionHistory.set(customerId, []);
    }
    
    const transactions = this.transactionHistory.get(customerId);
    transactions.push({
      ...transaction,
      timestamp: new Date()
    });

    // Keep only recent transactions
    const cutoffTime = Date.now() - this.config.rapidTransactionWindow * 2;
    this.transactionHistory.set(
      customerId,
      transactions.filter(tx => {
        const txTime = tx.timestamp || tx.processedAt || new Date();
        return txTime.getTime() > cutoffTime;
      })
    );
  }
}

/**
 * Pattern Detector - Detects suspicious activity patterns using ML algorithms
 */
class PatternDetector {
  constructor(config) {
    this.config = config;
  }

  /**
   * Detect suspicious patterns in transaction
   * @param {Transaction} transaction - Transaction to analyze
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>} Detection result
   */
  async detect(transaction, customer) {
    const flags = [];
    let suspicious = false;

    // Check for structuring (amounts just below reporting threshold)
    if (this.isStructuring(transaction.amount)) {
      flags.push('STRUCTURING');
      suspicious = true;
    }

    // Check for unusual patterns (simplified ML simulation)
    if (this.isUnusualPattern(transaction, customer)) {
      flags.push('UNUSUAL_PATTERN');
      suspicious = true;
    }

    return {
      suspicious,
      flags
    };
  }

  /**
   * Check if transaction amount suggests structuring
   * @param {number} amount - Transaction amount
   * @returns {boolean} Whether structuring is suspected
   */
  isStructuring(amount) {
    // Structuring: amounts just below $10,000 reporting threshold
    const threshold = this.config.suspiciousAmountThreshold || 10000;
    const structuringRange = threshold * 0.1; // 10% below threshold
    
    return amount >= (threshold - structuringRange) && amount < threshold;
  }

  /**
   * Check for unusual transaction patterns
   * @param {Transaction} transaction - Transaction
   * @param {Object} customer - Customer
   * @returns {boolean} Whether pattern is unusual
   */
  isUnusualPattern(transaction, customer) {
    // Simplified pattern detection
    // In real implementation, would use ML models
    
    // Check for round amounts (potential indicator)
    const isRoundAmount = transaction.amount % 1000 === 0 && transaction.amount >= 5000;
    
    // Check transaction type patterns
    const isUnusualType = transaction.transactionType === 'WITHDRAWAL' && 
                          transaction.amount > 5000;

    return isRoundAmount || isUnusualType;
  }
}

/**
 * Sanction Screener - Screens against global sanctions lists
 */
class SanctionScreener {
  constructor(config) {
    this.config = config;
    this.sanctionLists = this.loadSanctionLists();
  }

  /**
   * Load sanction lists (mock implementation)
   * @returns {Object} Sanction lists
   */
  loadSanctionLists() {
    // Mock sanction lists - in real implementation, would load from databases
    return {
      individuals: new Set([
        'SANCTIONED_PERSON_1',
        'SANCTIONED_PERSON_2'
      ]),
      entities: new Set([
        'SANCTIONED_COMPANY_1',
        'SANCTIONED_COMPANY_2'
      ]),
      countries: new Set(this.config.highRiskCountries || ['KP', 'IR', 'SY'])
    };
  }

  /**
   * Screen transaction against sanction lists
   * @param {Transaction} transaction - Transaction to screen
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>} Screening result
   */
  async screen(transaction, customer) {
    const flags = [];
    let hit = false;

    // Screen customer name
    const customerName = `${customer.personalInfo.firstName} ${customer.personalInfo.lastName}`.toUpperCase();
    if (this.checkSanctionList(customerName, this.sanctionLists.individuals)) {
      flags.push('SANCTION_HIT');
      hit = true;
    }

    // Screen counterparty if present
    if (transaction.counterparty && transaction.counterparty.name) {
      const counterpartyName = transaction.counterparty.name.toUpperCase();
      if (this.checkSanctionList(counterpartyName, this.sanctionLists.individuals) ||
          this.checkSanctionList(counterpartyName, this.sanctionLists.entities)) {
        flags.push('SANCTION_HIT');
        hit = true;
      }
    }

    // Screen country
    const customerCountry = customer.personalInfo.nationality;
    if (this.sanctionLists.countries.has(customerCountry)) {
      flags.push('HIGH_RISK_COUNTRY');
      hit = true;
    }

    return {
      hit,
      flags,
      screenedAt: new Date()
    };
  }

  /**
   * Check if name is in sanction list
   * @param {string} name - Name to check
   * @param {Set} sanctionList - Sanction list
   * @returns {boolean} Whether name is sanctioned
   */
  checkSanctionList(name, sanctionList) {
    // Simple exact match - real implementation would use fuzzy matching
    return sanctionList.has(name);
  }
}

/**
 * SAR Generator - Generates Suspicious Activity Reports
 */
class SARGenerator {
  constructor(config) {
    this.config = config;
    this.sarDatabase = new Map();
  }

  /**
   * Generate Suspicious Activity Report
   * @param {Transaction} transaction - Suspicious transaction
   * @param {Object} customer - Customer object
   * @param {Array} flags - AML flags
   * @returns {Promise<Object>} SAR object
   */
  async generate(transaction, customer, flags) {
    const sar = {
      sarId: uuidv4(),
      transactionId: transaction.transactionId,
      customerId: customer.customerId,
      customerName: `${customer.personalInfo.firstName} ${customer.personalInfo.lastName}`,
      amount: transaction.amount,
      currency: transaction.currency,
      transactionType: transaction.transactionType,
      flags,
      description: this.generateDescription(transaction, customer, flags),
      filingDate: new Date(),
      status: 'FILED',
      reportedBy: 'SYSTEM',
      metadata: {
        counterparty: transaction.counterparty,
        transactionDescription: transaction.description
      }
    };

    // Store SAR
    this.sarDatabase.set(sar.sarId, sar);

    return sar;
  }

  /**
   * Generate SAR description
   * @param {Transaction} transaction - Transaction
   * @param {Object} customer - Customer
   * @param {Array} flags - AML flags
   * @returns {string} SAR description
   */
  generateDescription(transaction, customer, flags) {
    const flagDescriptions = {
      'SANCTION_HIT': 'Customer or counterparty appears on sanctions list',
      'HIGH_RISK_COUNTRY': 'Transaction involves high-risk jurisdiction',
      'STRUCTURING': 'Transaction amount suggests potential structuring',
      'LARGE_AMOUNT': 'Transaction exceeds large amount threshold',
      'RAPID_TRANSACTIONS': 'Multiple rapid transactions detected',
      'UNUSUAL_PATTERN': 'Transaction exhibits unusual patterns'
    };

    const descriptions = flags.map(flag => flagDescriptions[flag] || flag).join('; ');
    
    return `Suspicious activity detected for customer ${customer.customerId}. ` +
           `Transaction ${transaction.transactionId} for ${transaction.amount} ${transaction.currency}. ` +
           `Reasons: ${descriptions}.`;
  }

  /**
   * Get SAR by ID
   * @param {string} sarId - SAR ID
   * @returns {Object} SAR object
   */
  getSAR(sarId) {
    return this.sarDatabase.get(sarId);
  }

  /**
   * Get all SARs
   * @returns {Array} Array of SARs
   */
  getAllSARs() {
    return Array.from(this.sarDatabase.values());
  }
}

module.exports = {
  AMLModule,
  TransactionMonitor,
  PatternDetector,
  SanctionScreener,
  SARGenerator
};
