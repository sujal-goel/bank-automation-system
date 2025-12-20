// Audit Service
// Comprehensive audit logging and trail management

const { AuditLog } = require('../shared/interfaces');

/**
 * AuditService - Comprehensive audit logging system
 * Provides detailed action logging and audit trail generation
 */
class AuditService {
  constructor() {
    this.auditLogs = new Map(); // In production, this would be a database
    this.logRetentionDays = 2555; // 7 years for regulatory compliance
  }

  /**
   * Log an audit event
   * @param {string} entityType - Type of entity being audited
   * @param {string} entityId - ID of the entity
   * @param {string} action - Action being performed
   * @param {string} performedBy - User/system performing the action
   * @param {Object} beforeState - State before the action
   * @param {Object} afterState - State after the action
   * @param {Object} metadata - Additional metadata
   * @returns {AuditLog} The created audit log entry
   */
  async log(entityType, entityId, action, performedBy, beforeState = null, afterState = null, metadata = {}) {
    try {
      const auditLog = new AuditLog(
        entityType,
        entityId,
        action,
        performedBy,
        beforeState,
        afterState,
        metadata
      );

      this.auditLogs.set(auditLog.logId, auditLog);
      
      // In production, this would also write to persistent storage
      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Retrieve audit logs by entity
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   * @returns {AuditLog[]} Array of audit logs
   */
  async getAuditTrail(entityType, entityId) {
    const logs = Array.from(this.auditLogs.values())
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return logs;
  }

  /**
   * Query audit logs with filters
   * @param {Object} filters - Query filters
   * @returns {AuditLog[]} Filtered audit logs
   */
  async queryAuditLogs(filters = {}) {
    let logs = Array.from(this.auditLogs.values());

    if (filters.entityType) {
      logs = logs.filter(log => log.entityType === filters.entityType);
    }

    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }

    if (filters.performedBy) {
      logs = logs.filter(log => log.performedBy === filters.performedBy);
    }

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate);
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get audit statistics
   * @returns {Object} Audit statistics
   */
  async getAuditStatistics() {
    const logs = Array.from(this.auditLogs.values());
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalLogs: logs.length,
      logsLast24Hours: logs.filter(log => log.timestamp >= last24Hours).length,
      logsLast7Days: logs.filter(log => log.timestamp >= last7Days).length,
      entityTypes: [...new Set(logs.map(log => log.entityType))],
      actions: [...new Set(logs.map(log => log.action))],
      users: [...new Set(logs.map(log => log.performedBy))]
    };
  }

  /**
   * Clean up old audit logs (for maintenance)
   * @returns {number} Number of logs cleaned up
   */
  async cleanupOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);

    const logsToDelete = Array.from(this.auditLogs.entries())
      .filter(([_, log]) => log.timestamp < cutoffDate);

    logsToDelete.forEach(([logId, _]) => {
      this.auditLogs.delete(logId);
    });

    return logsToDelete.length;
  }
}

module.exports = AuditService;