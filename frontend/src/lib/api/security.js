/**
 * Security API Client
 * Handles all security-related API calls including session management,
 * access control, and security monitoring
 */

import apiClient from './client';

/**
 * Security API endpoints
 */
export const securityApi = {
  // Security Dashboard
  getSecurityMetrics: async (timeRange = '24h') => {
    return apiClient.get(`/api/admin/security/metrics?timeRange=${timeRange}`);
  },

  getSecurityAlerts: async () => {
    return apiClient.get('/api/admin/security/alerts');
  },

  runSecurityScan: async () => {
    return apiClient.post('/api/admin/security/scan');
  },

  generateSecurityReport: async (options = {}) => {
    return apiClient.post('/api/admin/security/report', options);
  },

  // Session Management
  getSessions: async () => {
    return apiClient.get('/api/admin/sessions');
  },

  getSessionDetails: async (sessionId) => {
    return apiClient.get(`/api/admin/sessions/${sessionId}`);
  },

  terminateSession: async (sessionId) => {
    return apiClient.delete(`/api/admin/sessions/${sessionId}`);
  },

  terminateUserSessions: async (userId) => {
    return apiClient.delete(`/api/admin/sessions/user/${userId}`);
  },

  terminateAllSessions: async () => {
    return apiClient.delete('/api/admin/sessions/all');
  },

  // Access Control
  getRoles: async () => {
    return apiClient.get('/api/admin/roles');
  },

  getPermissions: async () => {
    return apiClient.get('/api/admin/permissions');
  },

  createRole: async (roleData) => {
    return apiClient.post('/api/admin/roles', roleData);
  },

  updateRole: async (roleId, roleData) => {
    return apiClient.put(`/api/admin/roles/${roleId}`, roleData);
  },

  deleteRole: async (roleId) => {
    return apiClient.delete(`/api/admin/roles/${roleId}`);
  },

  updateRolePermissions: async (roleId, permissions) => {
    return apiClient.put(`/api/admin/roles/${roleId}/permissions`, { permissions });
  },

  assignUserRole: async (userId, roleId) => {
    return apiClient.put(`/api/admin/users/${userId}/role`, { roleId });
  },

  // Security Monitoring
  getSecurityEvents: async (timeRange = '24h', eventType = 'all') => {
    return apiClient.get(`/api/admin/security/events?timeRange=${timeRange}&type=${eventType}`);
  },

  getThreatAlerts: async () => {
    return apiClient.get('/api/admin/security/threats');
  },

  acknowledgeAlert: async (alertId) => {
    return apiClient.patch(`/api/admin/security/threats/${alertId}`, {
      status: 'acknowledged',
    });
  },

  resolveAlert: async (alertId) => {
    return apiClient.patch(`/api/admin/security/threats/${alertId}`, {
      status: 'resolved',
    });
  },

  blockIpAddress: async (ipAddress, reason) => {
    return apiClient.post('/api/admin/security/block-ip', {
      ipAddress,
      reason,
    });
  },

  unblockIpAddress: async (ipAddress) => {
    return apiClient.delete(`/api/admin/security/block-ip/${ipAddress}`);
  },

  getBlockedIps: async () => {
    return apiClient.get('/api/admin/security/blocked-ips');
  },

  // Security Configuration
  getSecurityConfig: async () => {
    return apiClient.get('/api/admin/security/config');
  },

  updateSecurityConfig: async (config) => {
    return apiClient.put('/api/admin/security/config', config);
  },

  // Audit Logs
  getAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiClient.get(`/api/admin/audit/logs?${params}`);
  },

  exportAuditLogs: async (filters = {}, format = 'csv') => {
    const params = new URLSearchParams({ ...filters, format }).toString();
    return apiClient.get(`/api/admin/audit/export?${params}`);
  },
};

export default securityApi;