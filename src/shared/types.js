// Banking Domain Types and Enums

// Account Types
const AccountType = {
  SAVINGS: 'SAVINGS',
  CHECKING: 'CHECKING',
  BUSINESS: 'BUSINESS',
  INVESTMENT: 'INVESTMENT'
};

// Account Status
const AccountStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED'
};

// Document Types
const DocumentType = {
  PASSPORT: 'PASSPORT',
  DRIVERS_LICENSE: 'DRIVERS_LICENSE',
  NATIONAL_ID: 'NATIONAL_ID',
  AADHAAR: 'AADHAAR',
  PAN: 'PAN',
  BANK_STATEMENT: 'BANK_STATEMENT',
  INCOME_PROOF: 'INCOME_PROOF'
};

// Verification Status
const VerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED'
};

// Transaction Types
const TransactionType = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  TRANSFER: 'TRANSFER',
  PAYMENT: 'PAYMENT',
  FEE: 'FEE'
};

// Transaction Status
const TransactionStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// Loan Types
const LoanType = {
  PERSONAL: 'PERSONAL',
  HOME: 'HOME',
  AUTO: 'AUTO',
  BUSINESS: 'BUSINESS',
  EDUCATION: 'EDUCATION'
};

// Application Status
const ApplicationStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

// KYC Status
const KYCStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

// Currency
const Currency = {
  USD: 'USD',
  EUR: 'EUR',
  INR: 'INR',
  GBP: 'GBP'
};

// Payment Types
const PaymentType = {
  DOMESTIC_TRANSFER: 'DOMESTIC_TRANSFER',
  INTERNATIONAL_TRANSFER: 'INTERNATIONAL_TRANSFER',
  BILL_PAYMENT: 'BILL_PAYMENT',
  SALARY_PAYMENT: 'SALARY_PAYMENT',
  VENDOR_PAYMENT: 'VENDOR_PAYMENT'
};

// Payment Status
const PaymentStatus = {
  PENDING: 'PENDING',
  VALIDATING: 'VALIDATING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  RETRY: 'RETRY'
};

// Payment Rail Types
const PaymentRail = {
  SWIFT: 'SWIFT',
  RTGS: 'RTGS',
  NEFT: 'NEFT',
  UPI: 'UPI',
  ACH: 'ACH',
  WIRE: 'WIRE'
};

module.exports = {
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
};