// Regulatory Reporting and Monitoring Tests

const { v4: uuidv4 } = require('uuid');
const { AuditModule } = require('../modules/audit');
const AuditService = require('../services/audit-service');
const { RegulatoryReportingModule, ReportType, ReportStatus } = require('../services/regulatory-reporting');
const { OperationalDashboard } = require('../services/operational-dashboard');

describe('Regulatory Reporting Module', () => {
  let auditService;
  let regulatoryReporting;
  let auditModule;

  beforeEach(() => {
    auditService = new AuditService();
    regulatoryReporting = new RegulatoryReportingModule(auditService);
    auditModule = new AuditModule();
  });

  describe('KYC Compliance Report Generation', () => {
    test('should generate KYC compliance report with statistics', async () => {
      // Create some KYC audit logs
      const now = new Date();
      const reportingPeriod = {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      };

      // Add some KYC audit logs
      const customerId1 = uuidv4();
      const customerId2 = uuidv4();
      const systemUserId = uuidv4();
      
      await auditService.log('KYC', customerId1, 'KYC_STARTED', systemUserId);
      await auditService.log('KYC', customerId1, 'KYC_COMPLETED', systemUserId);
      await auditService.log('KYC', customerId2, 'KYC_STARTED', systemUserId);
      await auditService.log('KYC', customerId2, 'KYC_FAILED', systemUserId);

      const adminUserId = uuidv4();
      const report = await regulatoryReporting.generateKYCComplianceReport(reportingPeriod, adminUserId);

      expect(report).toBeDefined();
      expect(report.reportType).toBe(ReportType.KYC_COMPLIANCE);
      expect(report.status).toBe(ReportStatus.COMPLETED);
      expect(report.data.statistics).toBeDefined();
      expect(report.data.statistics.totalCustomersProcessed).toBeGreaterThan(0);
      expect(report.data.statistics.completedKYC).toBe(1);
      expect(report.data.statistics.failedKYC).toBe(1);
    });

    test('should calculate KYC compliance rate correctly', async () => {
      const now = new Date();
      const reportingPeriod = {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      };

      // Add KYC logs
      const systemUserId = uuidv4();
      await auditService.log('KYC', uuidv4(), 'KYC_COMPLETED', systemUserId);
      await auditService.log('KYC', uuidv4(), 'KYC_COMPLETED', systemUserId);
      await auditService.log('KYC', uuidv4(), 'KYC_FAILED', systemUserId);

      const adminUserId = uuidv4();
      const report = await regulatoryReporting.generateKYCComplianceReport(reportingPeriod, adminUserId);

      expect(report.data.statistics.complianceRate).toBeGreaterThan(0);
      expect(report.data.statistics.complianceRate).toBeLessThanOrEqual(100);
    });
  });

  describe('AML Suspicious Activity Report Generation', () => {
    test('should generate AML suspicious activity report', async () => {
      const now = new Date();
      const reportingPeriod = {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      };

      // Add AML audit logs
      const systemUserId = uuidv4();
      const transactionId1 = uuidv4();
      const transactionId2 = uuidv4();
      
      await auditService.log('AML', transactionId1, 'TRANSACTION_SCREENED', systemUserId);
      await auditService.log('AML', transactionId2, 'SUSPICIOUS_ACTIVITY_DETECTED', systemUserId);
      await auditService.log('AML', transactionId2, 'SAR_GENERATED', systemUserId);

      const adminUserId = uuidv4();
      const report = await regulatoryReporting.generateAMLSuspiciousActivityReport(reportingPeriod, adminUserId);

      expect(report).toBeDefined();
      expect(report.reportType).toBe(ReportType.AML_SUSPICIOUS_ACTIVITY);
      expect(report.status).toBe(ReportStatus.COMPLETED);
      expect(report.data.statistics.totalTransactionsScreened).toBe(1);
      expect(report.data.statistics.suspiciousActivitiesDetected).toBe(2);
      expect(report.data.statistics.sarsGenerated).toBe(1);
    });

    test('should calculate AML alert rate correctly', async () => {
      const now = new Date();
      const reportingPeriod = {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      };

      // Add multiple transaction screenings
      const systemUserId = uuidv4();
      for (let i = 0; i < 10; i++) {
        await auditService.log('AML', uuidv4(), 'TRANSACTION_SCREENED', systemUserId);
      }
      await auditService.log('AML', uuidv4(), 'SUSPICIOUS_ACTIVITY_DETECTED', systemUserId);

      const adminUserId = uuidv4();
      const report = await regulatoryReporting.generateAMLSuspiciousActivityReport(reportingPeriod, adminUserId);

      expect(report.data.statistics.alertRate).toBeGreaterThan(0);
      expect(report.data.statistics.alertRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Operational Metrics Report Generation', () => {
    test('should generate operational metrics report', async () => {
      const now = new Date();
      const reportingPeriod = {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      };

      // Add various operational logs
      const systemUserId = uuidv4();
      await auditService.log('ACCOUNT', uuidv4(), 'CREATED', systemUserId);
      await auditService.log('LOAN', uuidv4(), 'SUBMITTED', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);
      await auditService.log('PAYMENT', uuidv4(), 'COMPLETED', systemUserId);

      const adminUserId = uuidv4();
      const report = await regulatoryReporting.generateOperationalMetricsReport(reportingPeriod, adminUserId);

      expect(report).toBeDefined();
      expect(report.reportType).toBe(ReportType.OPERATIONAL_METRICS);
      expect(report.status).toBe(ReportStatus.COMPLETED);
      expect(report.data.metrics).toBeDefined();
      expect(report.data.metrics.accountOpenings).toBe(1);
      expect(report.data.metrics.loanApplications).toBe(1);
      expect(report.data.metrics.transactionsProcessed).toBe(1);
      expect(report.data.metrics.paymentsProcessed).toBe(1);
    });

    test('should track system errors in operational metrics', async () => {
      const now = new Date();
      const reportingPeriod = {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      };

      // Add successful and failed operations
      const systemUserId = uuidv4();
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_ERROR', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'VALIDATION_FAILED', systemUserId);

      const adminUserId = uuidv4();
      const report = await regulatoryReporting.generateOperationalMetricsReport(reportingPeriod, adminUserId);

      expect(report.data.metrics.systemErrors).toBe(2);
    });
  });

  describe('Report Submission', () => {
    test('should submit completed report successfully', async () => {
      const now = new Date();
      const reportingPeriod = {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      };

      const adminUserId = uuidv4();
      const report = await regulatoryReporting.generateKYCComplianceReport(reportingPeriod, adminUserId);
      const submitted = await regulatoryReporting.submitReport(report.reportId, adminUserId);

      expect(submitted).toBe(true);
      expect(report.status).toBe(ReportStatus.SUBMITTED);
      expect(report.submittedAt).toBeDefined();
    });

    test('should fail to submit non-existent report', async () => {
      const adminUserId = uuidv4();
      await expect(
        regulatoryReporting.submitReport('non-existent-id', adminUserId)
      ).rejects.toThrow('Report not found');
    });

    test('should fail to submit report that is not completed', async () => {
      const now = new Date();
      const reportingPeriod = {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      };

      const adminUserId = uuidv4();
      const report = await regulatoryReporting.generateKYCComplianceReport(reportingPeriod, adminUserId);
      report.status = ReportStatus.GENERATING;

      await expect(
        regulatoryReporting.submitReport(report.reportId, adminUserId)
      ).rejects.toThrow('Report not ready for submission');
    });
  });

  describe('Compliance Violation Detection', () => {
    test('should detect large transaction without proper reporting', async () => {
      const event = {
        entityType: 'TRANSACTION',
        action: 'CREATED',
        afterState: {
          amount: 15000,
          amlFlags: []
        }
      };

      const violation = await regulatoryReporting.detectComplianceViolation(event);

      expect(violation).toBeDefined();
      expect(violation.violationType).toBe('LARGE_TRANSACTION_UNREPORTED');
      expect(violation.severity).toBe('HIGH');
    });

    test('should detect high fraud score transactions', async () => {
      const event = {
        entityType: 'TRANSACTION',
        action: 'CREATED',
        afterState: {
          amount: 5000,
          fraudScore: 0.9,
          amlFlags: []
        }
      };

      const violation = await regulatoryReporting.detectComplianceViolation(event);

      expect(violation).toBeDefined();
      expect(violation.violationType).toBe('HIGH_FRAUD_SCORE');
      expect(violation.severity).toBe('MEDIUM');
    });

    test('should not detect violation for normal transactions', async () => {
      const event = {
        entityType: 'TRANSACTION',
        action: 'CREATED',
        afterState: {
          amount: 500,
          fraudScore: 0.1,
          amlFlags: []
        }
      };

      const violation = await regulatoryReporting.detectComplianceViolation(event);

      expect(violation).toBeNull();
    });
  });

  describe('Compliance Alert Subscription', () => {
    test('should notify subscribers of compliance violations', async () => {
      const notifications = [];
      const subscriber = {
        notify: async (alert) => {
          notifications.push(alert);
        }
      };

      regulatoryReporting.subscribeToAlerts(subscriber);

      const event = {
        entityType: 'TRANSACTION',
        action: 'CREATED',
        afterState: {
          amount: 20000,
          amlFlags: []
        }
      };

      await regulatoryReporting.detectComplianceViolation(event);

      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('COMPLIANCE_VIOLATION');
    });
  });

  describe('Compliance Violation Queries', () => {
    test('should filter violations by severity', async () => {
      // Create violations of different severities
      await regulatoryReporting.detectComplianceViolation({
        entityType: 'TRANSACTION',
        afterState: { amount: 15000, amlFlags: [] }
      });

      await regulatoryReporting.detectComplianceViolation({
        entityType: 'TRANSACTION',
        afterState: { amount: 5000, fraudScore: 0.9, amlFlags: [] }
      });

      const highSeverity = regulatoryReporting.getComplianceViolations({ severity: 'HIGH' });
      const mediumSeverity = regulatoryReporting.getComplianceViolations({ severity: 'MEDIUM' });

      expect(highSeverity.length).toBeGreaterThan(0);
      expect(mediumSeverity.length).toBeGreaterThan(0);
      expect(highSeverity[0].severity).toBe('HIGH');
      expect(mediumSeverity[0].severity).toBe('MEDIUM');
    });

    test('should filter violations by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await regulatoryReporting.detectComplianceViolation({
        entityType: 'TRANSACTION',
        afterState: { amount: 15000, amlFlags: [] }
      });

      const recentViolations = regulatoryReporting.getComplianceViolations({
        startDate: yesterday
      });

      expect(recentViolations.length).toBeGreaterThan(0);
    });
  });
});

describe('Operational Dashboard', () => {
  let auditService;
  let regulatoryReporting;
  let dashboard;

  beforeEach(() => {
    auditService = new AuditService();
    regulatoryReporting = new RegulatoryReportingModule(auditService);
    dashboard = new OperationalDashboard(auditService, regulatoryReporting, false);
  });

  afterEach(() => {
    if (dashboard) {
      dashboard.stopRealTimeCollection();
    }
  });

  describe('Dashboard Data Retrieval', () => {
    test('should get comprehensive dashboard data', async () => {
      // Add some audit logs
      const systemUserId = uuidv4();
      await auditService.log('ACCOUNT', uuidv4(), 'CREATED', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);
      await auditService.log('LOAN', uuidv4(), 'SUBMITTED', systemUserId);

      const dashboardData = await dashboard.getDashboardData();

      expect(dashboardData).toBeDefined();
      expect(dashboardData.timestamp).toBeDefined();
      expect(dashboardData.kpis).toBeDefined();
      expect(dashboardData.systemHealth).toBeDefined();
      expect(dashboardData.transactionMetrics).toBeDefined();
      expect(dashboardData.operationalMetrics).toBeDefined();
      expect(dashboardData.complianceStatus).toBeDefined();
    });

    test('should calculate KPIs correctly', async () => {
      // Add various operations
      const systemUserId = uuidv4();
      await auditService.log('ACCOUNT', uuidv4(), 'CREATED', systemUserId);
      await auditService.log('ACCOUNT', uuidv4(), 'CREATED', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_ERROR', systemUserId);

      const dashboardData = await dashboard.getDashboardData();

      expect(dashboardData.kpis.accountOpeningsLast24Hours).toBe(2);
      expect(dashboardData.kpis.transactionSuccessRate).toBeDefined();
      expect(dashboardData.kpis.transactionFailureRate).toBeDefined();
    });
  });

  describe('System Health Metrics', () => {
    test('should report healthy system status', async () => {
      // Add successful operations
      const systemUserId = uuidv4();
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);

      const dashboardData = await dashboard.getDashboardData();

      expect(dashboardData.systemHealth.systemStatus).toBe('HEALTHY');
      expect(parseFloat(dashboardData.systemHealth.systemUptime)).toBeGreaterThan(90);
    });

    test('should detect system issues', async () => {
      // Add many errors
      const systemUserId = uuidv4();
      for (let i = 0; i < 10; i++) {
        await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_ERROR', systemUserId);
      }

      const dashboardData = await dashboard.getDashboardData();

      expect(dashboardData.systemHealth.totalErrors).toBe(10);
      expect(parseFloat(dashboardData.systemHealth.errorRate)).toBeGreaterThan(0);
    });
  });

  describe('Transaction Metrics', () => {
    test('should track transaction processing metrics', async () => {
      const systemUserId = uuidv4();
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_ERROR', systemUserId);

      const dashboardData = await dashboard.getDashboardData();

      expect(dashboardData.transactionMetrics.transactionsProcessed).toBe(2);
      expect(dashboardData.transactionMetrics.transactionsFailed).toBe(1);
      expect(dashboardData.transactionMetrics.totalTransactionVolume).toBeGreaterThan(0);
    });
  });

  describe('Alert Generation', () => {
    test('should generate alerts for threshold violations', async () => {
      // Create conditions that trigger alerts
      const systemUserId = uuidv4();
      for (let i = 0; i < 20; i++) {
        await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_ERROR', systemUserId);
      }

      const dashboardData = await dashboard.getDashboardData();
      const alerts = await dashboard.getActiveAlerts();

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    test('should update alert thresholds', () => {
      dashboard.updateAlertThreshold('transaction_failure_rate', { max: 10.0 });
      
      const threshold = dashboard.alertThresholds.get('transaction_failure_rate');
      expect(threshold.max).toBe(10.0);
    });
  });

  describe('Dashboard Subscriptions', () => {
    test('should notify subscribers of data updates', async () => {
      const updates = [];
      const subscriber = {
        update: (data) => {
          updates.push(data);
        }
      };

      dashboard.subscribe(subscriber);
      await dashboard.getDashboardData();

      expect(updates.length).toBeGreaterThan(0);
    });

    test('should allow unsubscribing', async () => {
      const updates = [];
      const subscriber = {
        update: (data) => {
          updates.push(data);
        }
      };

      dashboard.subscribe(subscriber);
      dashboard.unsubscribe(subscriber);
      await dashboard.getDashboardData();

      // Should not receive updates after unsubscribing
      expect(updates.length).toBe(0);
    });
  });

  describe('Historical Data', () => {
    test('should retrieve historical dashboard data', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      // Add some historical logs
      const systemUserId = uuidv4();
      await auditService.log('ACCOUNT', uuidv4(), 'CREATED', systemUserId);
      await auditService.log('TRANSACTION', uuidv4(), 'PROCESS_COMPLETE', systemUserId);

      const historicalData = await dashboard.getHistoricalData(startDate, endDate);

      expect(historicalData).toBeDefined();
      expect(historicalData.period).toBeDefined();
      expect(historicalData.totalOperations).toBeGreaterThan(0);
      expect(historicalData.operationsByType).toBeDefined();
    });
  });
});

describe('Audit Module Integration', () => {
  let auditModule;

  beforeEach(() => {
    auditModule = new AuditModule();
  });

  afterEach(() => {
    if (auditModule) {
      const dashboard = auditModule.getOperationalDashboard();
      if (dashboard) {
        dashboard.stopRealTimeCollection();
      }
    }
  });

  test('should initialize all services', () => {
    expect(auditModule.getAuditService()).toBeDefined();
    expect(auditModule.getRegulatoryReporting()).toBeDefined();
    expect(auditModule.getOperationalDashboard()).toBeDefined();
  });

  test('should generate comprehensive audit report', async () => {
    const now = new Date();
    const reportingPeriod = {
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
      endDate: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    };

    // Add some audit data
    const auditService = auditModule.getAuditService();
    const systemUserId = uuidv4();
    await auditService.log('KYC', uuidv4(), 'KYC_COMPLETED', systemUserId);
    await auditService.log('AML', uuidv4(), 'TRANSACTION_SCREENED', systemUserId);
    await auditService.log('ACCOUNT', uuidv4(), 'CREATED', systemUserId);

    const adminUserId = uuidv4();
    const comprehensiveReport = await auditModule.generateComprehensiveAuditReport(reportingPeriod, adminUserId);

    expect(comprehensiveReport).toBeDefined();
    expect(comprehensiveReport.reports.kycCompliance).toBeDefined();
    expect(comprehensiveReport.reports.amlSuspiciousActivity).toBeDefined();
    expect(comprehensiveReport.reports.operationalMetrics).toBeDefined();
    expect(comprehensiveReport.dashboardSnapshot).toBeDefined();
    expect(comprehensiveReport.summary).toBeDefined();
  });

  test('should get real-time compliance status', async () => {
    const complianceStatus = await auditModule.getComplianceStatus();

    expect(complianceStatus).toBeDefined();
    expect(complianceStatus.timestamp).toBeDefined();
    expect(complianceStatus.systemHealth).toBeDefined();
    expect(complianceStatus.kpis).toBeDefined();
    expect(complianceStatus.complianceScore).toBeDefined();
    expect(complianceStatus.complianceScore).toBeGreaterThanOrEqual(0);
    expect(complianceStatus.complianceScore).toBeLessThanOrEqual(100);
  });

  test('should perform system health check', async () => {
    const healthCheck = await auditModule.performHealthCheck();

    expect(healthCheck).toBeDefined();
    expect(healthCheck.status).toBe('HEALTHY');
    expect(healthCheck.services).toBeDefined();
    expect(healthCheck.services.auditService).toBe('OPERATIONAL');
    expect(healthCheck.services.regulatoryReporting).toBe('OPERATIONAL');
    expect(healthCheck.services.operationalDashboard).toBe('OPERATIONAL');
  });

  test('should calculate compliance score based on violations', async () => {
    const auditService = auditModule.getAuditService();
    const regulatoryReporting = auditModule.getRegulatoryReporting();

    // Create some violations
    await regulatoryReporting.detectComplianceViolation({
      entityType: 'TRANSACTION',
      afterState: { amount: 15000, amlFlags: [] }
    });

    const complianceStatus = await auditModule.getComplianceStatus();

    expect(complianceStatus.complianceScore).toBeLessThan(100);
    expect(complianceStatus.highSeverityViolations).toBeGreaterThan(0);
  });
});