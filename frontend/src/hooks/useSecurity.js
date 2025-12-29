/**
 * Security Management Hook
 * Provides state management and operations for security-related functionality
 */

import { useState, useEffect, useCallback } from 'react';
import securityApi from '@/lib/api/security';
import useAuthStore from '@/lib/auth/auth-store';

export const useSecurity = () => {
  const { hasPermission } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has security management permissions
  const canManageSecurity = hasPermission('security_management');
  const canViewAuditLogs = hasPermission('audit_logs');
  const canManageUsers = hasPermission('user_management');

  const handleApiCall = useCallback(async (apiCall, successMessage = null) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      if (successMessage) {
        // You could integrate with a toast notification system here
        console.log(successMessage);
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    
    // Permissions
    canManageSecurity,
    canViewAuditLogs,
    canManageUsers,
    
    // Security Dashboard
    getSecurityMetrics: useCallback((timeRange) => 
      handleApiCall(() => securityApi.getSecurityMetrics(timeRange))
    , [handleApiCall]),
    
    getSecurityAlerts: useCallback(() => 
      handleApiCall(() => securityApi.getSecurityAlerts())
    , [handleApiCall]),
    
    runSecurityScan: useCallback(() => 
      handleApiCall(() => securityApi.runSecurityScan(), 'Security scan initiated')
    , [handleApiCall]),
    
    generateSecurityReport: useCallback((options) => 
      handleApiCall(() => securityApi.generateSecurityReport(options), 'Security report generated')
    , [handleApiCall]),
    
    // Session Management
    getSessions: useCallback(() => 
      handleApiCall(() => securityApi.getSessions())
    , [handleApiCall]),
    
    terminateSession: useCallback((sessionId) => 
      handleApiCall(() => securityApi.terminateSession(sessionId), 'Session terminated')
    , [handleApiCall]),
    
    terminateUserSessions: useCallback((userId) => 
      handleApiCall(() => securityApi.terminateUserSessions(userId), 'All user sessions terminated')
    , [handleApiCall]),
    
    // Access Control
    getRoles: useCallback(() => 
      handleApiCall(() => securityApi.getRoles())
    , [handleApiCall]),
    
    getPermissions: useCallback(() => 
      handleApiCall(() => securityApi.getPermissions())
    , [handleApiCall]),
    
    createRole: useCallback((roleData) => 
      handleApiCall(() => securityApi.createRole(roleData), 'Role created successfully')
    , [handleApiCall]),
    
    updateRolePermissions: useCallback((roleId, permissions) => 
      handleApiCall(() => securityApi.updateRolePermissions(roleId, permissions), 'Permissions updated')
    , [handleApiCall]),
    
    deleteRole: useCallback((roleId) => 
      handleApiCall(() => securityApi.deleteRole(roleId), 'Role deleted successfully')
    , [handleApiCall]),
    
    // Security Monitoring
    getSecurityEvents: useCallback((timeRange, eventType) => 
      handleApiCall(() => securityApi.getSecurityEvents(timeRange, eventType))
    , [handleApiCall]),
    
    getThreatAlerts: useCallback(() => 
      handleApiCall(() => securityApi.getThreatAlerts())
    , [handleApiCall]),
    
    acknowledgeAlert: useCallback((alertId) => 
      handleApiCall(() => securityApi.acknowledgeAlert(alertId), 'Alert acknowledged')
    , [handleApiCall]),
    
    resolveAlert: useCallback((alertId) => 
      handleApiCall(() => securityApi.resolveAlert(alertId), 'Alert resolved')
    , [handleApiCall]),
    
    blockIpAddress: useCallback((ipAddress, reason) => 
      handleApiCall(() => securityApi.blockIpAddress(ipAddress, reason), 'IP address blocked')
    , [handleApiCall]),
    
    unblockIpAddress: useCallback((ipAddress) => 
      handleApiCall(() => securityApi.unblockIpAddress(ipAddress), 'IP address unblocked')
    , [handleApiCall]),
    
    // Utility functions
    clearError: useCallback(() => setError(null), []),
  };
};

/**
 * Hook for real-time security monitoring
 * Provides auto-refresh functionality for security data
 */
export const useSecurityMonitoring = (refreshInterval = 30000) => {
  const [securityData, setSecurityData] = useState({
    metrics: null,
    events: [],
    alerts: [],
    lastUpdated: null,
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const security = useSecurity();

  const refreshSecurityData = useCallback(async () => {
    if (!security.canManageSecurity) return;

    try {
      const [metrics, events, alerts] = await Promise.all([
        security.getSecurityMetrics('24h'),
        security.getSecurityEvents('24h', 'all'),
        security.getThreatAlerts(),
      ]);

      setSecurityData({
        metrics: metrics.data,
        events: events.data || [],
        alerts: alerts.data || [],
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to refresh security data:', error);
    }
  }, [security]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    refreshSecurityData();
  }, [refreshSecurityData]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    let interval;
    
    if (isMonitoring && refreshInterval > 0) {
      interval = setInterval(refreshSecurityData, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, refreshInterval, refreshSecurityData]);

  return {
    ...securityData,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshSecurityData,
    ...security,
  };
};

export default useSecurity;