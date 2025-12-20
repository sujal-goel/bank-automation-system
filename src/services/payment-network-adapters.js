// Payment Network Integration Adapters
// Implements SWIFT, RTGS, NEFT, and UPI integration adapters with transaction status tracking

const { PaymentRail, PaymentStatus, Currency } = require('../shared/types');
const CircuitBreaker = require('./circuit-breaker');

/**
 * Base Payment Network Adapter
 * Provides common functionality for all payment network adapters
 */
class BasePaymentNetworkAdapter {
  constructor(networkName, config = {}) {
    this.networkName = networkName;
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000
    });
    this.transactionStatus = new Map();
  }

  /**
   * Validates payment instruction format
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Object} Validation result
   */
  validatePaymentInstruction(paymentInstruction) {
    const errors = [];

    if (!paymentInstruction.amount || paymentInstruction.amount <= 0) {
      errors.push('Invalid amount');
    }

    if (!paymentInstruction.fromAccount) {
      errors.push('From account is required');
    }

    if (!paymentInstruction.toAccount) {
      errors.push('To account is required');
    }

    if (!paymentInstruction.currency) {
      errors.push('Currency is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Tracks transaction status
   * @param {string} transactionId - Transaction ID
   * @param {string} status - Transaction status
   * @param {Object} metadata - Additional metadata
   */
  updateTransactionStatus(transactionId, status, metadata = {}) {
    this.transactionStatus.set(transactionId, {
      status,
      timestamp: new Date(),
      metadata,
      networkName: this.networkName
    });
  }

  /**
   * Gets transaction status
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Transaction status information
   */
  getTransactionStatus(transactionId) {
    return this.transactionStatus.get(transactionId) || {
      status: 'NOT_FOUND',
      timestamp: null,
      metadata: {},
      networkName: this.networkName
    };
  }

  /**
   * Simulates network delay
   * @param {number} delay - Delay in milliseconds
   * @returns {Promise} Promise that resolves after delay
   */
  simulateNetworkDelay(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Generates transaction reference
   * @param {string} prefix - Reference prefix
   * @returns {string} Transaction reference
   */
  generateTransactionReference(prefix = 'TXN') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }
}

/**
 * SWIFT Network Adapter
 * Handles international wire transfers through SWIFT network
 */
class SWIFTAdapter extends BasePaymentNetworkAdapter {
  constructor(config = {}) {
    super('SWIFT', {
      timeout: 60000,
      processingTime: '1-3 business days',
      supportedCurrencies: [Currency.USD, Currency.EUR, Currency.GBP],
      fees: { base: 25, percentage: 0.1 },
      ...config
    });
  }

  /**
   * Validates SWIFT-specific payment instruction
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Object} Validation result
   */
  validatePaymentInstruction(paymentInstruction) {
    const baseValidation = super.validatePaymentInstruction(paymentInstruction);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const errors = [];

    // SWIFT-specific validations
    if (!paymentInstruction.swiftCode) {
      errors.push('SWIFT code is required for international transfers');
    }

    if (!paymentInstruction.correspondentBank) {
      errors.push('Correspondent bank information is required');
    }

    if (!this.config.supportedCurrencies.includes(paymentInstruction.currency)) {
      errors.push(`Currency ${paymentInstruction.currency} not supported by SWIFT adapter`);
    }

    if (paymentInstruction.amount < 100) {
      errors.push('Minimum amount for SWIFT transfer is 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Processes SWIFT payment
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentInstruction) {
    const transactionId = this.generateTransactionReference('SWIFT');
    
    try {
      // Validate payment instruction
      const validation = this.validatePaymentInstruction(paymentInstruction);
      if (!validation.isValid) {
        this.updateTransactionStatus(transactionId, PaymentStatus.FAILED, {
          errors: validation.errors
        });
        return {
          success: false,
          transactionId,
          errors: validation.errors
        };
      }

      this.updateTransactionStatus(transactionId, PaymentStatus.PROCESSING, {
        swiftCode: paymentInstruction.swiftCode,
        correspondentBank: paymentInstruction.correspondentBank
      });

      // Execute through circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        // Simulate SWIFT network processing
        await this.simulateNetworkDelay(3000);
        
        // Simulate potential network failures
        if (Math.random() < 0.05) { // 5% failure rate
          throw new Error('SWIFT network timeout');
        }

        return await this.executeSWIFTTransfer(paymentInstruction, transactionId);
      });

      this.updateTransactionStatus(transactionId, PaymentStatus.COMPLETED, {
        swiftReference: result.swiftReference,
        fees: result.fees
      });

      return {
        success: true,
        transactionId,
        swiftReference: result.swiftReference,
        fees: result.fees,
        processingTime: this.config.processingTime,
        networkName: this.networkName
      };

    } catch (error) {
      this.updateTransactionStatus(transactionId, PaymentStatus.FAILED, {
        error: error.message
      });

      return {
        success: false,
        transactionId,
        error: error.message,
        networkName: this.networkName
      };
    }
  }

  /**
   * Executes SWIFT transfer (mock implementation)
   * @param {Object} paymentInstruction - Payment instruction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transfer result
   */
  async executeSWIFTTransfer(paymentInstruction, transactionId) {
    // Mock SWIFT processing
    const fees = this.calculateFees(paymentInstruction.amount);
    const swiftReference = `FT${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return {
      swiftReference,
      fees,
      processedAt: new Date()
    };
  }

  /**
   * Calculates SWIFT transfer fees
   * @param {number} amount - Transfer amount
   * @returns {number} Total fees
   */
  calculateFees(amount) {
    const baseFee = this.config.fees.base;
    const percentageFee = (amount * this.config.fees.percentage) / 100;
    return Math.round((baseFee + percentageFee) * 100) / 100;
  }

  /**
   * Queries SWIFT transaction status
   * @param {string} swiftReference - SWIFT reference
   * @returns {Promise<Object>} Status information
   */
  async queryTransactionStatus(swiftReference) {
    try {
      // Mock SWIFT status query
      await this.simulateNetworkDelay(1000);
      
      return {
        swiftReference,
        status: 'COMPLETED',
        valueDate: new Date(),
        charges: 25.50,
        networkName: this.networkName
      };
    } catch (error) {
      return {
        swiftReference,
        status: 'ERROR',
        error: error.message,
        networkName: this.networkName
      };
    }
  }
}

/**
 * RTGS (Real Time Gross Settlement) Adapter
 * Handles high-value domestic transfers in real-time
 */
class RTGSAdapter extends BasePaymentNetworkAdapter {
  constructor(config = {}) {
    super('RTGS', {
      timeout: 10000,
      processingTime: 'Real-time',
      minAmount: 200000,
      maxAmount: 50000000,
      operatingHours: { start: 9, end: 16 }, // 9 AM to 4 PM
      fees: { base: 5, percentage: 0.05 },
      ...config
    });
  }

  /**
   * Validates RTGS-specific payment instruction
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Object} Validation result
   */
  validatePaymentInstruction(paymentInstruction) {
    const baseValidation = super.validatePaymentInstruction(paymentInstruction);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const errors = [];

    // RTGS-specific validations
    if (paymentInstruction.amount < this.config.minAmount) {
      errors.push(`Minimum amount for RTGS is ${this.config.minAmount}`);
    }

    if (paymentInstruction.amount > this.config.maxAmount) {
      errors.push(`Maximum amount for RTGS is ${this.config.maxAmount}`);
    }

    if (!this.isWithinOperatingHours()) {
      errors.push('RTGS is only available during banking hours (9 AM - 4 PM)');
    }

    if (!paymentInstruction.ifscCode) {
      errors.push('IFSC code is required for RTGS transfers');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks if current time is within RTGS operating hours
   * @returns {boolean} True if within operating hours
   */
  isWithinOperatingHours() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= this.config.operatingHours.start && hour < this.config.operatingHours.end;
  }

  /**
   * Processes RTGS payment
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentInstruction) {
    const transactionId = this.generateTransactionReference('RTGS');
    
    try {
      // Validate payment instruction
      const validation = this.validatePaymentInstruction(paymentInstruction);
      if (!validation.isValid) {
        this.updateTransactionStatus(transactionId, PaymentStatus.FAILED, {
          errors: validation.errors
        });
        return {
          success: false,
          transactionId,
          errors: validation.errors
        };
      }

      this.updateTransactionStatus(transactionId, PaymentStatus.PROCESSING, {
        ifscCode: paymentInstruction.ifscCode
      });

      // Execute through circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        // Simulate RTGS processing
        await this.simulateNetworkDelay(500);
        
        // Simulate potential failures
        if (Math.random() < 0.02) { // 2% failure rate
          throw new Error('RTGS system temporarily unavailable');
        }

        return await this.executeRTGSTransfer(paymentInstruction, transactionId);
      });

      this.updateTransactionStatus(transactionId, PaymentStatus.COMPLETED, {
        rtgsReference: result.rtgsReference,
        fees: result.fees
      });

      return {
        success: true,
        transactionId,
        rtgsReference: result.rtgsReference,
        fees: result.fees,
        processingTime: this.config.processingTime,
        networkName: this.networkName
      };

    } catch (error) {
      this.updateTransactionStatus(transactionId, PaymentStatus.FAILED, {
        error: error.message
      });

      return {
        success: false,
        transactionId,
        error: error.message,
        networkName: this.networkName
      };
    }
  }

  /**
   * Executes RTGS transfer (mock implementation)
   * @param {Object} paymentInstruction - Payment instruction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transfer result
   */
  async executeRTGSTransfer(paymentInstruction, transactionId) {
    // Mock RTGS processing
    const fees = this.calculateFees(paymentInstruction.amount);
    const rtgsReference = `R${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    return {
      rtgsReference,
      fees,
      processedAt: new Date()
    };
  }

  /**
   * Calculates RTGS transfer fees
   * @param {number} amount - Transfer amount
   * @returns {number} Total fees
   */
  calculateFees(amount) {
    const baseFee = this.config.fees.base;
    const percentageFee = (amount * this.config.fees.percentage) / 100;
    return Math.round((baseFee + percentageFee) * 100) / 100;
  }
}

/**
 * NEFT (National Electronic Funds Transfer) Adapter
 * Handles medium-value domestic transfers with batch processing
 */
class NEFTAdapter extends BasePaymentNetworkAdapter {
  constructor(config = {}) {
    super('NEFT', {
      timeout: 15000,
      processingTime: '2-4 hours',
      minAmount: 1,
      maxAmount: 1000000,
      batchTimes: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], // Hourly batches
      fees: { base: 2, percentage: 0.02 },
      ...config
    });
  }

  /**
   * Validates NEFT-specific payment instruction
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Object} Validation result
   */
  validatePaymentInstruction(paymentInstruction) {
    const baseValidation = super.validatePaymentInstruction(paymentInstruction);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const errors = [];

    // NEFT-specific validations
    if (paymentInstruction.amount < this.config.minAmount) {
      errors.push(`Minimum amount for NEFT is ${this.config.minAmount}`);
    }

    if (paymentInstruction.amount > this.config.maxAmount) {
      errors.push(`Maximum amount for NEFT is ${this.config.maxAmount}`);
    }

    if (!paymentInstruction.ifscCode) {
      errors.push('IFSC code is required for NEFT transfers');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets next NEFT batch time
   * @returns {Date} Next batch processing time
   */
  getNextBatchTime() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next batch time
    const nextBatchHour = this.config.batchTimes.find(hour => hour > currentHour);
    
    if (nextBatchHour) {
      const nextBatch = new Date(now);
      nextBatch.setHours(nextBatchHour, 0, 0, 0);
      return nextBatch;
    } else {
      // Next day's first batch
      const nextBatch = new Date(now);
      nextBatch.setDate(nextBatch.getDate() + 1);
      nextBatch.setHours(this.config.batchTimes[0], 0, 0, 0);
      return nextBatch;
    }
  }

  /**
   * Processes NEFT payment
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentInstruction) {
    const transactionId = this.generateTransactionReference('NEFT');
    
    try {
      // Validate payment instruction
      const validation = this.validatePaymentInstruction(paymentInstruction);
      if (!validation.isValid) {
        this.updateTransactionStatus(transactionId, PaymentStatus.FAILED, {
          errors: validation.errors
        });
        return {
          success: false,
          transactionId,
          errors: validation.errors
        };
      }

      const nextBatchTime = this.getNextBatchTime();
      
      this.updateTransactionStatus(transactionId, PaymentStatus.PROCESSING, {
        ifscCode: paymentInstruction.ifscCode,
        nextBatchTime: nextBatchTime
      });

      // Execute through circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        // Simulate NEFT processing
        await this.simulateNetworkDelay(1000);
        
        // Simulate potential failures
        if (Math.random() < 0.03) { // 3% failure rate
          throw new Error('NEFT batch processing failed');
        }

        return await this.executeNEFTTransfer(paymentInstruction, transactionId);
      });

      this.updateTransactionStatus(transactionId, PaymentStatus.COMPLETED, {
        neftReference: result.neftReference,
        fees: result.fees,
        batchTime: nextBatchTime
      });

      return {
        success: true,
        transactionId,
        neftReference: result.neftReference,
        fees: result.fees,
        processingTime: this.config.processingTime,
        nextBatchTime: nextBatchTime,
        networkName: this.networkName
      };

    } catch (error) {
      this.updateTransactionStatus(transactionId, PaymentStatus.FAILED, {
        error: error.message
      });

      return {
        success: false,
        transactionId,
        error: error.message,
        networkName: this.networkName
      };
    }
  }

  /**
   * Executes NEFT transfer (mock implementation)
   * @param {Object} paymentInstruction - Payment instruction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transfer result
   */
  async executeNEFTTransfer(paymentInstruction, transactionId) {
    // Mock NEFT processing
    const fees = this.calculateFees(paymentInstruction.amount);
    const neftReference = `N${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    return {
      neftReference,
      fees,
      processedAt: new Date()
    };
  }

  /**
   * Calculates NEFT transfer fees
   * @param {number} amount - Transfer amount
   * @returns {number} Total fees
   */
  calculateFees(amount) {
    const baseFee = this.config.fees.base;
    const percentageFee = (amount * this.config.fees.percentage) / 100;
    return Math.round((baseFee + percentageFee) * 100) / 100;
  }
}

/**
 * UPI (Unified Payments Interface) Adapter
 * Handles instant small-value transfers through UPI network
 */
class UPIAdapter extends BasePaymentNetworkAdapter {
  constructor(config = {}) {
    super('UPI', {
      timeout: 5000,
      processingTime: 'Instant',
      minAmount: 0.01,
      maxAmount: 100000,
      fees: { base: 0, percentage: 0 }, // UPI is typically free
      ...config
    });
  }

  /**
   * Validates UPI-specific payment instruction
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Object} Validation result
   */
  validatePaymentInstruction(paymentInstruction) {
    const baseValidation = super.validatePaymentInstruction(paymentInstruction);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const errors = [];

    // UPI-specific validations
    if (paymentInstruction.amount < this.config.minAmount) {
      errors.push(`Minimum amount for UPI is ${this.config.minAmount}`);
    }

    if (paymentInstruction.amount > this.config.maxAmount) {
      errors.push(`Maximum amount for UPI is ${this.config.maxAmount}`);
    }

    if (!paymentInstruction.upiId && !paymentInstruction.mobileNumber) {
      errors.push('UPI ID or mobile number is required for UPI transfers');
    }

    if (paymentInstruction.currency !== Currency.INR) {
      errors.push('UPI only supports INR currency');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Processes UPI payment
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentInstruction) {
    const transactionId = this.generateTransactionReference('UPI');
    
    try {
      // Validate payment instruction
      const validation = this.validatePaymentInstruction(paymentInstruction);
      if (!validation.isValid) {
        this.updateTransactionStatus(transactionId, PaymentStatus.FAILED, {
          errors: validation.errors
        });
        return {
          success: false,
          transactionId,
          errors: validation.errors
        };
      }

      this.updateTransactionStatus(transactionId, PaymentStatus.PROCESSING, {
        upiId: paymentInstruction.upiId,
        mobileNumber: paymentInstruction.mobileNumber
      });

      // Execute through circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        // Simulate UPI processing
        await this.simulateNetworkDelay(100);
        
        // Simulate potential failures
        if (Math.random() < 0.01) { // 1% failure rate
          throw new Error('UPI network congestion');
        }

        return await this.executeUPITransfer(paymentInstruction, transactionId);
      });

      this.updateTransactionStatus(transactionId, PaymentStatus.COMPLETED, {
        upiReference: result.upiReference,
        fees: result.fees
      });

      return {
        success: true,
        transactionId,
        upiReference: result.upiReference,
        fees: result.fees,
        processingTime: this.config.processingTime,
        networkName: this.networkName
      };

    } catch (error) {
      this.updateTransactionStatus(transactionId, PaymentStatus.FAILED, {
        error: error.message
      });

      return {
        success: false,
        transactionId,
        error: error.message,
        networkName: this.networkName
      };
    }
  }

  /**
   * Executes UPI transfer (mock implementation)
   * @param {Object} paymentInstruction - Payment instruction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transfer result
   */
  async executeUPITransfer(paymentInstruction, transactionId) {
    // Mock UPI processing
    const fees = this.calculateFees(paymentInstruction.amount);
    const upiReference = `${Date.now()}${Math.random().toString(36).substr(2, 12)}`;

    return {
      upiReference,
      fees,
      processedAt: new Date()
    };
  }

  /**
   * Calculates UPI transfer fees
   * @param {number} amount - Transfer amount
   * @returns {number} Total fees
   */
  calculateFees(amount) {
    // UPI is typically free for consumers
    return 0;
  }
}

/**
 * Payment Rail Selector
 * Selects appropriate payment rail based on payment characteristics
 */
class PaymentRailSelector {
  constructor() {
    this.adapters = new Map();
    this.initializeAdapters();
  }

  /**
   * Initialize payment network adapters
   */
  initializeAdapters() {
    this.adapters.set(PaymentRail.SWIFT, new SWIFTAdapter());
    this.adapters.set(PaymentRail.RTGS, new RTGSAdapter());
    this.adapters.set(PaymentRail.NEFT, new NEFTAdapter());
    this.adapters.set(PaymentRail.UPI, new UPIAdapter());
  }

  /**
   * Selects optimal payment rail based on payment characteristics
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {string} Selected payment rail
   */
  selectPaymentRail(paymentInstruction) {
    const { amount, paymentType, currency, urgency } = paymentInstruction;

    // International transfers
    if (paymentType === 'INTERNATIONAL_TRANSFER' || currency !== Currency.INR) {
      return PaymentRail.SWIFT;
    }

    // Domestic transfers in INR
    if (currency === Currency.INR) {
      // High-value transactions
      if (amount >= 200000) {
        return PaymentRail.RTGS;
      }
      
      // Small amounts or instant transfers
      if (amount <= 100000 && (urgency === 'INSTANT' || amount <= 1000)) {
        return PaymentRail.UPI;
      }
      
      // Medium amounts
      return PaymentRail.NEFT;
    }

    // Default to SWIFT for other currencies
    return PaymentRail.SWIFT;
  }

  /**
   * Gets available payment rails for a payment instruction
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Array} Available payment rails
   */
  getAvailablePaymentRails(paymentInstruction) {
    const availableRails = [];

    for (const [rail, adapter] of this.adapters.entries()) {
      const validation = adapter.validatePaymentInstruction(paymentInstruction);
      if (validation.isValid) {
        availableRails.push({
          rail,
          processingTime: adapter.config.processingTime,
          fees: adapter.calculateFees ? adapter.calculateFees(paymentInstruction.amount) : 0
        });
      }
    }

    return availableRails;
  }

  /**
   * Gets payment network adapter
   * @param {string} paymentRail - Payment rail
   * @returns {BasePaymentNetworkAdapter} Payment network adapter
   */
  getAdapter(paymentRail) {
    return this.adapters.get(paymentRail);
  }

  /**
   * Processes payment through selected rail
   * @param {string} paymentRail - Selected payment rail
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentRail, paymentInstruction) {
    const adapter = this.getAdapter(paymentRail);
    
    if (!adapter) {
      return {
        success: false,
        error: `Payment rail ${paymentRail} is not supported`
      };
    }

    return await adapter.processPayment(paymentInstruction);
  }

  /**
   * Gets transaction status across all networks
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Transaction status
   */
  getTransactionStatus(transactionId) {
    for (const adapter of this.adapters.values()) {
      const status = adapter.getTransactionStatus(transactionId);
      if (status.status !== 'NOT_FOUND') {
        return status;
      }
    }

    return {
      status: 'NOT_FOUND',
      timestamp: null,
      metadata: {},
      networkName: 'UNKNOWN'
    };
  }
}

/**
 * Payment Network Integration Manager
 * Manages all payment network adapters and provides unified interface
 */
class PaymentNetworkIntegrationManager {
  constructor() {
    this.paymentRailSelector = new PaymentRailSelector();
    this.transactionStatusCache = new Map();
    this.networkHealthStatus = new Map();
    this.initializeHealthMonitoring();
  }

  /**
   * Initialize health monitoring for all payment networks
   */
  initializeHealthMonitoring() {
    const networks = [PaymentRail.SWIFT, PaymentRail.RTGS, PaymentRail.NEFT, PaymentRail.UPI];
    
    networks.forEach(network => {
      this.networkHealthStatus.set(network, {
        status: 'HEALTHY',
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        successRate: 100
      });
    });

    // Start health monitoring interval
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Check every minute
  }

  /**
   * Perform health checks on all payment networks
   */
  async performHealthChecks() {
    for (const [network, adapter] of this.paymentRailSelector.adapters.entries()) {
      try {
        const startTime = Date.now();
        
        // Perform a lightweight health check
        await this.performNetworkHealthCheck(adapter);
        
        const responseTime = Date.now() - startTime;
        
        // Update health status
        const currentStatus = this.networkHealthStatus.get(network);
        this.networkHealthStatus.set(network, {
          ...currentStatus,
          status: 'HEALTHY',
          lastCheck: new Date(),
          responseTime,
          successRate: Math.min(100, currentStatus.successRate + 1)
        });
        
      } catch (error) {
        const currentStatus = this.networkHealthStatus.get(network);
        this.networkHealthStatus.set(network, {
          ...currentStatus,
          status: 'UNHEALTHY',
          lastCheck: new Date(),
          errorCount: currentStatus.errorCount + 1,
          successRate: Math.max(0, currentStatus.successRate - 5),
          lastError: error.message
        });
      }
    }
  }

  /**
   * Perform health check on specific network adapter
   * @param {BasePaymentNetworkAdapter} adapter - Network adapter
   * @returns {Promise<boolean>} Health check result
   */
  async performNetworkHealthCheck(adapter) {
    // Mock health check - in real implementation, this would ping the actual network
    await adapter.simulateNetworkDelay(100);
    
    // Simulate occasional health check failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Network health check failed');
    }
    
    return true;
  }

  /**
   * Process payment with automatic failover
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Promise<Object>} Processing result
   */
  async processPaymentWithFailover(paymentInstruction) {
    // Get primary payment rail
    const primaryRail = this.paymentRailSelector.selectPaymentRail(paymentInstruction);
    
    // Check if primary rail is healthy
    const primaryHealth = this.networkHealthStatus.get(primaryRail);
    
    if (primaryHealth.status === 'HEALTHY') {
      try {
        const result = await this.paymentRailSelector.processPayment(primaryRail, paymentInstruction);
        
        if (result.success) {
          return {
            ...result,
            railUsed: primaryRail,
            failoverUsed: false
          };
        }
      } catch (error) {
        console.warn(`Primary rail ${primaryRail} failed, attempting failover:`, error.message);
      }
    }

    // Attempt failover to alternative rails
    const availableRails = this.paymentRailSelector.getAvailablePaymentRails(paymentInstruction);
    const healthyRails = availableRails.filter(railInfo => {
      const health = this.networkHealthStatus.get(railInfo.rail);
      return health.status === 'HEALTHY' && railInfo.rail !== primaryRail;
    });

    if (healthyRails.length === 0) {
      return {
        success: false,
        error: 'No healthy payment rails available',
        railUsed: primaryRail,
        failoverUsed: false
      };
    }

    // Try the best available alternative
    const failoverRail = healthyRails[0].rail;
    
    try {
      const result = await this.paymentRailSelector.processPayment(failoverRail, paymentInstruction);
      
      return {
        ...result,
        railUsed: failoverRail,
        failoverUsed: true,
        originalRail: primaryRail
      };
    } catch (error) {
      return {
        success: false,
        error: `All payment rails failed. Last error: ${error.message}`,
        railUsed: failoverRail,
        failoverUsed: true,
        originalRail: primaryRail
      };
    }
  }

  /**
   * Get network health status
   * @returns {Object} Health status for all networks
   */
  getNetworkHealthStatus() {
    const healthStatus = {};
    
    for (const [network, status] of this.networkHealthStatus.entries()) {
      healthStatus[network] = {
        ...status,
        uptime: this.calculateUptime(status)
      };
    }
    
    return healthStatus;
  }

  /**
   * Calculate network uptime percentage
   * @param {Object} status - Network status
   * @returns {number} Uptime percentage
   */
  calculateUptime(status) {
    // Simple uptime calculation based on success rate
    return Math.max(0, Math.min(100, status.successRate));
  }

  /**
   * Get payment rail recommendations
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Array} Recommended payment rails with health info
   */
  getPaymentRailRecommendations(paymentInstruction) {
    const availableRails = this.paymentRailSelector.getAvailablePaymentRails(paymentInstruction);
    
    return availableRails.map(railInfo => {
      const health = this.networkHealthStatus.get(railInfo.rail);
      return {
        ...railInfo,
        health: {
          status: health.status,
          responseTime: health.responseTime,
          successRate: health.successRate,
          uptime: this.calculateUptime(health)
        },
        recommended: health.status === 'HEALTHY' && health.successRate > 95
      };
    }).sort((a, b) => {
      // Sort by health and fees
      if (a.health.status !== b.health.status) {
        return a.health.status === 'HEALTHY' ? -1 : 1;
      }
      return a.fees - b.fees;
    });
  }

  /**
   * Get comprehensive transaction status across all networks
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Enhanced transaction status
   */
  async getEnhancedTransactionStatus(transactionId) {
    // Check cache first
    if (this.transactionStatusCache.has(transactionId)) {
      const cached = this.transactionStatusCache.get(transactionId);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.status;
      }
    }

    // Get status from payment rail selector
    const status = this.paymentRailSelector.getTransactionStatus(transactionId);
    
    if (status.status !== 'NOT_FOUND') {
      // Enhance with network health info
      const networkHealth = this.networkHealthStatus.get(status.networkName);
      const enhancedStatus = {
        ...status,
        networkHealth: networkHealth ? {
          status: networkHealth.status,
          responseTime: networkHealth.responseTime,
          successRate: networkHealth.successRate
        } : null,
        estimatedCompletion: this.estimateCompletionTime(status)
      };

      // Cache the result
      this.transactionStatusCache.set(transactionId, {
        status: enhancedStatus,
        timestamp: Date.now()
      });

      return enhancedStatus;
    }

    return status;
  }

  /**
   * Estimate transaction completion time
   * @param {Object} status - Transaction status
   * @returns {Date|null} Estimated completion time
   */
  estimateCompletionTime(status) {
    if (status.status === 'COMPLETED') {
      return null;
    }

    const processingTimes = {
      'SWIFT': 3 * 24 * 60 * 60 * 1000, // 3 days
      'RTGS': 0, // Real-time
      'NEFT': 4 * 60 * 60 * 1000, // 4 hours
      'UPI': 0 // Instant
    };

    const processingTime = processingTimes[status.networkName] || 0;
    
    if (processingTime === 0) {
      return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes for real-time
    }

    return new Date(status.timestamp.getTime() + processingTime);
  }

  /**
   * Get payment network statistics
   * @returns {Object} Network statistics
   */
  getNetworkStatistics() {
    const stats = {};
    
    for (const [network, adapter] of this.paymentRailSelector.adapters.entries()) {
      const health = this.networkHealthStatus.get(network);
      const transactionCount = Array.from(adapter.transactionStatus.values()).length;
      
      stats[network] = {
        totalTransactions: transactionCount,
        successRate: health.successRate,
        averageResponseTime: health.responseTime,
        status: health.status,
        lastHealthCheck: health.lastCheck,
        errorCount: health.errorCount
      };
    }
    
    return stats;
  }
}

module.exports = {
  BasePaymentNetworkAdapter,
  SWIFTAdapter,
  RTGSAdapter,
  NEFTAdapter,
  UPIAdapter,
  PaymentRailSelector,
  PaymentNetworkIntegrationManager
};