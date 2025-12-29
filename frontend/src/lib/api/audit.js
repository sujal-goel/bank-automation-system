/**
 * Audit API Client
 * Handles API calls related to audit logs
 */

import apiClient from './client';

/**
 * @typedef {Object} AuditLogFilters
 * @property {string} entityType - Filter by entity type
 * @property {string} action - Filter by action
 * @property {string} performedBy - Filter by user
 * @property {Object} dateRange - Date range filter
 * @property {string} dateRange.start - Start date
 * @property {string} dateRange.end - End date
 */

/**
 * Fetch audit logs with optional filtering and pagination
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Items per page
 * @param {string} [options.search] - Search term
 * @param {AuditLogFilters} [options.filters] - Filter criteria
 * @returns {Promise<Object>} API response with logs and metadata
 */
export async function getAuditLogs(options = {}) {
  const {
    page = 1,
    limit = 50,
    search = '',
    filters = {},
  } = options;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== '') {
        if (key === 'dateRange' && value.start && value.end) {
          acc.startDate = value.start;
          acc.endDate = value.end;
        } else if (key !== 'dateRange') {
          acc[key] = value;
        }
      }
      return acc;
    }, {}),
  });

  try {
    const response = await apiClient.get(`/api/audit/logs?${queryParams}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw error;
  }
}

/**
 * Get audit statistics
 * @returns {Promise<Object>} Audit statistics
 */
export async function getAuditStatistics() {
  try {
    const response = await apiClient.get('/api/audit/statistics');
    return response;
  } catch (error) {
    console.error('Failed to fetch audit statistics:', error);
    throw error;
  }
}

/**
 * Export audit logs
 * @param {Object} options - Export options
 * @param {string} options.format - Export format (csv, json, pdf)
 * @param {AuditLogFilters} [options.filters] - Filter criteria
 * @param {string} [options.search] - Search term
 * @returns {Promise<Blob>} Export file blob
 */
export async function exportAuditLogs(options = {}) {
  const {
    format = 'csv',
    filters = {},
    search = '',
  } = options;

  const queryParams = new URLSearchParams({
    format,
    ...(search && { search }),
    ...Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== '') {
        if (key === 'dateRange' && value.start && value.end) {
          acc.startDate = value.start;
          acc.endDate = value.end;
        } else if (key !== 'dateRange') {
          acc[key] = value;
        }
      }
      return acc;
    }, {}),
  });

  try {
    const response = await fetch(`/api/audit/export?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    throw error;
  }
}

/**
 * Get audit log details by ID
 * @param {string} logId - Audit log ID
 * @returns {Promise<Object>} Detailed audit log
 */
export async function getAuditLogDetails(logId) {
  try {
    const response = await apiClient.get(`/api/audit/logs/${logId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch audit log details:', error);
    throw error;
  }
}