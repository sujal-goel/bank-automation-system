// Operational Dashboard Service
// Real-time performance metrics and system monitoring

const { v4: uuidv4 } = require('uuid');

/**
 * Dashboard Metric Types
 */
const MetricType = {
  COUNTER: 'COUNTER',
  GAUGE: 'GAUGE',
  HISTOGRAM: 'HISTOGRAM',
  TIMER: 'TIMER'
};

/**
 * Dashboard Metric
 */
class DashboardMetric {
  constructor(name, type, value, timestamp = new Date(), metadata = {}) {
    this.metricId = uuidv4();
    this.name = name;
    this.type = type;
    this.value = value;
    this.timestamp = timestamp;
    this.metadata = metadata;
  }
}

/**
 * OperationalDashboard - Real-time system monitoring and metrics
 */
class OperationalDashboard {
  constructor(auditService = null, regulatoryReporting = null, autoStart = true) {
    this.auditService = auditService;
    this.regulatoryReporting = regulatoryReporting;
    this.metrics = new Map();
    this.realTimeData = new Map();
    this.alertThresholds = new Map();
    this.dashboardSubscribers = new Set();
    this.dataCollectionInterval = null;
    
    // Initialize default alert thresholds
    this.initializeDefaultThresholds();
    
    // Start real-time data collection only if not in test environment
    if (autoStart && process.env.NODE_ENV !== 'test') {
      this.startRealTimeCollection();
    }
  }

  /**
   * Initialize default alert thresholds
   */
  initializeDefaultThresholds() {
    this.alertThresholds.set('transaction_failure_rate', { max: 5.0 }); // 5% max failure rate
    this.alertThresholds.set('system_response_time', { max: 5000 }); // 5 seconds max response time
    this.alertThresholds.set('compliance_violation_count', { max: 10 }); // 10 violations per hour
    this.alertThresholds.set('fraud_detection_rate', { min: 0.1, max: 10.0 }); // 0.1% - 10% fraud rate
    this.alertThresholds.set('kyc_completion_rate', { min: 95.0 }); // 95% minimum completion rate
  }

  /**
   * Get real-time dashboard data
   * @returns {Object} Current dashboard metrics and data
   */
  async getDashboardData() {
    try {
      const currentTime = new Date();
      const last24Hours = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(currentTime.getTime() - 60 * 60 * 1000);

      // Get audit statistics
      const auditStats = this.auditService ? await this.auditService.getAuditStatistics() : {};
      
      // Get recent audit logs for analysis
      const recentLogs = this.auditService ? await this.auditService.queryAuditLogs({
        startDate: last24Hours
      }) : [];

      // Calculate key performance indicators
      const kpis = await this.calculateKPIs(recentLogs, lastHour);
      
      // Get compliance violations
      const complianceViolations = this.regulatoryReporting ? 
        this.regulatoryReporting.getComplianceViolations({ startDate: last24Hours }) : [];

      // Get system health metrics
      const systemHealth = await this.getSystemHealthMetrics(recentLogs);

      // Get transaction metrics
      const transactionMetrics = await this.getTransactionMetrics(recentLogs);

      // Get operational metrics
      const operationalMetrics = await this.getOperationalMetrics(recentLogs);

      const dashboardData = {
        timestamp: currentTime,
        kpis: kpis,
        systemHealth: systemHealth,
        transactionMetrics: transactionMetrics,
        operationalMetrics: operationalMetrics,
        complianceStatus: {
          violationsLast24Hours: complianceViolations.length,
          violationsLastHour: complianceViolations.filter(v => v.detectedAt >= lastHour).length,
          highSeverityViolations: complianceViolations.filter(v => v.severity === 'HIGH').length,
          recentViolations: complianceViolations.slice(0, 10)
        },
        auditStatistics: auditStats,
        alerts: await this.getActiveAlerts()
      };

      // Store current data for real-time updates
      this.realTimeData.set('current', dashboardData);

      // Notify subscribers of data update
      this.notifySubscribers(dashboardData);

      return dashboardData;
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Calculate Key Performance Indicators
   * @param {Array} recentLogs - Recent audit logs
   * @param {Date} lastHour - Last hour timestamp
   * @returns {Object} KPI metrics
   */
  async calculateKPIs(recentLogs, lastHour) {
    const hourlyLogs = recentLogs.filter(log => log.timestamp >= lastHour);
    
    // Account opening metrics
    const accountOpenings = recentLogs.filter(log => 
      log.entityType === 'ACCOUNT' && log.action === 'CREATED'
    );
    
    // Transaction metrics
    const transactions = recentLogs.filter(log => 
      log.entityType === 'TRANSACTION'
    );
    const completedTransactions = transactions.filter(log => 
      log.action === 'PROCESS_COMPLETE'
    );
    const failedTransactions = transactions.filter(log => 
      log.action === 'PROCESS_ERROR' || log.action === 'VALIDATION_FAILED'
    );

    // Loan processing metrics
    const loanApplications = recentLogs.filter(log => 
      log.entityType === 'LOAN' && log.action === 'SUBMITTED'
    );
    const approvedLoans = recentLogs.filter(log => 
      log.entityType === 'LOAN' && log.action === 'APPROVED'
    );

    // KYC metrics
    const kycProcesses = recentLogs.filter(log => 
      log.entityType === 'KYC'
    );
    const completedKYC = kycProcesses.filter(log => 
      log.action === 'KYC_COMPLETED'
    );

    return {
      accountOpeningsLast24Hours: accountOpenings.length,
      accountOpeningsLastHour: accountOpenings.filter(log => log.timestamp >= lastHour).length,
      transactionSuccessRate: transactions.length > 0 ? 
        ((completedTransactions.length / transactions.length) * 100).toFixed(2) : 0,
      transactionFailureRate: transactions.length > 0 ? 
        ((failedTransactions.length / transactions.length) * 100).toFixed(2) : 0,
      loanApprovalRate: loanApplications.length > 0 ? 
        ((approvedLoans.length / loanApplications.length) * 100).toFixed(2) : 0,
      kycCompletionRate: kycProcesses.length > 0 ? 
        ((completedKYC.length / kycProcesses.length) * 100).toFixed(2) : 0,
      totalSystemActions: recentLogs.length,
      actionsLastHour: hourlyLogs.length
    };
  }

  /**
   * Get system health metrics
   * @param {Array} recentLogs - Recent audit logs
   * @returns {Object} System health metrics
   */
  async getSystemHealthMetrics(recentLogs) {
    const errorLogs = recentLogs.filter(log => 
      log.action.includes('ERROR') || log.action.includes('FAILED')
    );

    const systemErrors = errorLogs.length;
    const totalOperations = recentLogs.length;
    const errorRate = totalOperations > 0 ? (systemErrors / totalOperations) * 100 : 0;

    // Calculate average response time (simulated)
    const avgResponseTime = this.calculateAverageResponseTime(recentLogs);

    // System uptime calculation
    const uptime = totalOperations > 0 ? ((totalOperations - systemErrors) / totalOperations) * 100 : 100;

    return {
      systemUptime: Math.max(uptime, 95).toFixed(2), // Minimum 95% assumption
      errorRate: errorRate.toFixed(2),
      totalErrors: systemErrors,
      averageResponseTime: avgResponseTime,
      systemStatus: errorRate < 1 ? 'HEALTHY' : errorRate < 5 ? 'WARNING' : 'CRITICAL'
    };
  }

  /**
   * Get transaction metrics
   * @param {Array} recentLogs - Recent audit logs
   * @returns {Object} Transaction metrics
   */
  async getTransactionMetrics(recentLogs) {
    const transactionLogs = recentLogs.filter(log => log.entityType === 'TRANSACTION');
    
    const processed = transactionLogs.filter(log => log.action === 'PROCESS_COMPLETE').length;
    const failed = transactionLogs.filter(log => log.action === 'PROCESS_ERROR').length;
    const pending = transactionLogs.filter(log => log.action === 'PROCESS_START').length - processed - failed;

    // Calculate transaction volume (simulated amounts)
    const totalVolume = processed * 1500 + failed * 800; // Average transaction amounts

    return {
      transactionsProcessed: processed,
      transactionsFailed: failed,
      transactionsPending: Math.max(pending, 0),
      totalTransactionVolume: totalVolume,
      averageTransactionAmount: processed > 0 ? (totalVolume / processed).toFixed(2) : 0,
      peakTransactionTime: this.calculatePeakTransactionTime(transactionLogs)
    };
  }

  /**
   * Get operational metrics
   * @param {Array} recentLogs - Recent audit logs
   * @returns {Object} Operational metrics
   */
  async getOperationalMetrics(recentLogs) {
    const moduleActivity = {};
    
    // Count activity by module/entity type
    recentLogs.forEach(log => {
      if (!moduleActivity[log.entityType]) {
        moduleActivity[log.entityType] = 0;
      }
      moduleActivity[log.entityType]++;
    });

    // Calculate processing efficiency
    const totalProcessingActions = recentLogs.filter(log => 
      log.action.includes('PROCESS') || log.action.includes('COMPLETE')
    ).length;

    const totalStartActions = recentLogs.filter(log => 
      log.action.includes('START') || log.action.includes('SUBMIT')
    ).length;

    const processingEfficiency = totalStartActions > 0 ? 
      (totalProcessingActions / totalStartActions) * 100 : 100;

    return {
      moduleActivity: moduleActivity,
      processingEfficiency: processingEfficiency.toFixed(2),
      totalOperations: recentLogs.length,
      uniqueUsers: new Set(recentLogs.map(log => log.performedBy)).size,
      systemLoad: this.calculateSystemLoad(recentLogs)
    };
  }

  /**
   * Get active alerts based on thresholds
   * @returns {Array} Active alerts
   */
  async getActiveAlerts() {
    const alerts = [];
    const currentData = this.realTimeData.get('current');

    if (!currentData) return alerts;

    // Check transaction failure rate
    const failureRate = parseFloat(currentData.kpis?.transactionFailureRate || 0);
    const failureThreshold = this.alertThresholds.get('transaction_failure_rate');
    if (failureRate > failureThreshold.max) {
      alerts.push({
        alertId: uuidv4(),
        type: 'THRESHOLD_EXCEEDED',
        severity: 'HIGH',
        metric: 'transaction_failure_rate',
        currentValue: failureRate,
        threshold: failureThreshold.max,
        message: `Transaction failure rate (${failureRate}%) exceeds threshold (${failureThreshold.max}%)`,
        timestamp: new Date()
      });
    }

    // Check KYC completion rate
    const kycRate = parseFloat(currentData.kpis?.kycCompletionRate || 100);
    const kycThreshold = this.alertThresholds.get('kyc_completion_rate');
    if (kycRate < kycThreshold.min) {
      alerts.push({
        alertId: uuidv4(),
        type: 'THRESHOLD_BELOW',
        severity: 'MEDIUM',
        metric: 'kyc_completion_rate',
        currentValue: kycRate,
        threshold: kycThreshold.min,
        message: `KYC completion rate (${kycRate}%) below threshold (${kycThreshold.min}%)`,
        timestamp: new Date()
      });
    }

    // Check compliance violations
    const violationCount = currentData.complianceStatus?.violationsLastHour || 0;
    const violationThreshold = this.alertThresholds.get('compliance_violation_count');
    if (violationCount > violationThreshold.max) {
      alerts.push({
        alertId: uuidv4(),
        type: 'COMPLIANCE_ALERT',
        severity: 'CRITICAL',
        metric: 'compliance_violation_count',
        currentValue: violationCount,
        threshold: violationThreshold.max,
        message: `Compliance violations (${violationCount}) exceed hourly threshold (${violationThreshold.max})`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Subscribe to real-time dashboard updates
   * @param {Object} subscriber - Subscriber with update method
   */
  subscribe(subscriber) {
    this.dashboardSubscribers.add(subscriber);
  }

  /**
   * Unsubscribe from dashboard updates
   * @param {Object} subscriber - Subscriber to remove
   */
  unsubscribe(subscriber) {
    this.dashboardSubscribers.delete(subscriber);
  }

  /**
   * Notify all subscribers of data updates
   * @param {Object} data - Updated dashboard data
   */
  notifySubscribers(data) {
    for (const subscriber of this.dashboardSubscribers) {
      try {
        if (subscriber.update) {
          subscriber.update(data);
        }
      } catch (error) {
        console.error('Failed to notify dashboard subscriber:', error);
      }
    }
  }

  /**
   * Start real-time data collection
   */
  startRealTimeCollection() {
    // Update dashboard data every 30 seconds
    this.dataCollectionInterval = setInterval(async () => {
      try {
        await this.getDashboardData();
      } catch (error) {
        console.error('Real-time data collection error:', error);
      }
    }, 30000);
  }

  /**
   * Stop real-time data collection
   */
  stopRealTimeCollection() {
    if (this.dataCollectionInterval) {
      clearInterval(this.dataCollectionInterval);
      this.dataCollectionInterval = null;
    }
  }

  /**
   * Calculate average response time (simulated)
   * @param {Array} logs - Audit logs
   * @returns {number} Average response time in milliseconds
   */
  calculateAverageResponseTime(logs) {
    // Simulated response time calculation
    const processingLogs = logs.filter(log => 
      log.action.includes('PROCESS') || log.action.includes('COMPLETE')
    );
    
    // Simulate response times based on operation complexity
    let totalResponseTime = 0;
    processingLogs.forEach(log => {
      if (log.entityType === 'TRANSACTION') {
        totalResponseTime += 150; // 150ms average for transactions
      } else if (log.entityType === 'LOAN') {
        totalResponseTime += 2000; // 2s average for loan processing
      } else if (log.entityType === 'KYC') {
        totalResponseTime += 5000; // 5s average for KYC
      } else {
        totalResponseTime += 500; // 500ms default
      }
    });

    return processingLogs.length > 0 ? 
      Math.round(totalResponseTime / processingLogs.length) : 200;
  }

  /**
   * Calculate peak transaction time
   * @param {Array} transactionLogs - Transaction audit logs
   * @returns {string} Peak transaction time
   */
  calculatePeakTransactionTime(transactionLogs) {
    if (transactionLogs.length === 0) return 'N/A';

    // Group transactions by hour
    const hourlyActivity = {};
    transactionLogs.forEach(log => {
      const hour = log.timestamp.getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    // Find peak hour
    const peakHour = Object.keys(hourlyActivity).reduce((a, b) => 
      hourlyActivity[a] > hourlyActivity[b] ? a : b
    );

    return `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`;
  }

  /**
   * Calculate system load (simulated)
   * @param {Array} logs - Audit logs
   * @returns {string} System load percentage
   */
  calculateSystemLoad(logs) {
    const recentActivity = logs.filter(log => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return log.timestamp >= fiveMinutesAgo;
    }).length;

    // Simulate load based on recent activity
    const load = Math.min((recentActivity / 100) * 100, 100);
    return load.toFixed(1) + '%';
  }

  /**
   * Update alert threshold
   * @param {string} metric - Metric name
   * @param {Object} threshold - New threshold values
   */
  updateAlertThreshold(metric, threshold) {
    this.alertThresholds.set(metric, threshold);
  }

  /**
   * Get historical dashboard data
   * @param {Date} startDate - Start date for historical data
   * @param {Date} endDate - End date for historical data
   * @returns {Object} Historical dashboard data
   */
  async getHistoricalData(startDate, endDate) {
    if (!this.auditService) {
      throw new Error('Audit service not available for historical data');
    }

    const historicalLogs = await this.auditService.queryAuditLogs({
      startDate: startDate,
      endDate: endDate
    });

    return {
      period: { startDate, endDate },
      totalOperations: historicalLogs.length,
      operationsByType: this.groupLogsByType(historicalLogs),
      operationsByDay: this.groupLogsByDay(historicalLogs, startDate, endDate),
      errorAnalysis: this.analyzeErrors(historicalLogs)
    };
  }

  /**
   * Group logs by entity type
   * @param {Array} logs - Audit logs
   * @returns {Object} Logs grouped by type
   */
  groupLogsByType(logs) {
    const grouped = {};
    logs.forEach(log => {
      grouped[log.entityType] = (grouped[log.entityType] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group logs by day
   * @param {Array} logs - Audit logs
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Logs grouped by day
   */
  groupLogsByDay(logs, startDate, endDate) {
    const dailyData = {};
    
    // Initialize all days in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count logs by day
    logs.forEach(log => {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      if (dailyData.hasOwnProperty(dateKey)) {
        dailyData[dateKey]++;
      }
    });

    return dailyData;
  }

  /**
   * Analyze errors in logs
   * @param {Array} logs - Audit logs
   * @returns {Object} Error analysis
   */
  analyzeErrors(logs) {
    const errorLogs = logs.filter(log => 
      log.action.includes('ERROR') || log.action.includes('FAILED')
    );

    const errorsByType = {};
    errorLogs.forEach(log => {
      const errorType = log.action;
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return {
      totalErrors: errorLogs.length,
      errorRate: logs.length > 0 ? ((errorLogs.length / logs.length) * 100).toFixed(2) : 0,
      errorsByType: errorsByType,
      mostCommonError: Object.keys(errorsByType).reduce((a, b) => 
        errorsByType[a] > errorsByType[b] ? a : b, 'None'
      )
    };
  }
}

module.exports = {
  OperationalDashboard,
  DashboardMetric,
  MetricType
};