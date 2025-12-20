// Audit and Compliance Module
// Comprehensive audit logging, regulatory reporting, and compliance monitoring

const AuditService = require('../../services/audit-service');
const { RegulatoryReportingModule } = require('../../services/regulatory-reporting');
const { OperationalDashboard } = require('../../services/operational-dashboard');

/**
 * AuditModule - Main audit and compliance orchestrator
 */
class AuditModule {
  constructor() {
    // Initialize core services
    this.auditService = new AuditService();
    this.regulatoryReporting = new RegulatoryReportingModule(this.auditService);
    this.operationalDashboard = new OperationalDashboard(this.auditService, this.regulatoryReporting, false);
    
    // Set up compliance monitoring
    this.setupComplianceMonitoring();
  }

  /**
   * Set up real-time compliance monitoring
   */
  setupComplianceMonitoring() {
    // Subscribe to audit events for compliance violation detection
    this.auditService.onAuditEvent = async (auditLog) => {
      try {
        await this.regulatoryReporting.detectComplianceViolation(auditLog);
      } catch (error) {
        console.error('Compliance violation detection failed:', error);
      }
    };
  }

  /**
   * Get audit service instance
   * @returns {AuditService} Audit service
   */
  getAuditService() {
    return this.auditService;
  }

  /**
   * Get regulatory reporting module
   * @returns {RegulatoryReportingModule} Regulatory reporting module
   */
  getRegulatoryReporting() {
    return this.regulatoryReporting;
  }

  /**
   * Get operational dashboard
   * @returns {OperationalDashboard} Operational dashboard
   */
  getOperationalDashboard() {
    return this.operationalDashboard;
  }

  /**
   * Generate comprehensive audit report
   * @param {Object} reportingPeriod - Start and end dates
   * @param {string} generatedBy - User generating the report
   * @returns {Object} Comprehensive audit report
   */
  async generateComprehensiveAuditReport(reportingPeriod, generatedBy) {
    try {
      // Generate all regulatory reports
      const kycReport = await this.regulatoryReporting.generateKYCComplianceReport(reportingPeriod, generatedBy);
      const amlReport = await this.regulatoryReporting.generateAMLSuspiciousActivityReport(reportingPeriod, generatedBy);
      const operationalReport = await this.regulatoryReporting.generateOperationalMetricsReport(reportingPeriod, generatedBy);

      // Get dashboard data for the period
      const dashboardData = await this.operationalDashboard.getDashboardData();

      // Get compliance violations for the period
      const complianceViolations = this.regulatoryReporting.getComplianceViolations({
        startDate: reportingPeriod.startDate,
        endDate: reportingPeriod.endDate
      });

      const comprehensiveReport = {
        reportId: require('uuid').v4(),
        generatedAt: new Date(),
        generatedBy: generatedBy,
        reportingPeriod: reportingPeriod,
        reports: {
          kycCompliance: kycReport,
          amlSuspiciousActivity: amlReport,
          operationalMetrics: operationalReport
        },
        dashboardSnapshot: dashboardData,
        complianceViolations: complianceViolations,
        summary: {
          totalReports: 3,
          totalViolations: complianceViolations.length,
          highSeverityViolations: complianceViolations.filter(v => v.severity === 'HIGH').length,
          systemHealthStatus: dashboardData.systemHealth?.systemStatus || 'UNKNOWN'
        }
      };

      // Log the comprehensive report generation
      await this.auditService.log(
        'COMPREHENSIVE_REPORT', 
        comprehensiveReport.reportId, 
        'GENERATED', 
        generatedBy, 
        null, 
        comprehensiveReport
      );

      return comprehensiveReport;
    } catch (error) {
      await this.auditService.log(
        'COMPREHENSIVE_REPORT', 
        'FAILED', 
        'GENERATION_ERROR', 
        generatedBy, 
        null, 
        { error: error.message }
      );
      throw error;
    }
  }

  /**
   * Subscribe to compliance alerts
   * @param {Object} subscriber - Alert subscriber
   */
  subscribeToComplianceAlerts(subscriber) {
    this.regulatoryReporting.subscribeToAlerts(subscriber);
  }

  /**
   * Subscribe to dashboard updates
   * @param {Object} subscriber - Dashboard subscriber
   */
  subscribeToDashboardUpdates(subscriber) {
    this.operationalDashboard.subscribe(subscriber);
  }

  /**
   * Get real-time compliance status
   * @returns {Object} Current compliance status
   */
  async getComplianceStatus() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const violations = this.regulatoryReporting.getComplianceViolations({
      startDate: last24Hours
    });

    const dashboardData = await this.operationalDashboard.getDashboardData();

    return {
      timestamp: now,
      violationsLast24Hours: violations.length,
      highSeverityViolations: violations.filter(v => v.severity === 'HIGH').length,
      systemHealth: dashboardData.systemHealth,
      kpis: dashboardData.kpis,
      activeAlerts: await this.operationalDashboard.getActiveAlerts(),
      complianceScore: this.calculateComplianceScore(violations, dashboardData)
    };
  }

  /**
   * Calculate overall compliance score
   * @param {Array} violations - Compliance violations
   * @param {Object} dashboardData - Dashboard data
   * @returns {number} Compliance score (0-100)
   */
  calculateComplianceScore(violations, dashboardData) {
    let score = 100;

    // Deduct points for violations
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'HIGH':
          score -= 10;
          break;
        case 'MEDIUM':
          score -= 5;
          break;
        case 'LOW':
          score -= 2;
          break;
      }
    });

    // Deduct points for system issues
    const errorRate = parseFloat(dashboardData.systemHealth?.errorRate || 0);
    if (errorRate > 5) {
      score -= 15;
    } else if (errorRate > 1) {
      score -= 5;
    }

    // Deduct points for transaction failures
    const failureRate = parseFloat(dashboardData.kpis?.transactionFailureRate || 0);
    if (failureRate > 5) {
      score -= 10;
    } else if (failureRate > 2) {
      score -= 5;
    }

    return Math.max(score, 0);
  }

  /**
   * Perform system health check
   * @returns {Object} System health status
   */
  async performHealthCheck() {
    try {
      const dashboardData = await this.operationalDashboard.getDashboardData();
      const auditStats = await this.auditService.getAuditStatistics();
      const complianceStatus = await this.getComplianceStatus();

      return {
        timestamp: new Date(),
        status: 'HEALTHY',
        services: {
          auditService: 'OPERATIONAL',
          regulatoryReporting: 'OPERATIONAL',
          operationalDashboard: 'OPERATIONAL'
        },
        metrics: {
          totalAuditLogs: auditStats.totalLogs,
          systemUptime: dashboardData.systemHealth?.systemUptime,
          complianceScore: complianceStatus.complianceScore,
          activeAlerts: complianceStatus.activeAlerts.length
        }
      };
    } catch (error) {
      return {
        timestamp: new Date(),
        status: 'UNHEALTHY',
        error: error.message,
        services: {
          auditService: 'ERROR',
          regulatoryReporting: 'ERROR',
          operationalDashboard: 'ERROR'
        }
      };
    }
  }
}

module.exports = {
  AuditModule,
  AuditService,
  RegulatoryReportingModule,
  OperationalDashboard
};