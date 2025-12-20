const Joi = require('joi');
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

// Personal Information Validation Schema
const personalInfoSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  dateOfBirth: Joi.date().max('now').required(),
  nationality: Joi.string().length(2).required(), // ISO country code
  address: Joi.object({
    street: Joi.string().min(1).max(100).required(),
    city: Joi.string().min(1).max(50).required(),
    state: Joi.string().min(1).max(50).optional(),
    postalCode: Joi.string().min(1).max(20).optional(),
    country: Joi.string().length(2).required() // ISO country code
  }).required(),
  contactInfo: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(), // E.164 format
    alternatePhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
  }).required()
});

// Customer Validation Schema
const customerSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  personalInfo: personalInfoSchema.required(),
  identityDocuments: Joi.array().items(Joi.object({
    documentType: Joi.string().valid(...Object.values(DocumentType)).required(),
    documentNumber: Joi.string().min(1).max(50).required(),
    issuingAuthority: Joi.string().min(1).max(100).required(),
    expiryDate: Joi.date().greater('now').required(),
    verificationStatus: Joi.string().valid(...Object.values(VerificationStatus)).required(),
    extractedData: Joi.object().optional()
  })).default([]),
  kycStatus: Joi.string().valid(...Object.values(KYCStatus)).default(KYCStatus.NOT_STARTED),
  riskProfile: Joi.object({
    riskScore: Joi.number().min(0).max(100).required(),
    riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').required(),
    lastAssessment: Joi.date().required()
  }).optional().allow(null),
  accounts: Joi.array().items(Joi.string().uuid()).default([]),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required()
});

// Account Validation Schema
const accountSchema = Joi.object({
  accountId: Joi.string().uuid().required(),
  customerId: Joi.string().uuid().required(),
  accountType: Joi.string().valid(...Object.values(AccountType)).required(),
  accountNumber: Joi.string().pattern(/^1000\d{9}$/).required(),
  status: Joi.string().valid(...Object.values(AccountStatus)).default(AccountStatus.ACTIVE),
  balance: Joi.number().precision(2).default(0.0),
  currency: Joi.string().valid(...Object.values(Currency)).default(Currency.USD),
  openingDate: Joi.date().required(),
  closingDate: Joi.date().greater(Joi.ref('openingDate')).optional().allow(null)
});

// Transaction Validation Schema
const transactionSchema = Joi.object({
  transactionId: Joi.string().uuid().required(),
  accountId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid(...Object.values(Currency)).required(),
  transactionType: Joi.string().valid(...Object.values(TransactionType)).required(),
  description: Joi.string().min(1).max(200).required(),
  counterparty: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    accountNumber: Joi.string().optional(),
    bankCode: Joi.string().optional(),
    address: Joi.string().optional()
  }).optional().allow(null),
  status: Joi.string().valid(...Object.values(TransactionStatus)).default(TransactionStatus.PENDING),
  processedAt: Joi.date().optional().allow(null),
  amlFlags: Joi.array().items(Joi.string()).default([]),
  fraudScore: Joi.number().min(0).max(100).default(0.0)
});

// Loan Application Validation Schema
const loanApplicationSchema = Joi.object({
  applicationId: Joi.string().uuid().required(),
  customerId: Joi.string().uuid().required(),
  loanType: Joi.string().valid(...Object.values(LoanType)).required(),
  requestedAmount: Joi.number().positive().precision(2).required(),
  purpose: Joi.string().min(1).max(500).required(),
  documents: Joi.array().items(Joi.object({
    documentType: Joi.string().required(),
    fileName: Joi.string().required(),
    uploadDate: Joi.date().required(),
    verified: Joi.boolean().default(false)
  })).default([]),
  creditScore: Joi.number().min(300).max(850).optional().allow(null),
  riskAssessment: Joi.object({
    riskScore: Joi.number().min(0).max(100).required(),
    riskFactors: Joi.array().items(Joi.string()).required(),
    assessmentDate: Joi.date().required()
  }).optional().allow(null),
  status: Joi.string().valid(...Object.values(ApplicationStatus)).default(ApplicationStatus.SUBMITTED),
  decision: Joi.object({
    approved: Joi.boolean().required(),
    approvedAmount: Joi.number().positive().precision(2).optional().allow(null),
    interestRate: Joi.number().min(0).max(100).optional().allow(null),
    terms: Joi.alternatives().try(Joi.string(), Joi.object()).optional().allow(null),
    decisionDate: Joi.date().required(),
    decisionReason: Joi.string().optional().allow(null)
  }).optional().allow(null),
  assignedOfficer: Joi.string().uuid().optional().allow(null),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required()
});

// Audit Log Validation Schema
const auditLogSchema = Joi.object({
  logId: Joi.string().uuid().required(),
  entityType: Joi.string().min(1).max(50).required(),
  entityId: Joi.string().uuid().required(),
  action: Joi.string().min(1).max(50).required(),
  performedBy: Joi.string().uuid().required(),
  timestamp: Joi.date().required(),
  beforeState: Joi.object().optional().allow(null),
  afterState: Joi.object().optional().allow(null),
  metadata: Joi.object().default({})
});

// Payment Order Validation Schema
const paymentOrderSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  fromAccountId: Joi.string().uuid().required(),
  toAccountId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid(...Object.values(Currency)).required(),
  paymentType: Joi.string().valid(...Object.values(PaymentType)).required(),
  description: Joi.string().max(200).default(''),
  status: Joi.string().valid(...Object.values(PaymentStatus)).default(PaymentStatus.PENDING),
  paymentRail: Joi.string().valid(...Object.values(PaymentRail)).optional().allow(null),
  exchangeRate: Joi.number().positive().optional().allow(null),
  convertedAmount: Joi.number().positive().precision(2).optional().allow(null),
  targetCurrency: Joi.string().valid(...Object.values(Currency)).optional().allow(null),
  retryCount: Joi.number().min(0).default(0),
  maxRetries: Joi.number().min(0).default(3),
  createdAt: Joi.date().required(),
  processedAt: Joi.date().optional().allow(null),
  failureReason: Joi.string().optional().allow(null)
});

// Validation functions
const validatePersonalInfo = (data) => {
  return personalInfoSchema.validate(data);
};

const validateCustomer = (data) => {
  return customerSchema.validate(data);
};

const validateAccount = (data) => {
  return accountSchema.validate(data);
};

const validateTransaction = (data) => {
  return transactionSchema.validate(data);
};

const validateLoanApplication = (data) => {
  return loanApplicationSchema.validate(data);
};

const validateAuditLog = (data) => {
  return auditLogSchema.validate(data);
};

const validatePaymentOrder = (data) => {
  return paymentOrderSchema.validate(data);
};

module.exports = {
  schemas: {
    personalInfoSchema,
    customerSchema,
    accountSchema,
    transactionSchema,
    loanApplicationSchema,
    auditLogSchema,
    paymentOrderSchema
  },
  validators: {
    validatePersonalInfo,
    validateCustomer,
    validateAccount,
    validateTransaction,
    validateLoanApplication,
    validateAuditLog,
    validatePaymentOrder
  }
};