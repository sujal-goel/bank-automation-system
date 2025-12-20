// Services Directory
// Shared services across modules

const OCREngine = require('./ocr-engine');
const DocumentProcessor = require('./document-processor');
const IdentityValidator = require('./identity-validator');
const DocumentAuthenticator = require('./document-authenticator');
const { NotificationService } = require('./notification-service');
const AuditService = require('./audit-service');
const { RegulatoryReportingModule } = require('./regulatory-reporting');
const { OperationalDashboard } = require('./operational-dashboard');
const ServiceRegistry = require('./service-registry');
const CircuitBreaker = require('./circuit-breaker');
const HealthMonitor = require('./health-monitor');
const CreditBureauInterface = require('./credit-bureau-interface');
const { CIBILAdapter, ExperianAdapter, EquifaxAdapter } = require('./credit-bureau-adapters');
const CreditBureauMockService = require('./credit-bureau-mock-service');
const { 
  BasePaymentNetworkAdapter,
  SWIFTAdapter,
  RTGSAdapter,
  NEFTAdapter,
  UPIAdapter,
  PaymentRailSelector
} = require('./payment-network-adapters');

module.exports = {
  OCREngine,
  DocumentProcessor,
  IdentityValidator,
  DocumentAuthenticator,
  NotificationService,
  AuditService,
  RegulatoryReportingModule,
  OperationalDashboard,
  ServiceRegistry,
  CircuitBreaker,
  HealthMonitor,
  CreditBureauInterface,
  CIBILAdapter,
  ExperianAdapter,
  EquifaxAdapter,
  CreditBureauMockService,
  BasePaymentNetworkAdapter,
  SWIFTAdapter,
  RTGSAdapter,
  NEFTAdapter,
  UPIAdapter,
  PaymentRailSelector
};