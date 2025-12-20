// Banking Domain Interfaces and Data Structures

const { v4: uuidv4 } = require('uuid');
const { 
  AccountType, 
  AccountStatus, 
  DocumentType, 
  VerificationStatus,
  TransactionType,
  TransactionStatus,
  LoanType,
  ApplicationStatus,
  KYCStatus,
  Currency,
  PaymentType,
  PaymentStatus,
  PaymentRail
} = require('./types');
const { validators } = require('./validation');

// Customer Data Structure
class Customer {
  constructor(personalInfo) {
    // Validate personal info
    const { error, value } = validators.validatePersonalInfo(personalInfo);
    if (error) {
      throw new Error(`Invalid personal information: ${error.details[0].message}`);
    }

    this.customerId = uuidv4();
    this.personalInfo = value;
    this.identityDocuments = [];
    this.kycStatus = KYCStatus.NOT_STARTED;
    this.riskProfile = null;
    this.accounts = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Validate the entire customer object
  validate() {
    const { error } = validators.validateCustomer(this);
    if (error) {
      throw new Error(`Invalid customer data: ${error.details[0].message}`);
    }
    return true;
  }

  // Add identity document with validation
  addIdentityDocument(document) {
    const identityDoc = new IdentityDocument(
      document.documentType,
      document.documentNumber,
      document.issuingAuthority,
      document.expiryDate
    );
    this.identityDocuments.push(identityDoc);
    this.updatedAt = new Date();
    return identityDoc;
  }
}

// Personal Information Structure
class PersonalInformation {
  constructor(firstName, lastName, dateOfBirth, nationality, address, contactInfo) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.dateOfBirth = dateOfBirth;
    this.nationality = nationality;
    this.address = address;
    this.contactInfo = contactInfo;
  }
}

// Identity Document Structure
class IdentityDocument {
  constructor(documentType, documentNumber, issuingAuthority, expiryDate) {
    this.documentType = documentType;
    this.documentNumber = documentNumber;
    this.issuingAuthority = issuingAuthority;
    this.expiryDate = expiryDate;
    this.verificationStatus = VerificationStatus.PENDING;
    this.extractedData = new Map();
  }
}

// Account Data Structure
class Account {
  constructor(customerId, accountType, currency = Currency.USD) {
    this.accountId = uuidv4();
    this.customerId = customerId;
    this.accountType = accountType;
    this.accountNumber = this.generateAccountNumber();
    this.status = AccountStatus.ACTIVE;
    this.balance = 0.0;
    this.currency = currency;
    this.openingDate = new Date();
    this.closingDate = null;

    // Validate the account
    this.validate();
  }

  generateAccountNumber() {
    // Simple account number generation - in real system would be more sophisticated
    return '1000' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  }

  validate() {
    const { error } = validators.validateAccount(this);
    if (error) {
      throw new Error(`Invalid account data: ${error.details[0].message}`);
    }
    return true;
  }

  updateBalance(amount) {
    if (typeof amount !== 'number') {
      throw new Error('Amount must be a number');
    }
    this.balance = Math.round((this.balance + amount) * 100) / 100; // Handle floating point precision
    return this.balance;
  }

  close() {
    this.status = AccountStatus.CLOSED;
    // Ensure closing date is at least 1ms after opening date
    this.closingDate = new Date(Math.max(new Date().getTime(), this.openingDate.getTime() + 1));
    this.validate();
  }
}

// Transaction Data Structure
class Transaction {
  constructor(accountId, amount, currency, transactionType, description, counterparty = null) {
    this.transactionId = uuidv4();
    this.accountId = accountId;
    this.amount = amount;
    this.currency = currency;
    this.transactionType = transactionType;
    this.description = description;
    this.counterparty = counterparty;
    this.status = TransactionStatus.PENDING;
    this.processedAt = null;
    this.amlFlags = [];
    this.fraudScore = 0.0;

    // Validate the transaction
    this.validate();
  }

  validate() {
    const { error } = validators.validateTransaction(this);
    if (error) {
      throw new Error(`Invalid transaction data: ${error.details[0].message}`);
    }
    return true;
  }

  process() {
    this.status = TransactionStatus.COMPLETED;
    this.processedAt = new Date();
    this.validate();
  }

  fail(reason) {
    this.status = TransactionStatus.FAILED;
    this.processedAt = new Date();
    if (reason) {
      this.description += ` (Failed: ${reason})`;
    }
  }

  addAMLFlag(flag) {
    if (!this.amlFlags.includes(flag)) {
      this.amlFlags.push(flag);
    }
  }
}

// Loan Application Data Structure
class LoanApplication {
  constructor(customerId, loanType, requestedAmount, purpose) {
    this.applicationId = uuidv4();
    this.customerId = customerId;
    this.loanType = loanType;
    this.requestedAmount = requestedAmount;
    this.purpose = purpose;
    this.documents = [];
    this.creditScore = null;
    this.riskAssessment = null;
    this.status = ApplicationStatus.SUBMITTED;
    this.decision = null;
    this.assignedOfficer = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // Validate the loan application
    this.validate();
  }

  validate() {
    const { error } = validators.validateLoanApplication(this);
    if (error) {
      throw new Error(`Invalid loan application data: ${error.details[0].message}`);
    }
    return true;
  }

  addDocument(documentType, fileName) {
    const document = {
      documentType,
      fileName,
      uploadDate: new Date(),
      verified: false
    };
    this.documents.push(document);
    this.updatedAt = new Date();
    return document;
  }

  setCreditScore(score) {
    if (score < 300 || score > 850) {
      throw new Error('Credit score must be between 300 and 850');
    }
    this.creditScore = score;
    this.updatedAt = new Date();
  }

  makeDecision(approved, approvedAmount = null, interestRate = null, terms = null, reason = null) {
    this.decision = {
      approved,
      approvedAmount,
      interestRate,
      terms,
      decisionDate: new Date(),
      decisionReason: reason
    };
    this.status = approved ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED;
    this.updatedAt = new Date();
    this.validate();
  }
}

// Audit Log Data Structure
class AuditLog {
  constructor(entityType, entityId, action, performedBy, beforeState = null, afterState = null, metadata = {}) {
    this.logId = uuidv4();
    this.entityType = entityType;
    this.entityId = entityId;
    this.action = action;
    this.performedBy = performedBy;
    this.timestamp = new Date();
    this.beforeState = beforeState;
    this.afterState = afterState;
    this.metadata = metadata;

    // Validate the audit log
    this.validate();
  }

  validate() {
    const { error } = validators.validateAuditLog(this);
    if (error) {
      throw new Error(`Invalid audit log data: ${error.details[0].message}`);
    }
    return true;
  }
}

// Payment Order Data Structure
class PaymentOrder {
  constructor(fromAccountId, toAccountId, amount, currency, paymentType, description = '') {
    this.paymentId = uuidv4();
    this.fromAccountId = fromAccountId;
    this.toAccountId = toAccountId;
    this.amount = amount;
    this.currency = currency;
    this.paymentType = paymentType;
    this.description = description;
    this.status = PaymentStatus.PENDING;
    this.paymentRail = null;
    this.exchangeRate = null;
    this.convertedAmount = null;
    this.targetCurrency = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.createdAt = new Date();
    this.processedAt = null;
    this.failureReason = null;

    // Validate the payment order
    this.validate();
  }

  validate() {
    const { error } = validators.validatePaymentOrder(this);
    if (error) {
      throw new Error(`Invalid payment order data: ${error.details[0].message}`);
    }
    return true;
  }

  setPaymentRail(rail) {
    if (!Object.values(PaymentRail).includes(rail)) {
      throw new Error(`Invalid payment rail: ${rail}`);
    }
    this.paymentRail = rail;
  }

  setCurrencyConversion(targetCurrency, exchangeRate, convertedAmount) {
    this.targetCurrency = targetCurrency;
    this.exchangeRate = exchangeRate;
    this.convertedAmount = convertedAmount;
  }

  markCompleted() {
    this.status = PaymentStatus.COMPLETED;
    this.processedAt = new Date();
    this.validate();
  }

  markFailed(reason) {
    this.status = PaymentStatus.FAILED;
    this.processedAt = new Date();
    this.failureReason = reason;
  }

  incrementRetry() {
    this.retryCount++;
    if (this.retryCount < this.maxRetries) {
      this.status = PaymentStatus.RETRY;
      return true;
    }
    return false;
  }

  canRetry() {
    return this.retryCount < this.maxRetries;
  }
}

module.exports = {
  Customer,
  PersonalInformation,
  IdentityDocument,
  Account,
  Transaction,
  LoanApplication,
  AuditLog,
  PaymentOrder
};