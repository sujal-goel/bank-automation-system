const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const router = express.Router();

// Security middleware
router.use(helmet());
router.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Different rate limits for different endpoint types
const generalRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many requests from this IP');
const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
const transactionRateLimit = createRateLimit(60 * 1000, 10, 'Too many transaction requests');

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'banking-system-secret-key';

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Request validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Authentication routes - use the new auth module
const authRoutes = require('../modules/auth/routes');
router.use('/auth', authRoutes);

// Apply general rate limiting to all protected routes
router.use(generalRateLimit);

// Import banking modules
const { AccountOpeningModule } = require('../modules/account-opening');
const { LoanProcessingModule } = require('../modules/loan-processing');
const { KYCModule } = require('../modules/kyc');
const { AMLModule } = require('../modules/aml');
const { TransactionProcessingModule } = require('../modules/transaction-processing');
const { PaymentProcessingModule } = require('../modules/payment-processing');
const AuditService = require('../services/audit-service');
const { RegulatoryReportingModule } = require('../services/regulatory-reporting');

// Initialize modules
const accountOpeningModule = new AccountOpeningModule();
const loanProcessingModule = new LoanProcessingModule();
const kycModule = new KYCModule();
const amlModule = new AMLModule();
const transactionProcessingModule = new TransactionProcessingModule();
const paymentProcessingModule = new PaymentProcessingModule();
const auditService = new AuditService();
const regulatoryReportingModule = new RegulatoryReportingModule();

// Account Opening Module routes
const accountRouter = express.Router();
accountRouter.post('/open', async (req, res) => {
  try {
    const result = await accountOpeningModule.processAccountOpening(req.body);
    await auditService.logAction('ACCOUNT_OPENING', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    await auditService.logError('ACCOUNT_OPENING_ERROR', req.user.userId, error.message);
    res.status(500).json({ error: error.message });
  }
});

accountRouter.get('/status/:applicationId', async (req, res) => {
  try {
    const result = await accountOpeningModule.getApplicationStatus(req.params.applicationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

accountRouter.get('/eligibility', async (req, res) => {
  try {
    const result = await accountOpeningModule.checkEligibility(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/accounts', authenticateToken, authorizeRoles('bank_officer', 'admin'), accountRouter);

// Loan Processing Module routes
const loanRouter = express.Router();
loanRouter.post('/apply', async (req, res) => {
  try {
    const result = await loanProcessingModule.processLoanApplication(req.body);
    await auditService.logAction('LOAN_APPLICATION', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    await auditService.logError('LOAN_APPLICATION_ERROR', req.user.userId, error.message);
    res.status(500).json({ error: error.message });
  }
});

loanRouter.get('/status/:applicationId', async (req, res) => {
  try {
    const result = await loanProcessingModule.getLoanStatus(req.params.applicationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

loanRouter.post('/decision/:applicationId', async (req, res) => {
  try {
    const result = await loanProcessingModule.makeLoanDecision(req.params.applicationId, req.body);
    await auditService.logAction('LOAN_DECISION', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/loans', authenticateToken, authorizeRoles('bank_officer', 'admin'), loanRouter);

// KYC Module routes
const kycRouter = express.Router();
kycRouter.post('/verify', async (req, res) => {
  try {
    const result = await kycModule.performKYCVerification(req.body);
    await auditService.logAction('KYC_VERIFICATION', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    await auditService.logError('KYC_VERIFICATION_ERROR', req.user.userId, error.message);
    res.status(500).json({ error: error.message });
  }
});

kycRouter.get('/status/:customerId', async (req, res) => {
  try {
    const result = await kycModule.getKYCStatus(req.params.customerId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

kycRouter.post('/documents/upload', async (req, res) => {
  try {
    const result = await kycModule.uploadDocument(req.body);
    await auditService.logAction('DOCUMENT_UPLOAD', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/kyc', authenticateToken, authorizeRoles('compliance_officer', 'bank_officer', 'admin'), kycRouter);

// AML Module routes
const amlRouter = express.Router();
amlRouter.post('/screen', async (req, res) => {
  try {
    const result = await amlModule.screenTransaction(req.body);
    await auditService.logAction('AML_SCREENING', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    await auditService.logError('AML_SCREENING_ERROR', req.user.userId, error.message);
    res.status(500).json({ error: error.message });
  }
});

amlRouter.get('/alerts', async (req, res) => {
  try {
    const result = await amlModule.getAMLAlerts(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

amlRouter.post('/sar/generate', async (req, res) => {
  try {
    const result = await amlModule.generateSAR(req.body);
    await auditService.logAction('SAR_GENERATION', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/aml', authenticateToken, authorizeRoles('compliance_officer', 'admin'), amlRouter);

// Transaction Processing Module routes
const transactionRouter = express.Router();
transactionRouter.post('/process', async (req, res) => {
  try {
    const result = await transactionProcessingModule.processTransaction(req.body);
    await auditService.logAction('TRANSACTION_PROCESSING', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    await auditService.logError('TRANSACTION_PROCESSING_ERROR', req.user.userId, error.message);
    res.status(500).json({ error: error.message });
  }
});

transactionRouter.get('/status/:transactionId', async (req, res) => {
  try {
    const result = await transactionProcessingModule.getTransactionStatus(req.params.transactionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

transactionRouter.get('/history/:accountId', async (req, res) => {
  try {
    const result = await transactionProcessingModule.getTransactionHistory(req.params.accountId, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/transactions', transactionRateLimit, authenticateToken, authorizeRoles('bank_officer', 'customer', 'admin'), transactionRouter);

// Payment Processing Module routes
const paymentRouter = express.Router();
paymentRouter.post('/process', async (req, res) => {
  try {
    const result = await paymentProcessingModule.processPaymentWithRetry(
      req.body.paymentData,
      req.body.accountBalance,
      req.body.targetCurrency,
      req.body.notificationRecipients
    );
    await auditService.logAction('PAYMENT_PROCESSING', req.user.userId, req.body, result);
    res.json(result);
  } catch (error) {
    await auditService.logError('PAYMENT_PROCESSING_ERROR', req.user.userId, error.message);
    res.status(500).json({ error: error.message });
  }
});

paymentRouter.get('/status/:paymentId', async (req, res) => {
  try {
    const result = await paymentProcessingModule.getPaymentStatus(req.params.paymentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

paymentRouter.get('/rails', async (req, res) => {
  try {
    const result = await paymentProcessingModule.getAvailablePaymentRails(req.query.paymentType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

paymentRouter.post('/convert', async (req, res) => {
  try {
    const result = await paymentProcessingModule.convertCurrency(
      req.body.amount,
      req.body.fromCurrency,
      req.body.toCurrency
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/payments', transactionRateLimit, authenticateToken, authorizeRoles('bank_officer', 'customer', 'admin'), paymentRouter);

// Audit and Compliance routes
const auditRouter = express.Router();
auditRouter.get('/logs', async (req, res) => {
  try {
    const result = await auditService.getAuditLogs(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

auditRouter.get('/reports', async (req, res) => {
  try {
    const result = await regulatoryReportingModule.generateReport(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

auditRouter.get('/compliance/status', async (req, res) => {
  try {
    const result = await regulatoryReportingModule.getComplianceStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/audit', authenticateToken, authorizeRoles('compliance_officer', 'admin'), auditRouter);

// Health check and system status routes (no authentication required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    uptime: process.uptime()
  });
});

router.get('/status', (req, res) => {
  res.json({
    api: 'Banking Process Automation API',
    status: 'operational',
    modules: {
      accountOpening: 'active',
      loanProcessing: 'active',
      kyc: 'active',
      aml: 'active',
      transactionProcessing: 'active',
      paymentProcessing: 'active',
      audit: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    title: 'Banking Process Automation API',
    version: '1.0.0',
    description: 'Comprehensive API for automated banking operations',
    endpoints: {
      authentication: {
        'POST /auth/login': 'Authenticate user and get JWT token',
        'POST /auth/refresh': 'Refresh JWT token'
      },
      accounts: {
        'POST /accounts/open': 'Open new account',
        'GET /accounts/status/:applicationId': 'Get account opening status',
        'GET /accounts/eligibility': 'Check account eligibility'
      },
      loans: {
        'POST /loans/apply': 'Submit loan application',
        'GET /loans/status/:applicationId': 'Get loan application status',
        'POST /loans/decision/:applicationId': 'Make loan decision'
      },
      kyc: {
        'POST /kyc/verify': 'Perform KYC verification',
        'GET /kyc/status/:customerId': 'Get KYC status',
        'POST /kyc/documents/upload': 'Upload KYC documents'
      },
      aml: {
        'POST /aml/screen': 'Screen transaction for AML',
        'GET /aml/alerts': 'Get AML alerts',
        'POST /aml/sar/generate': 'Generate SAR report'
      },
      transactions: {
        'POST /transactions/process': 'Process transaction',
        'GET /transactions/status/:transactionId': 'Get transaction status',
        'GET /transactions/history/:accountId': 'Get transaction history'
      },
      payments: {
        'POST /payments/process': 'Process payment',
        'GET /payments/status/:paymentId': 'Get payment status',
        'GET /payments/rails': 'Get available payment rails',
        'POST /payments/convert': 'Convert currency'
      },
      audit: {
        'GET /audit/logs': 'Get audit logs',
        'GET /audit/reports': 'Get regulatory reports',
        'GET /audit/compliance/status': 'Get compliance status'
      }
    }
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('API Gateway Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = { 
  apiGateway: router,
  authenticateToken,
  authorizeRoles,
  validateRequest
};