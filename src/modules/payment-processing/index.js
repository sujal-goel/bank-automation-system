// Payment Processing Module
const { PaymentOrder } = require('../../shared/interfaces');
const { PaymentType, PaymentStatus, PaymentRail, Currency } = require('../../shared/types');
const { validators } = require('../../shared/validation');
const { PaymentIntegrationService } = require('../../services/payment-integration-service');

/**
 * PaymentValidator - Validates payment instructions and business rules
 */
class PaymentValidator {
  constructor() {
    this.businessRules = {
      maxDailyLimit: 100000,
      maxSingleTransactionLimit: 50000,
      minTransactionAmount: 0.01,
      allowedCurrencies: Object.values(Currency),
      domesticPaymentRails: [PaymentRail.RTGS, PaymentRail.NEFT, PaymentRail.UPI],
      internationalPaymentRails: [PaymentRail.SWIFT, PaymentRail.WIRE]
    };
  }

  /**
   * Validates payment order against business rules
   * @param {PaymentOrder} paymentOrder - Payment order to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validatePaymentOrder(paymentOrder) {
    const errors = [];

    try {
      // Basic data validation
      paymentOrder.validate();
    } catch (error) {
      errors.push(`Data validation failed: ${error.message}`);
    }

    // Business rule validations
    if (paymentOrder.amount < this.businessRules.minTransactionAmount) {
      errors.push(`Amount ${paymentOrder.amount} is below minimum transaction limit of ${this.businessRules.minTransactionAmount}`);
    }

    if (paymentOrder.amount > this.businessRules.maxSingleTransactionLimit) {
      errors.push(`Amount ${paymentOrder.amount} exceeds maximum single transaction limit of ${this.businessRules.maxSingleTransactionLimit}`);
    }

    if (!this.businessRules.allowedCurrencies.includes(paymentOrder.currency)) {
      errors.push(`Currency ${paymentOrder.currency} is not supported`);
    }

    // Account validation
    if (paymentOrder.fromAccountId === paymentOrder.toAccountId) {
      errors.push('Source and destination accounts cannot be the same');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates payment rail selection based on payment type
   * @param {PaymentOrder} paymentOrder - Payment order
   * @param {string} selectedRail - Selected payment rail
   * @returns {Object} Validation result
   */
  validatePaymentRail(paymentOrder, selectedRail) {
    const errors = [];

    if (!Object.values(PaymentRail).includes(selectedRail)) {
      errors.push(`Invalid payment rail: ${selectedRail}`);
      return { isValid: false, errors };
    }

    // Validate rail based on payment type
    if (paymentOrder.paymentType === PaymentType.INTERNATIONAL_TRANSFER) {
      if (!this.businessRules.internationalPaymentRails.includes(selectedRail)) {
        errors.push(`Payment rail ${selectedRail} is not supported for international transfers`);
      }
    } else {
      if (!this.businessRules.domesticPaymentRails.includes(selectedRail)) {
        errors.push(`Payment rail ${selectedRail} is not supported for domestic transfers`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates account balance for payment
   * @param {number} accountBalance - Current account balance
   * @param {number} paymentAmount - Payment amount
   * @returns {Object} Validation result
   */
  validateSufficientFunds(accountBalance, paymentAmount) {
    const errors = [];

    if (accountBalance < paymentAmount) {
      errors.push(`Insufficient funds. Available: ${accountBalance}, Required: ${paymentAmount}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * SettlementProcessor - Handles payment rail integration and settlement
 */
class SettlementProcessor {
  constructor() {
    this.paymentRailConnections = new Map();
    this.initializePaymentRails();
  }

  /**
   * Initialize payment rail connections (mock implementations)
   */
  initializePaymentRails() {
    // Mock payment rail implementations
    this.paymentRailConnections.set(PaymentRail.SWIFT, {
      name: 'SWIFT Network',
      processingTime: '1-3 business days',
      fees: { base: 25, percentage: 0.1 }
    });

    this.paymentRailConnections.set(PaymentRail.RTGS, {
      name: 'Real Time Gross Settlement',
      processingTime: 'Real-time',
      fees: { base: 5, percentage: 0.05 }
    });

    this.paymentRailConnections.set(PaymentRail.NEFT, {
      name: 'National Electronic Funds Transfer',
      processingTime: '2-4 hours',
      fees: { base: 2, percentage: 0.02 }
    });

    this.paymentRailConnections.set(PaymentRail.UPI, {
      name: 'Unified Payments Interface',
      processingTime: 'Instant',
      fees: { base: 0, percentage: 0 }
    });

    this.paymentRailConnections.set(PaymentRail.WIRE, {
      name: 'Wire Transfer',
      processingTime: '1-2 business days',
      fees: { base: 15, percentage: 0.08 }
    });
  }

  /**
   * Selects appropriate payment rail based on payment characteristics
   * @param {PaymentOrder} paymentOrder - Payment order
   * @returns {string} Selected payment rail
   */
  selectPaymentRail(paymentOrder) {
    // Simple rail selection logic
    if (paymentOrder.paymentType === PaymentType.INTERNATIONAL_TRANSFER) {
      return paymentOrder.amount > 10000 ? PaymentRail.SWIFT : PaymentRail.WIRE;
    }

    // Domestic transfers
    if (paymentOrder.amount > 200000) {
      return PaymentRail.RTGS; // High value transactions
    } else if (paymentOrder.amount < 1000) {
      return PaymentRail.UPI; // Small amounts
    } else {
      return PaymentRail.NEFT; // Medium amounts
    }
  }

  /**
   * Processes payment through selected rail
   * @param {PaymentOrder} paymentOrder - Payment order
   * @param {string} paymentRail - Selected payment rail
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentOrder, paymentRail) {
    const railConfig = this.paymentRailConnections.get(paymentRail);
    
    if (!railConfig) {
      throw new Error(`Payment rail ${paymentRail} is not configured`);
    }

    try {
      // Simulate payment processing
      const processingDelay = this.getProcessingDelay(paymentRail);
      
      // In real implementation, this would integrate with actual payment networks
      await this.simulatePaymentProcessing(processingDelay);

      const fees = this.calculateFees(paymentOrder.amount, railConfig.fees);
      
      return {
        success: true,
        transactionId: `${paymentRail}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentRail,
        fees,
        processingTime: railConfig.processingTime,
        processedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        paymentRail,
        processedAt: new Date()
      };
    }
  }

  /**
   * Calculates processing fees
   * @param {number} amount - Payment amount
   * @param {Object} feeStructure - Fee structure
   * @returns {number} Total fees
   */
  calculateFees(amount, feeStructure) {
    const baseFee = feeStructure.base || 0;
    const percentageFee = (amount * (feeStructure.percentage || 0)) / 100;
    return Math.round((baseFee + percentageFee) * 100) / 100;
  }

  /**
   * Gets processing delay for simulation
   * @param {string} paymentRail - Payment rail
   * @returns {number} Delay in milliseconds
   */
  getProcessingDelay(paymentRail) {
    const delays = {
      [PaymentRail.UPI]: 100,
      [PaymentRail.RTGS]: 500,
      [PaymentRail.NEFT]: 1000,
      [PaymentRail.WIRE]: 2000,
      [PaymentRail.SWIFT]: 3000
    };
    return delays[paymentRail] || 1000;
  }

  /**
   * Simulates payment processing delay
   * @param {number} delay - Delay in milliseconds
   * @returns {Promise} Promise that resolves after delay
   */
  simulatePaymentProcessing(delay) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  /**
   * Gets payment rail information
   * @param {string} paymentRail - Payment rail
   * @returns {Object} Rail information
   */
  getPaymentRailInfo(paymentRail) {
    return this.paymentRailConnections.get(paymentRail) || null;
  }
}
/**
 * CurrencyConverter - Handles real-time currency conversion
 */
class CurrencyConverter {
  constructor() {
    this.exchangeRates = new Map();
    this.lastUpdated = null;
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.initializeExchangeRates();
  }

  /**
   * Initialize exchange rates (mock data)
   */
  initializeExchangeRates() {
    // Mock exchange rates - in real implementation, this would fetch from external API
    const rates = {
      'USD_EUR': 0.85,
      'USD_INR': 83.12,
      'USD_GBP': 0.79,
      'EUR_USD': 1.18,
      'EUR_INR': 97.89,
      'EUR_GBP': 0.93,
      'INR_USD': 0.012,
      'INR_EUR': 0.010,
      'INR_GBP': 0.0095,
      'GBP_USD': 1.27,
      'GBP_EUR': 1.08,
      'GBP_INR': 105.43
    };

    for (const [pair, rate] of Object.entries(rates)) {
      this.exchangeRates.set(pair, {
        rate,
        timestamp: new Date(),
        spread: 0.002 // 0.2% spread
      });
    }

    this.lastUpdated = new Date();
  }

  /**
   * Gets exchange rate between two currencies
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Object} Exchange rate information
   */
  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return {
        rate: 1.0,
        timestamp: new Date(),
        spread: 0
      };
    }

    const pair = `${fromCurrency}_${toCurrency}`;
    const rateInfo = this.exchangeRates.get(pair);

    if (!rateInfo) {
      // Try reverse pair
      const reversePair = `${toCurrency}_${fromCurrency}`;
      const reverseRateInfo = this.exchangeRates.get(reversePair);
      
      if (reverseRateInfo) {
        return {
          rate: 1 / reverseRateInfo.rate,
          timestamp: reverseRateInfo.timestamp,
          spread: reverseRateInfo.spread
        };
      }

      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    return rateInfo;
  }

  /**
   * Converts amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Object} Conversion result
   */
  convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        exchangeRate: 1.0,
        fromCurrency,
        toCurrency,
        timestamp: new Date()
      };
    }

    const rateInfo = this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = Math.round((amount * rateInfo.rate) * 100) / 100;

    return {
      originalAmount: amount,
      convertedAmount,
      exchangeRate: rateInfo.rate,
      fromCurrency,
      toCurrency,
      timestamp: rateInfo.timestamp,
      spread: rateInfo.spread
    };
  }

  /**
   * Checks if exchange rates need updating
   * @returns {boolean} True if rates need updating
   */
  needsRateUpdate() {
    if (!this.lastUpdated) return true;
    return (Date.now() - this.lastUpdated.getTime()) > this.updateInterval;
  }

  /**
   * Updates exchange rates (mock implementation)
   * @returns {Promise<boolean>} Update success
   */
  async updateExchangeRates() {
    try {
      // In real implementation, this would fetch from external API
      // For now, just simulate rate fluctuation
      for (const [pair, rateInfo] of this.exchangeRates.entries()) {
        const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
        const newRate = rateInfo.rate * (1 + fluctuation);
        
        this.exchangeRates.set(pair, {
          ...rateInfo,
          rate: Math.round(newRate * 10000) / 10000,
          timestamp: new Date()
        });
      }

      this.lastUpdated = new Date();
      return true;
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      return false;
    }
  }
}
/**
 * PaymentRetryManager - Handles payment retry logic with exponential backoff
 */
class PaymentRetryManager {
  constructor() {
    this.retryQueue = new Map();
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 300000; // 5 minutes
    this.backoffMultiplier = 2;
  }

  /**
   * Calculates retry delay using exponential backoff
   * @param {number} retryCount - Current retry count
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(retryCount) {
    const delay = this.baseDelay * Math.pow(this.backoffMultiplier, retryCount);
    return Math.min(delay, this.maxDelay);
  }

  /**
   * Schedules a payment for retry
   * @param {PaymentOrder} paymentOrder - Payment order to retry
   * @param {Function} retryFunction - Function to call for retry
   * @returns {Promise<Object>} Retry result
   */
  async scheduleRetry(paymentOrder, retryFunction) {
    if (!paymentOrder.canRetry()) {
      return {
        success: false,
        error: 'Maximum retry attempts exceeded',
        finalStatus: PaymentStatus.FAILED
      };
    }

    const delay = this.calculateRetryDelay(paymentOrder.retryCount);
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          paymentOrder.incrementRetry();
          paymentOrder.status = PaymentStatus.RETRY;
          
          const result = await retryFunction(paymentOrder);
          
          if (result.success) {
            resolve({
              success: true,
              result,
              retryCount: paymentOrder.retryCount
            });
          } else if (paymentOrder.canRetry()) {
            // Schedule another retry
            const nextRetry = await this.scheduleRetry(paymentOrder, retryFunction);
            resolve(nextRetry);
          } else {
            paymentOrder.markFailed('Maximum retry attempts exceeded');
            resolve({
              success: false,
              error: 'Maximum retry attempts exceeded after retries',
              finalStatus: PaymentStatus.FAILED,
              retryCount: paymentOrder.retryCount
            });
          }
        } catch (error) {
          if (paymentOrder.canRetry()) {
            const nextRetry = await this.scheduleRetry(paymentOrder, retryFunction);
            resolve(nextRetry);
          } else {
            paymentOrder.markFailed(`Retry failed: ${error.message}`);
            resolve({
              success: false,
              error: error.message,
              finalStatus: PaymentStatus.FAILED,
              retryCount: paymentOrder.retryCount
            });
          }
        }
      }, delay);
    });
  }

  /**
   * Determines if a payment failure is retryable
   * @param {string} errorType - Type of error
   * @returns {boolean} True if retryable
   */
  isRetryableError(errorType) {
    const retryableErrors = [
      'NETWORK_TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'TEMPORARY_FAILURE',
      'RATE_LIMIT_EXCEEDED',
      'CONNECTION_ERROR'
    ];
    
    return retryableErrors.includes(errorType);
  }

  /**
   * Gets retry queue status
   * @returns {Object} Queue status information
   */
  getRetryQueueStatus() {
    return {
      queueSize: this.retryQueue.size,
      payments: Array.from(this.retryQueue.keys())
    };
  }
}
/**
 * NotificationService - Handles payment completion notifications
 */
class NotificationService {
  constructor() {
    this.notificationChannels = ['email', 'sms', 'push'];
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize notification templates
   */
  initializeTemplates() {
    return {
      PAYMENT_COMPLETED: {
        email: {
          subject: 'Payment Completed Successfully',
          body: 'Your payment of {amount} {currency} has been completed successfully. Transaction ID: {transactionId}'
        },
        sms: {
          body: 'Payment of {amount} {currency} completed. Ref: {transactionId}'
        },
        push: {
          title: 'Payment Completed',
          body: 'Payment of {amount} {currency} successful'
        }
      },
      PAYMENT_FAILED: {
        email: {
          subject: 'Payment Failed',
          body: 'Your payment of {amount} {currency} has failed. Reason: {reason}. Please try again or contact support.'
        },
        sms: {
          body: 'Payment of {amount} {currency} failed. Reason: {reason}'
        },
        push: {
          title: 'Payment Failed',
          body: 'Payment of {amount} {currency} failed'
        }
      },
      PAYMENT_RETRY: {
        email: {
          subject: 'Payment Being Retried',
          body: 'Your payment of {amount} {currency} is being retried. Attempt {retryCount} of {maxRetries}.'
        },
        sms: {
          body: 'Payment retry in progress. Attempt {retryCount}/{maxRetries}'
        },
        push: {
          title: 'Payment Retry',
          body: 'Retrying payment of {amount} {currency}'
        }
      }
    };
  }

  /**
   * Sends payment completion notification
   * @param {PaymentOrder} paymentOrder - Payment order
   * @param {Object} settlementResult - Settlement result
   * @param {Array} recipients - Notification recipients
   * @returns {Promise<Object>} Notification result
   */
  async sendPaymentNotification(paymentOrder, settlementResult, recipients) {
    const notificationType = paymentOrder.status === PaymentStatus.COMPLETED ? 
      'PAYMENT_COMPLETED' : 'PAYMENT_FAILED';

    const notifications = [];

    for (const recipient of recipients) {
      for (const channel of this.notificationChannels) {
        if (recipient.preferences && recipient.preferences.includes(channel)) {
          const notification = await this.sendNotification(
            channel,
            notificationType,
            paymentOrder,
            settlementResult,
            recipient
          );
          notifications.push(notification);
        }
      }
    }

    return {
      success: notifications.every(n => n.success),
      notifications,
      timestamp: new Date()
    };
  }

  /**
   * Sends individual notification
   * @param {string} channel - Notification channel
   * @param {string} type - Notification type
   * @param {PaymentOrder} paymentOrder - Payment order
   * @param {Object} settlementResult - Settlement result
   * @param {Object} recipient - Recipient information
   * @returns {Promise<Object>} Notification result
   */
  async sendNotification(channel, type, paymentOrder, settlementResult, recipient) {
    try {
      const template = this.templates[type][channel];
      if (!template) {
        throw new Error(`Template not found for ${type} ${channel}`);
      }

      const message = this.formatMessage(template, paymentOrder, settlementResult);
      
      // Simulate notification sending
      await this.simulateNotificationDelivery(channel);

      return {
        success: true,
        channel,
        type,
        recipient: recipient.id,
        message,
        sentAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        channel,
        type,
        recipient: recipient.id,
        error: error.message,
        sentAt: new Date()
      };
    }
  }

  /**
   * Formats notification message with payment data
   * @param {Object} template - Message template
   * @param {PaymentOrder} paymentOrder - Payment order
   * @param {Object} settlementResult - Settlement result
   * @returns {Object} Formatted message
   */
  formatMessage(template, paymentOrder, settlementResult) {
    const replacements = {
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      transactionId: settlementResult?.transactionId || paymentOrder.paymentId,
      reason: paymentOrder.failureReason || 'Unknown error',
      retryCount: paymentOrder.retryCount,
      maxRetries: paymentOrder.maxRetries
    };

    const formatted = {};
    for (const [key, value] of Object.entries(template)) {
      formatted[key] = this.replaceTokens(value, replacements);
    }

    return formatted;
  }

  /**
   * Replaces tokens in message template
   * @param {string} message - Message with tokens
   * @param {Object} replacements - Replacement values
   * @returns {string} Formatted message
   */
  replaceTokens(message, replacements) {
    let formatted = message;
    for (const [token, value] of Object.entries(replacements)) {
      formatted = formatted.replace(new RegExp(`{${token}}`, 'g'), value);
    }
    return formatted;
  }

  /**
   * Simulates notification delivery
   * @param {string} channel - Notification channel
   * @returns {Promise} Promise that resolves after delay
   */
  simulateNotificationDelivery(channel) {
    const delays = {
      email: 500,
      sms: 300,
      push: 100
    };
    
    return new Promise((resolve) => {
      setTimeout(resolve, delays[channel] || 500);
    });
  }
}
/**
 * PaymentProcessingModule - Main orchestrator for payment processing
 */
class PaymentProcessingModule {
  constructor() {
    this.validator = new PaymentValidator();
    this.settlementProcessor = new SettlementProcessor();
    this.currencyConverter = new CurrencyConverter();
    this.retryManager = new PaymentRetryManager();
    this.notificationService = new NotificationService();
    this.paymentIntegrationService = new PaymentIntegrationService();
  }

  /**
   * Processes a payment order end-to-end with currency conversion and retry logic
   * @param {Object} paymentData - Payment data
   * @param {number} accountBalance - Current account balance
   * @param {string} targetCurrency - Target currency for conversion (optional)
   * @param {Array} notificationRecipients - Recipients for notifications (optional)
   * @returns {Promise<Object>} Processing result
   */
  async processPaymentWithRetry(paymentData, accountBalance, targetCurrency = null, notificationRecipients = []) {
    try {
      // Create payment order
      const paymentOrder = new PaymentOrder(
        paymentData.fromAccountId,
        paymentData.toAccountId,
        paymentData.amount,
        paymentData.currency,
        paymentData.paymentType,
        paymentData.description
      );

      // Handle currency conversion if needed
      if (targetCurrency && targetCurrency !== paymentOrder.currency) {
        const conversion = this.currencyConverter.convertCurrency(
          paymentOrder.amount,
          paymentOrder.currency,
          targetCurrency
        );
        
        paymentOrder.setCurrencyConversion(
          targetCurrency,
          conversion.exchangeRate,
          conversion.convertedAmount
        );
      }

      // Validate payment order
      const validation = this.validator.validatePaymentOrder(paymentOrder);
      if (!validation.isValid) {
        paymentOrder.markFailed(`Validation failed: ${validation.errors.join(', ')}`);
        await this.sendNotifications(paymentOrder, null, notificationRecipients);
        return {
          success: false,
          paymentOrder,
          errors: validation.errors
        };
      }

      // Check sufficient funds (use converted amount if applicable)
      const amountToCheck = paymentOrder.convertedAmount || paymentOrder.amount;
      const fundsValidation = this.validator.validateSufficientFunds(accountBalance, amountToCheck);
      if (!fundsValidation.isValid) {
        paymentOrder.markFailed(`Insufficient funds: ${fundsValidation.errors.join(', ')}`);
        await this.sendNotifications(paymentOrder, null, notificationRecipients);
        return {
          success: false,
          paymentOrder,
          errors: fundsValidation.errors
        };
      }

      // Process payment with retry logic
      const retryFunction = async (order) => {
        return await this.processPaymentInternal(order);
      };

      const result = await this.processPaymentInternal(paymentOrder);
      
      if (result.success) {
        paymentOrder.markCompleted();
        await this.sendNotifications(paymentOrder, result.settlementResult, notificationRecipients);
        return {
          success: true,
          paymentOrder,
          settlementResult: result.settlementResult
        };
      } else {
        // Check if error is retryable
        if (this.retryManager.isRetryableError(result.errorType) && paymentOrder.canRetry()) {
          const retryResult = await this.retryManager.scheduleRetry(paymentOrder, retryFunction);
          
          if (retryResult.success) {
            paymentOrder.markCompleted();
            await this.sendNotifications(paymentOrder, retryResult.result.settlementResult, notificationRecipients);
            return {
              success: true,
              paymentOrder,
              settlementResult: retryResult.result.settlementResult,
              retryCount: retryResult.retryCount
            };
          } else {
            paymentOrder.markFailed(retryResult.error);
            await this.sendNotifications(paymentOrder, null, notificationRecipients);
            return {
              success: false,
              paymentOrder,
              error: retryResult.error,
              retryCount: retryResult.retryCount
            };
          }
        } else {
          paymentOrder.markFailed(result.error);
          await this.sendNotifications(paymentOrder, null, notificationRecipients);
          return {
            success: false,
            paymentOrder,
            error: result.error
          };
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Internal payment processing logic
   * @param {PaymentOrder} paymentOrder - Payment order
   * @returns {Promise<Object>} Processing result
   */
  async processPaymentInternal(paymentOrder) {
    try {
      // Select payment rail
      const selectedRail = this.settlementProcessor.selectPaymentRail(paymentOrder);
      
      // Validate payment rail
      const railValidation = this.validator.validatePaymentRail(paymentOrder, selectedRail);
      if (!railValidation.isValid) {
        return {
          success: false,
          error: `Payment rail validation failed: ${railValidation.errors.join(', ')}`,
          errorType: 'VALIDATION_ERROR'
        };
      }

      // Set payment rail
      paymentOrder.setPaymentRail(selectedRail);
      paymentOrder.status = PaymentStatus.PROCESSING;

      // Process payment through settlement processor
      const settlementResult = await this.settlementProcessor.processPayment(paymentOrder, selectedRail);

      if (settlementResult.success) {
        return {
          success: true,
          settlementResult
        };
      } else {
        return {
          success: false,
          error: settlementResult.error,
          errorType: this.determineErrorType(settlementResult.error)
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorType: this.determineErrorType(error.message)
      };
    }
  }

  /**
   * Determines error type for retry logic
   * @param {string} errorMessage - Error message
   * @returns {string} Error type
   */
  determineErrorType(errorMessage) {
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return 'NETWORK_TIMEOUT';
    }
    if (errorMessage.includes('unavailable') || errorMessage.includes('service')) {
      return 'SERVICE_UNAVAILABLE';
    }
    if (errorMessage.includes('rate limit')) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    if (errorMessage.includes('connection')) {
      return 'CONNECTION_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Sends notifications for payment completion
   * @param {PaymentOrder} paymentOrder - Payment order
   * @param {Object} settlementResult - Settlement result
   * @param {Array} recipients - Notification recipients
   * @returns {Promise<Object>} Notification result
   */
  async sendNotifications(paymentOrder, settlementResult, recipients) {
    if (recipients && recipients.length > 0) {
      return await this.notificationService.sendPaymentNotification(
        paymentOrder,
        settlementResult,
        recipients
      );
    }
    return { success: true, notifications: [] };
  }

  /**
   * Processes a payment order end-to-end (legacy method for backward compatibility)
   * @param {Object} paymentData - Payment data
   * @param {number} accountBalance - Current account balance
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentData, accountBalance) {
    return await this.processPaymentWithRetry(paymentData, accountBalance);
  }

  /**
   * Gets payment status
   * @param {string} paymentId - Payment ID
   * @returns {Object} Payment status information
   */
  getPaymentStatus(paymentId) {
    // In real implementation, this would query the database
    return {
      paymentId,
      status: 'This would query actual payment status from database',
      lastUpdated: new Date()
    };
  }

  /**
   * Gets available payment rails for a payment type
   * @param {string} paymentType - Payment type
   * @returns {Array} Available payment rails
   */
  getAvailablePaymentRails(paymentType) {
    if (paymentType === PaymentType.INTERNATIONAL_TRANSFER) {
      return this.validator.businessRules.internationalPaymentRails;
    }
    return this.validator.businessRules.domesticPaymentRails;
  }

  /**
   * Gets current exchange rate
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Object} Exchange rate information
   */
  getExchangeRate(fromCurrency, toCurrency) {
    return this.currencyConverter.getExchangeRate(fromCurrency, toCurrency);
  }

  /**
   * Converts currency amount
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Object} Conversion result
   */
  convertCurrency(amount, fromCurrency, toCurrency) {
    return this.currencyConverter.convertCurrency(amount, fromCurrency, toCurrency);
  }

  /**
   * Process payment using enhanced network integration with failover
   * @param {Object} paymentData - Payment data
   * @param {number} accountBalance - Current account balance
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processPaymentWithNetworkIntegration(paymentData, accountBalance, options = {}) {
    try {
      // Create payment order
      const paymentOrder = new PaymentOrder(
        paymentData.fromAccountId,
        paymentData.toAccountId,
        paymentData.amount,
        paymentData.currency,
        paymentData.paymentType,
        paymentData.description
      );

      // Validate payment order
      const validation = this.validator.validatePaymentOrder(paymentOrder);
      if (!validation.isValid) {
        return {
          success: false,
          paymentOrder,
          errors: validation.errors
        };
      }

      // Check sufficient funds
      const amountToCheck = paymentOrder.convertedAmount || paymentOrder.amount;
      const fundsValidation = this.validator.validateSufficientFunds(accountBalance, amountToCheck);
      if (!fundsValidation.isValid) {
        return {
          success: false,
          paymentOrder,
          errors: fundsValidation.errors
        };
      }

      // Handle currency conversion if needed
      if (options.targetCurrency && options.targetCurrency !== paymentOrder.currency) {
        const conversion = this.currencyConverter.convertCurrency(
          paymentOrder.amount,
          paymentOrder.currency,
          options.targetCurrency
        );
        
        paymentOrder.setCurrencyConversion(
          options.targetCurrency,
          conversion.exchangeRate,
          conversion.convertedAmount
        );
      }

      // Create payment instruction for network integration
      const paymentInstruction = {
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        fromAccount: paymentOrder.fromAccountId,
        toAccount: paymentOrder.toAccountId,
        paymentType: paymentOrder.paymentType,
        description: paymentOrder.description,
        urgency: options.urgency || 'NORMAL'
      };

      // Process through enhanced network integration
      const result = await this.paymentIntegrationService.processPayment(paymentInstruction, options);

      if (result.success) {
        paymentOrder.markCompleted();
        
        // Send notifications if recipients provided
        if (options.notificationRecipients) {
          await this.sendNotifications(paymentOrder, result, options.notificationRecipients);
        }
        
        return {
          success: true,
          paymentOrder,
          networkResult: result,
          railUsed: result.railUsed,
          failoverUsed: result.failoverUsed
        };
      } else {
        paymentOrder.markFailed(result.error);
        
        // Send notifications if recipients provided
        if (options.notificationRecipients) {
          await this.sendNotifications(paymentOrder, null, options.notificationRecipients);
        }
        
        return {
          success: false,
          paymentOrder,
          error: result.error,
          networkResult: result
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get enhanced payment status using network integration
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Enhanced payment status
   */
  async getEnhancedPaymentStatus(paymentId) {
    return await this.paymentIntegrationService.getPaymentStatus(paymentId);
  }

  /**
   * Get payment integration metrics
   * @returns {Object} Integration metrics
   */
  getPaymentIntegrationMetrics() {
    return this.paymentIntegrationService.getIntegrationMetrics();
  }

  /**
   * Get payment rail recommendations
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment rail recommendations and options
   */
  getPaymentRailRecommendations(paymentData) {
    return this.paymentIntegrationService.getNetworkManagerRecommendations(paymentData);
  }
}

module.exports = {
  PaymentProcessingModule,
  PaymentValidator,
  SettlementProcessor,
  CurrencyConverter,
  PaymentRetryManager,
  NotificationService
};