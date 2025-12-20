// Transaction Processing Module
const { Transaction, AuditLog } = require('../../shared/interfaces');
const { TransactionStatus, TransactionType } = require('../../shared/types');
const { v4: uuidv4 } = require('uuid');

/**
 * Transaction Processing Module - Handles automated transaction validation and processing
 * Requirements: 4.1, 4.2
 */
class TransactionProcessingModule {
  constructor(auditService = null) {
    this.auditService = auditService;
    this.validator = new TransactionValidator();
    this.processor = new TransactionProcessor();
  }

  /**
   * Process a transaction through validation and execution pipeline
   */
  async processTransaction(transaction) {
    const startTime = Date.now();
    
    try {
      // Log transaction processing start
      if (this.auditService) {
        await this.auditService.log('TRANSACTION', transaction.transactionId, 'PROCESS_START', 'SYSTEM', null, transaction);
      }

      // Validate transaction against business rules
      const validationResult = await this.validator.validate(transaction);
      
      if (!validationResult.isValid) {
        transaction.status = TransactionStatus.FAILED;
        transaction.processedAt = new Date();
        
        if (this.auditService) {
          await this.auditService.log('TRANSACTION', transaction.transactionId, 'VALIDATION_FAILED', 'SYSTEM', null, {
            transaction,
            errors: validationResult.errors
          });
        }
        
        return {
          success: false,
          transaction,
          errors: validationResult.errors,
          processingTime: Date.now() - startTime
        };
      }

      // Process approved transaction in real-time
      const processingResult = await this.processor.process(transaction);
      
      if (this.auditService) {
        await this.auditService.log('TRANSACTION', transaction.transactionId, 'PROCESS_COMPLETE', 'SYSTEM', null, {
          transaction,
          processingResult
        });
      }

      return {
        success: true,
        transaction,
        processingResult,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.processedAt = new Date();
      
      if (this.auditService) {
        await this.auditService.log('TRANSACTION', transaction.transactionId, 'PROCESS_ERROR', 'SYSTEM', null, {
          transaction,
          error: error.message
        });
      }

      return {
        success: false,
        transaction,
        errors: [error.message],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Batch process multiple transactions
   */
  async batchProcessTransactions(transactions) {
    const results = [];
    const startTime = Date.now();

    for (const transaction of transactions) {
      const result = await this.processTransaction(transaction);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      totalProcessed: transactions.length,
      successful,
      failed,
      results,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Transaction Validator - Validates transactions against business rules
 * Requirements: 4.1
 */
class TransactionValidator {
  constructor() {
    this.businessRules = new Map([
      ['MAX_DAILY_LIMIT', 100000],
      ['MIN_TRANSACTION_AMOUNT', 0.01],
      ['MAX_TRANSACTION_AMOUNT', 1000000],
      ['ALLOWED_CURRENCIES', ['USD', 'EUR', 'INR', 'GBP']],
      ['BLOCKED_COUNTRIES', ['XX', 'YY']],
      ['FRAUD_SCORE_THRESHOLD', 0.8]
    ]);
    this.fraudDetector = new BasicFraudDetector();
  }

  /**
   * Validate transaction against business rules
   */
  async validate(transaction) {
    const errors = [];

    try {
      // Basic transaction validation
      if (!transaction || !transaction.transactionId) {
        errors.push('Invalid transaction: missing transaction ID');
      }

      if (!transaction.accountId) {
        errors.push('Invalid transaction: missing account ID');
      }

      if (!transaction.amount || typeof transaction.amount !== 'number') {
        errors.push('Invalid transaction: invalid amount');
      }

      if (!transaction.currency) {
        errors.push('Invalid transaction: missing currency');
      }

      if (!transaction.transactionType) {
        errors.push('Invalid transaction: missing transaction type');
      }

      // Business rule validation
      if (transaction.amount < this.businessRules.get('MIN_TRANSACTION_AMOUNT')) {
        errors.push(`Transaction amount below minimum: ${this.businessRules.get('MIN_TRANSACTION_AMOUNT')}`);
      }

      if (transaction.amount > this.businessRules.get('MAX_TRANSACTION_AMOUNT')) {
        errors.push(`Transaction amount exceeds maximum: ${this.businessRules.get('MAX_TRANSACTION_AMOUNT')}`);
      }

      if (!this.businessRules.get('ALLOWED_CURRENCIES').includes(transaction.currency)) {
        errors.push(`Currency not supported: ${transaction.currency}`);
      }

      // Fraud detection
      const fraudScore = await this.fraudDetector.calculateFraudScore(transaction);
      transaction.fraudScore = fraudScore;

      if (fraudScore > this.businessRules.get('FRAUD_SCORE_THRESHOLD')) {
        errors.push(`Transaction flagged for fraud: score ${fraudScore}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        fraudScore
      };

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
        fraudScore: 1.0
      };
    }
  }

  updateBusinessRule(ruleName, value) {
    this.businessRules.set(ruleName, value);
  }

  getBusinessRules() {
    return new Map(this.businessRules);
  }
}

/**
 * Transaction Processor - Handles real-time transaction processing
 * Requirements: 4.2
 */
class TransactionProcessor {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Process a validated transaction in real-time
   */
  async process(transaction) {
    const startTime = Date.now();

    try {
      transaction.status = TransactionStatus.PROCESSING;
      const processingResult = await this.executeTransaction(transaction);
      transaction.status = TransactionStatus.COMPLETED;
      transaction.processedAt = new Date();

      return {
        success: true,
        transactionId: transaction.transactionId,
        processingTime: Date.now() - startTime,
        details: processingResult
      };

    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.processedAt = new Date();

      return {
        success: false,
        transactionId: transaction.transactionId,
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  async executeTransaction(transaction) {
    switch (transaction.transactionType) {
      case TransactionType.DEPOSIT:
        return await this.processDeposit(transaction);
      case TransactionType.WITHDRAWAL:
        return await this.processWithdrawal(transaction);
      case TransactionType.TRANSFER:
        return await this.processTransfer(transaction);
      case TransactionType.PAYMENT:
        return await this.processPayment(transaction);
      case TransactionType.FEE:
        return await this.processFee(transaction);
      default:
        throw new Error(`Unsupported transaction type: ${transaction.transactionType}`);
    }
  }

  async processDeposit(transaction) {
    await this.simulateProcessingDelay();
    return {
      type: 'DEPOSIT',
      accountId: transaction.accountId,
      amount: transaction.amount,
      currency: transaction.currency,
      balanceUpdate: `+${transaction.amount}`,
      timestamp: new Date()
    };
  }

  async processWithdrawal(transaction) {
    await this.simulateProcessingDelay();
    if (transaction.amount > 50000) {
      throw new Error('Withdrawal amount exceeds daily limit');
    }
    return {
      type: 'WITHDRAWAL',
      accountId: transaction.accountId,
      amount: transaction.amount,
      currency: transaction.currency,
      balanceUpdate: `-${transaction.amount}`,
      timestamp: new Date()
    };
  }

  async processTransfer(transaction) {
    await this.simulateProcessingDelay();
    return {
      type: 'TRANSFER',
      fromAccount: transaction.accountId,
      toAccount: transaction.counterparty?.accountId || 'EXTERNAL',
      amount: transaction.amount,
      currency: transaction.currency,
      timestamp: new Date()
    };
  }

  async processPayment(transaction) {
    await this.simulateProcessingDelay();
    return {
      type: 'PAYMENT',
      accountId: transaction.accountId,
      payee: transaction.counterparty?.name || 'Unknown',
      amount: transaction.amount,
      currency: transaction.currency,
      timestamp: new Date()
    };
  }

  async processFee(transaction) {
    await this.simulateProcessingDelay();
    return {
      type: 'FEE',
      accountId: transaction.accountId,
      feeType: transaction.description || 'Service Fee',
      amount: transaction.amount,
      currency: transaction.currency,
      timestamp: new Date()
    };
  }

  async simulateProcessingDelay() {
    const delay = Math.floor(Math.random() * 40) + 10;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Basic Fraud Detector - Calculates fraud scores for transactions
 * Requirements: 4.1 (fraud detection capabilities)
 */
class BasicFraudDetector {
  constructor() {
    this.suspiciousPatterns = new Map([
      ['LARGE_AMOUNT_THRESHOLD', 50000],
      ['RAPID_TRANSACTION_THRESHOLD', 5],
      ['UNUSUAL_TIME_HOURS', [0, 1, 2, 3, 4, 5]],
      ['HIGH_RISK_COUNTRIES', ['XX', 'YY']]
    ]);
  }

  async calculateFraudScore(transaction) {
    let score = 0.0;

    try {
      if (transaction.amount > this.suspiciousPatterns.get('LARGE_AMOUNT_THRESHOLD')) {
        score += 0.3;
      }

      const hour = new Date().getHours();
      if (this.suspiciousPatterns.get('UNUSUAL_TIME_HOURS').includes(hour)) {
        score += 0.2;
      }

      if (transaction.transactionType === TransactionType.TRANSFER && transaction.amount > 10000) {
        score += 0.2;
      }

      if (transaction.counterparty && transaction.counterparty.country) {
        if (this.suspiciousPatterns.get('HIGH_RISK_COUNTRIES').includes(transaction.counterparty.country)) {
          score += 0.4;
        }
      }

      const randomFactor = Math.random() * 0.1;
      score += randomFactor;

      return Math.min(1.0, Math.max(0.0, score));

    } catch (error) {
      return 0.9;
    }
  }

  updatePattern(patternName, value) {
    this.suspiciousPatterns.set(patternName, value);
  }
}

/**
 * Exception Handler - Manages manual review queue for problematic transactions
 * Requirements: 4.3
 */
class ExceptionHandler {
  constructor(auditService = null) {
    this.auditService = auditService;
    this.manualReviewQueue = [];
    this.exceptionTypes = new Map([
      ['VALIDATION_FAILED', 'Transaction failed validation rules'],
      ['FRAUD_SUSPECTED', 'Transaction flagged for potential fraud'],
      ['SYSTEM_ERROR', 'System error during processing'],
      ['INSUFFICIENT_FUNDS', 'Account has insufficient funds'],
      ['COMPLIANCE_VIOLATION', 'Transaction violates compliance rules'],
      ['UNUSUAL_PATTERN', 'Transaction shows unusual patterns']
    ]);
  }

  async flagForManualReview(transaction, exceptionType, reason, metadata = {}) {
    const exception = {
      exceptionId: uuidv4(),
      transactionId: transaction.transactionId,
      exceptionType,
      reason,
      metadata,
      flaggedAt: new Date(),
      status: 'PENDING_REVIEW',
      assignedReviewer: null,
      reviewedAt: null,
      resolution: null
    };

    this.manualReviewQueue.push(exception);
    transaction.status = TransactionStatus.FAILED;
    transaction.processedAt = new Date();

    if (this.auditService) {
      await this.auditService.log('EXCEPTION', exception.exceptionId, 'FLAGGED_FOR_REVIEW', 'SYSTEM', null, {
        transaction,
        exception
      });
    }

    return {
      success: true,
      exception,
      queuePosition: this.manualReviewQueue.length
    };
  }

  getPendingExceptions(limit = 50) {
    return this.manualReviewQueue
      .filter(ex => ex.status === 'PENDING_REVIEW')
      .slice(0, limit)
      .sort((a, b) => a.flaggedAt - b.flaggedAt);
  }

  async assignToReviewer(exceptionId, reviewerId) {
    const exception = this.manualReviewQueue.find(ex => ex.exceptionId === exceptionId);
    
    if (!exception) {
      throw new Error(`Exception not found: ${exceptionId}`);
    }

    if (exception.status !== 'PENDING_REVIEW') {
      throw new Error(`Exception already processed: ${exceptionId}`);
    }

    exception.assignedReviewer = reviewerId;
    exception.status = 'UNDER_REVIEW';

    if (this.auditService) {
      await this.auditService.log('EXCEPTION', exceptionId, 'ASSIGNED_TO_REVIEWER', reviewerId, null, {
        exception
      });
    }

    return {
      success: true,
      exception
    };
  }

  async resolveException(exceptionId, reviewerId, resolution, comments = '') {
    const exception = this.manualReviewQueue.find(ex => ex.exceptionId === exceptionId);
    
    if (!exception) {
      throw new Error(`Exception not found: ${exceptionId}`);
    }

    if (exception.assignedReviewer !== reviewerId) {
      throw new Error(`Exception not assigned to reviewer: ${reviewerId}`);
    }

    exception.status = 'RESOLVED';
    exception.reviewedAt = new Date();
    exception.resolution = {
      decision: resolution,
      comments,
      reviewerId,
      resolvedAt: new Date()
    };

    if (this.auditService) {
      await this.auditService.log('EXCEPTION', exceptionId, 'RESOLVED', reviewerId, null, {
        exception
      });
    }

    return {
      success: true,
      exception
    };
  }

  getExceptionStats() {
    const total = this.manualReviewQueue.length;
    const pending = this.manualReviewQueue.filter(ex => ex.status === 'PENDING_REVIEW').length;
    const underReview = this.manualReviewQueue.filter(ex => ex.status === 'UNDER_REVIEW').length;
    const resolved = this.manualReviewQueue.filter(ex => ex.status === 'RESOLVED').length;

    const typeStats = {};
    this.manualReviewQueue.forEach(ex => {
      typeStats[ex.exceptionType] = (typeStats[ex.exceptionType] || 0) + 1;
    });

    return {
      total,
      pending,
      underReview,
      resolved,
      typeBreakdown: typeStats
    };
  }
}

/**
 * Reconciliation Engine - Performs automated account reconciliation
 * Requirements: 4.5
 */
class ReconciliationEngine {
  constructor(auditService = null) {
    this.auditService = auditService;
    this.reconciliationRules = new Map([
      ['TOLERANCE_AMOUNT', 0.01],
      ['MAX_AGE_DAYS', 30],
      ['BATCH_SIZE', 1000]
    ]);
  }

  async reconcileAccount(accountId, systemTransactions, externalTransactions) {
    const startTime = Date.now();
    const reconciliationId = uuidv4();

    try {
      if (this.auditService) {
        await this.auditService.log('RECONCILIATION', reconciliationId, 'STARTED', 'SYSTEM', null, {
          accountId,
          systemTransactionCount: systemTransactions.length,
          externalTransactionCount: externalTransactions.length
        });
      }

      const systemTxnMap = this.prepareTransactionMap(systemTransactions);
      const externalTxnMap = this.prepareTransactionMap(externalTransactions);

      const matches = [];
      const systemOnly = [];
      const externalOnly = [];
      const amountDiscrepancies = [];

      for (const [key, systemTxn] of systemTxnMap) {
        const externalTxn = externalTxnMap.get(key);
        
        if (externalTxn) {
          if (this.amountsMatch(systemTxn.amount, externalTxn.amount)) {
            matches.push({
              systemTransaction: systemTxn,
              externalTransaction: externalTxn,
              matchType: 'EXACT'
            });
          } else {
            amountDiscrepancies.push({
              systemTransaction: systemTxn,
              externalTransaction: externalTxn,
              difference: Math.abs(systemTxn.amount - externalTxn.amount)
            });
          }
          externalTxnMap.delete(key);
        } else {
          systemOnly.push(systemTxn);
        }
      }

      for (const [key, externalTxn] of externalTxnMap) {
        externalOnly.push(externalTxn);
      }

      const summary = {
        reconciliationId,
        accountId,
        reconciliationDate: new Date(),
        totalSystemTransactions: systemTransactions.length,
        totalExternalTransactions: externalTransactions.length,
        matches: matches.length,
        systemOnly: systemOnly.length,
        externalOnly: externalOnly.length,
        amountDiscrepancies: amountDiscrepancies.length,
        isReconciled: systemOnly.length === 0 && externalOnly.length === 0 && amountDiscrepancies.length === 0,
        processingTime: Date.now() - startTime
      };

      const result = {
        summary,
        matches,
        discrepancies: {
          systemOnly,
          externalOnly,
          amountDiscrepancies
        }
      };

      if (this.auditService) {
        await this.auditService.log('RECONCILIATION', reconciliationId, 'COMPLETED', 'SYSTEM', null, result);
      }

      return result;

    } catch (error) {
      if (this.auditService) {
        await this.auditService.log('RECONCILIATION', reconciliationId, 'FAILED', 'SYSTEM', null, {
          accountId,
          error: error.message
        });
      }

      throw new Error(`Reconciliation failed for account ${accountId}: ${error.message}`);
    }
  }

  prepareTransactionMap(transactions) {
    const txnMap = new Map();

    transactions.forEach(txn => {
      const date = new Date(txn.processedAt || txn.date).toISOString().split('T')[0];
      const key = `${date}_${Math.abs(txn.amount)}_${txn.transactionType || txn.type}`;
      
      let finalKey = key;
      let counter = 1;
      while (txnMap.has(finalKey)) {
        finalKey = `${key}_${counter}`;
        counter++;
      }
      
      txnMap.set(finalKey, txn);
    });

    return txnMap;
  }

  amountsMatch(amount1, amount2) {
    const tolerance = this.reconciliationRules.get('TOLERANCE_AMOUNT');
    return Math.abs(amount1 - amount2) <= tolerance;
  }
}

/**
 * Advanced Fraud Detector - Enhanced fraud detection with pattern recognition
 * Requirements: 4.4
 */
class FraudDetector extends BasicFraudDetector {
  constructor() {
    super();
    this.transactionHistory = new Map();
    this.fraudPatterns = new Map([
      ['VELOCITY_THRESHOLD', 10],
      ['AMOUNT_SPIKE_MULTIPLIER', 5],
      ['GEOGRAPHIC_ANOMALY_DISTANCE', 1000],
      ['TIME_ANOMALY_HOURS', 2]
    ]);
  }

  async detectFraudPatterns(transaction, recentTransactions = []) {
    const fraudScore = await this.calculateFraudScore(transaction);
    const patterns = [];
    let shouldBlock = false;

    try {
      const velocityPattern = this.checkVelocityPattern(transaction, recentTransactions);
      if (velocityPattern.detected) {
        patterns.push(velocityPattern);
        if (velocityPattern.severity === 'HIGH') {
          shouldBlock = true;
        }
      }

      const amountPattern = this.checkAmountSpike(transaction, recentTransactions);
      if (amountPattern.detected) {
        patterns.push(amountPattern);
        if (amountPattern.severity === 'HIGH') {
          shouldBlock = true;
        }
      }

      if (fraudScore > 0.8 || shouldBlock) {
        shouldBlock = true;
      }

      return {
        fraudScore,
        shouldBlock,
        patterns,
        riskLevel: this.calculateRiskLevel(fraudScore, patterns),
        recommendation: shouldBlock ? 'BLOCK_TRANSACTION' : 'ALLOW_TRANSACTION'
      };

    } catch (error) {
      return {
        fraudScore: 0.9,
        shouldBlock: true,
        patterns: [{ type: 'SYSTEM_ERROR', description: error.message }],
        riskLevel: 'HIGH',
        recommendation: 'BLOCK_TRANSACTION'
      };
    }
  }

  checkVelocityPattern(transaction, recentTransactions) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = recentTransactions.filter(txn => 
      new Date(txn.processedAt || txn.createdAt) > oneHourAgo
    ).length;

    const threshold = this.fraudPatterns.get('VELOCITY_THRESHOLD');
    
    if (recentCount >= threshold) {
      return {
        detected: true,
        type: 'VELOCITY_FRAUD',
        description: `${recentCount} transactions in the last hour (threshold: ${threshold})`,
        severity: recentCount > threshold * 1.5 ? 'HIGH' : 'MEDIUM',
        metadata: { transactionCount: recentCount, threshold }
      };
    }

    return { detected: false };
  }

  checkAmountSpike(transaction, recentTransactions) {
    if (recentTransactions.length === 0) {
      return { detected: false };
    }

    const avgAmount = recentTransactions.reduce((sum, txn) => sum + txn.amount, 0) / recentTransactions.length;
    const multiplier = this.fraudPatterns.get('AMOUNT_SPIKE_MULTIPLIER');
    
    if (transaction.amount > avgAmount * multiplier) {
      return {
        detected: true,
        type: 'AMOUNT_SPIKE',
        description: `Transaction amount ${transaction.amount} is ${multiplier}x higher than average ${avgAmount.toFixed(2)}`,
        severity: transaction.amount > avgAmount * multiplier * 2 ? 'HIGH' : 'MEDIUM',
        metadata: { currentAmount: transaction.amount, averageAmount: avgAmount, multiplier }
      };
    }

    return { detected: false };
  }

  calculateRiskLevel(fraudScore, patterns) {
    const highSeverityPatterns = patterns.filter(p => p.severity === 'HIGH').length;
    const mediumSeverityPatterns = patterns.filter(p => p.severity === 'MEDIUM').length;

    if (fraudScore > 0.8 || highSeverityPatterns > 0) {
      return 'HIGH';
    } else if (fraudScore > 0.5 || mediumSeverityPatterns > 0) {
      return 'MEDIUM';
    } else if (fraudScore > 0.2 || patterns.length > 0) {
      return 'LOW';
    } else {
      return 'MINIMAL';
    }
  }
}

module.exports = {
  TransactionProcessingModule,
  TransactionValidator,
  TransactionProcessor,
  BasicFraudDetector,
  ExceptionHandler,
  ReconciliationEngine,
  FraudDetector
};