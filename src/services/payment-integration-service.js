// Payment Integration Service
// Provides unified interface between Payment Processing Module and Payment Network Adapters

const { PaymentNetworkIntegrationManager } = require('./payment-network-adapters');
const { PaymentStatus, PaymentRail } = require('../shared/types');

/**
 * Payment Integration Service
 * Orchestrates payment processing across different payment networks
 */
class PaymentIntegrationService {
  constructor() {
    this.networkManager = new PaymentNetworkIntegrationManager();
    this.activePayments = new Map();
    this.paymentMetrics = {
      totalProcessed: 0,
      successfulPayments: 0,
      failedPayments: 0,
      averageProcessingTime: 0,
      railUsageStats: new Map()
    };
  }

  /**
   * Process payment with comprehensive error handling and monitoring
   * @param {Object} paymentInstruction - Payment instruction
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentInstruction, options = {}) {
    const startTime = Date.now();
    const paymentId = this.generatePaymentId();
    
    try {
      // Track active payment
      this.activePayments.set(paymentId, {
        status: PaymentStatus.PROCESSING,
        startTime,
        paymentInstruction,
        options
      });

      // Validate payment instruction
      const validation = this.validatePaymentInstruction(paymentInstruction);
      if (!validation.isValid) {
        await this.handlePaymentFailure(paymentId, 'VALIDATION_FAILED', validation.errors);
        return {
          success: false,
          paymentId,
          errors: validation.errors,
          processingTime: Date.now() - startTime
        };
      }

      // Process payment with failover
      const result = await this.networkManager.processPaymentWithFailover(paymentInstruction);
      
      if (result.success) {
        await this.handlePaymentSuccess(paymentId, result);
        this.updateMetrics(result, Date.now() - startTime);
        
        return {
          success: true,
          paymentId,
          transactionId: result.transactionId,
          railUsed: result.railUsed,
          failoverUsed: result.failoverUsed,
          fees: result.fees,
          processingTime: Date.now() - startTime
        };
      } else {
        await this.handlePaymentFailure(paymentId, 'PROCESSING_FAILED', [result.error]);
        return {
          success: false,
          paymentId,
          error: result.error,
          processingTime: Date.now() - startTime
        };
      }

    } catch (error) {
      await this.handlePaymentFailure(paymentId, 'SYSTEM_ERROR', [error.message]);
      return {
        success: false,
        paymentId,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    } finally {
      this.activePayments.delete(paymentId);
    }
  }

  /**
   * Validate payment instruction
   * @param {Object} paymentInstruction - Payment instruction
   * @returns {Object} Validation result
   */
  validatePaymentInstruction(paymentInstruction) {
    const errors = [];

    if (!paymentInstruction.amount || paymentInstruction.amount <= 0) {
      errors.push('Invalid payment amount');
    }

    if (!paymentInstruction.fromAccount) {
      errors.push('Source account is required');
    }

    if (!paymentInstruction.toAccount) {
      errors.push('Destination account is required');
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
   * Handle successful payment
   * @param {string} paymentId - Payment ID
   * @param {Object} result - Processing result
   */
  async handlePaymentSuccess(paymentId, result) {
    this.paymentMetrics.successfulPayments++;
  }

  /**
   * Handle payment failure
   * @param {string} paymentId - Payment ID
   * @param {string} failureType - Type of failure
   * @param {Array} errors - Error details
   */
  async handlePaymentFailure(paymentId, failureType, errors) {
    this.paymentMetrics.failedPayments++;
  }

  /**
   * Update payment metrics
   * @param {Object} result - Processing result
   * @param {number} processingTime - Processing time in milliseconds
   */
  updateMetrics(result, processingTime) {
    this.paymentMetrics.totalProcessed++;
    
    const totalTime = this.paymentMetrics.averageProcessingTime * (this.paymentMetrics.totalProcessed - 1);
    this.paymentMetrics.averageProcessingTime = (totalTime + processingTime) / this.paymentMetrics.totalProcessed;
    
    const railUsage = this.paymentMetrics.railUsageStats.get(result.railUsed) || 0;
    this.paymentMetrics.railUsageStats.set(result.railUsed, railUsage + 1);
  }

  /**
   * Generate unique payment ID
   * @returns {string} Payment ID
   */
  generatePaymentId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `PAY_${timestamp}_${random}`;
  }

  /**
   * Get payment status with enhanced information
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(paymentId) {
    if (this.activePayments.has(paymentId)) {
      const activePayment = this.activePayments.get(paymentId);
      return {
        paymentId,
        status: activePayment.status,
        processingTime: Date.now() - activePayment.startTime,
        isActive: true
      };
    }

    const networkStatus = await this.networkManager.getEnhancedTransactionStatus(paymentId);
    
    if (networkStatus.status !== 'NOT_FOUND') {
      return {
        paymentId,
        status: networkStatus.status,
        networkName: networkStatus.networkName,
        timestamp: networkStatus.timestamp,
        isActive: false
      };
    }

    return {
      paymentId,
      status: 'NOT_FOUND',
      isActive: false
    };
  }

  /**
   * Get integration metrics
   * @returns {Object} Integration metrics
   */
  getIntegrationMetrics() {
    return {
      paymentMetrics: {
        ...this.paymentMetrics,
        successRate: this.paymentMetrics.totalProcessed > 0 ? 
          (this.paymentMetrics.successfulPayments / this.paymentMetrics.totalProcessed) * 100 : 0
      },
      activePayments: this.activePayments.size
    };
  }
}

module.exports = {
  PaymentIntegrationService
};