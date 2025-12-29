/**
 * Export Service
 * Handles export functionality including scheduled exports and email delivery
 * Requirements: 6.4 - Multi-format export functionality
 */

import { apiClient } from '../api/client';
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF, 
  exportChartToPDF,
  generateReportData,
  formatReportMetadata,
  validateExportData,
} from '../utils/export';

/**
 * @typedef {Object} ExportRequest
 * @property {'pdf'|'csv'|'excel'|'json'} format - Export format
 * @property {string} reportType - Type of report
 * @property {Object} filters - Report filters
 * @property {Object} [options] - Export options
 * @property {string} [filename] - Custom filename
 * @property {boolean} [includeCharts] - Include charts in export
 * @property {string} [templateId] - Template to use for export
 */

/**
 * @typedef {Object} ScheduledExport
 * @property {string} id - Schedule ID
 * @property {string} name - Schedule name
 * @property {'daily'|'weekly'|'monthly'} frequency - Export frequency
 * @property {string} time - Time to run export (HH:MM format)
 * @property {string[]} recipients - Email recipients
 * @property {ExportRequest} exportConfig - Export configuration
 * @property {boolean} enabled - Whether schedule is active
 * @property {Date} nextRun - Next scheduled run time
 * @property {Date} lastRun - Last run time
 */

class ExportService {
  constructor() {
    this.baseUrl = '/api/analytics/export';
  }

  /**
   * Export data immediately
   * @param {ExportRequest} request - Export request
   * @returns {Promise<Blob|string>} Export result
   */
  async exportData(request) {
    try {
      // Validate request
      this.validateExportRequest(request);

      // Fetch data for export
      const data = await this.fetchExportData(request.reportType, request.filters);
      
      // Validate data
      validateExportData(data, request.format);

      // Process data based on report type
      const processedData = generateReportData(request.reportType, request.filters, data);

      // Generate metadata
      const metadata = formatReportMetadata(request.filters, request.reportType);

      // Apply template if specified
      let exportData = processedData;
      if (request.templateId) {
        const template = await this.getTemplate(request.templateId);
        exportData = this.applyTemplate(processedData, template);
      }

      // Generate filename
      const filename = request.filename || this.generateFilename(request.reportType, request.format);

      // Export based on format
      switch (request.format) {
        case 'csv':
          return this.exportToCSV(exportData, filename, request.options);
        case 'excel':
          return this.exportToExcel(exportData, filename, request.options);
        case 'pdf':
          return this.exportToPDF(exportData, filename, { 
            ...request.options, 
            metadata,
            includeCharts: request.includeCharts, 
          });
        case 'json':
          return this.exportToJSON(exportData, filename, { metadata });
        default:
          throw new Error(`Unsupported export format: ${request.format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Export data via API (server-side generation)
   * @param {ExportRequest} request - Export request
   * @returns {Promise<Object>} Export response with download URL
   */
  async exportViaAPI(request) {
    try {
      const response = await apiClient.request(`${this.baseUrl}/generate`, {
        method: 'POST',
        body: request,
      });

      return response.data;
    } catch (error) {
      console.error('API export failed:', error);
      throw error;
    }
  }

  /**
   * Schedule recurring export
   * @param {ScheduledExport} schedule - Schedule configuration
   * @returns {Promise<Object>} Created schedule
   */
  async scheduleExport(schedule) {
    try {
      const response = await apiClient.request(`${this.baseUrl}/schedule`, {
        method: 'POST',
        body: schedule,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to schedule export:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled exports
   * @returns {Promise<ScheduledExport[]>} List of scheduled exports
   */
  async getScheduledExports() {
    try {
      const response = await apiClient.request(`${this.baseUrl}/schedule`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch scheduled exports:', error);
      return [];
    }
  }

  /**
   * Update scheduled export
   * @param {string} scheduleId - Schedule ID
   * @param {Partial<ScheduledExport>} updates - Updates to apply
   * @returns {Promise<Object>} Updated schedule
   */
  async updateScheduledExport(scheduleId, updates) {
    try {
      const response = await apiClient.request(`${this.baseUrl}/schedule/${scheduleId}`, {
        method: 'PUT',
        body: updates,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to update scheduled export:', error);
      throw error;
    }
  }

  /**
   * Delete scheduled export
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<void>}
   */
  async deleteScheduledExport(scheduleId) {
    try {
      await apiClient.request(`${this.baseUrl}/schedule/${scheduleId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete scheduled export:', error);
      throw error;
    }
  }

  /**
   * Send export via email
   * @param {ExportRequest} request - Export request
   * @param {string[]} recipients - Email recipients
   * @param {Object} [emailOptions] - Email options
   * @returns {Promise<Object>} Email send result
   */
  async emailExport(request, recipients, emailOptions = {}) {
    try {
      const response = await apiClient.request(`${this.baseUrl}/email`, {
        method: 'POST',
        body: {
          exportRequest: request,
          recipients,
          subject: emailOptions.subject || `${request.reportType} Report - ${new Date().toLocaleDateString()}`,
          message: emailOptions.message || 'Please find the requested report attached.',
          ...emailOptions,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to email export:', error);
      throw error;
    }
  }

  /**
   * Get export templates
   * @returns {Promise<Object[]>} List of templates
   */
  async getTemplates() {
    try {
      const response = await apiClient.request(`${this.baseUrl}/templates`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      return [];
    }
  }

  /**
   * Get specific template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template data
   */
  async getTemplate(templateId) {
    try {
      const response = await apiClient.request(`${this.baseUrl}/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch template:', error);
      throw error;
    }
  }

  /**
   * Create export template
   * @param {Object} template - Template data
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(template) {
    try {
      const response = await apiClient.request(`${this.baseUrl}/templates`, {
        method: 'POST',
        body: template,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Update export template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Template updates
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(templateId, updates) {
    try {
      const response = await apiClient.request(`${this.baseUrl}/templates/${templateId}`, {
        method: 'PUT',
        body: updates,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Delete export template
   * @param {string} templateId - Template ID
   * @returns {Promise<void>}
   */
  async deleteTemplate(templateId) {
    try {
      await apiClient.request(`${this.baseUrl}/templates/${templateId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Get export history
   * @param {Object} [filters] - History filters
   * @returns {Promise<Object[]>} Export history
   */
  async getExportHistory(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await apiClient.request(`${this.baseUrl}/history?${params}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch export history:', error);
      return [];
    }
  }

  /**
   * Download previous export
   * @param {string} exportId - Export ID
   * @returns {Promise<Blob>} Export file
   */
  async downloadExport(exportId) {
    try {
      const response = await fetch(`${apiClient.baseURL}${this.baseUrl}/download/${exportId}`, {
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download export:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate export request
   * @private
   * @param {ExportRequest} request - Request to validate
   */
  validateExportRequest(request) {
    if (!request.format) {
      throw new Error('Export format is required');
    }

    if (!['pdf', 'csv', 'excel', 'json'].includes(request.format)) {
      throw new Error(`Unsupported export format: ${request.format}`);
    }

    if (!request.reportType) {
      throw new Error('Report type is required');
    }
  }

  /**
   * Fetch data for export
   * @private
   * @param {string} reportType - Report type
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Array>} Report data
   */
  async fetchExportData(reportType, filters) {
    try {
      const response = await apiClient.request('/api/analytics/data', {
        method: 'POST',
        body: { reportType, filters },
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch export data:', error);
      throw error;
    }
  }

  /**
   * Apply template to data
   * @private
   * @param {Array} data - Raw data
   * @param {Object} template - Template configuration
   * @returns {Object} Formatted data
   */
  applyTemplate(data, template) {
    // Apply template sections and formatting
    const formattedData = {
      metadata: {
        templateName: template.name,
        generatedAt: new Date().toISOString(),
      },
    };

    // Process each section defined in template
    template.sections.forEach(sectionId => {
      switch (sectionId) {
        case 'kpis':
          formattedData.kpis = this.extractKPIs(data);
          break;
        case 'trends':
          formattedData.trends = this.extractTrends(data);
          break;
        case 'tables':
          formattedData.tables = { main: data };
          break;
        case 'processes':
          formattedData.processes = this.extractProcessData(data);
          break;
        case 'alerts':
          formattedData.alerts = this.extractAlerts(data);
          break;
        default:
          formattedData[sectionId] = data;
      }
    });

    return formattedData;
  }

  /**
   * Extract KPIs from data
   * @private
   * @param {Array} data - Raw data
   * @returns {Object} KPI data
   */
  extractKPIs(data) {
    // Calculate basic KPIs
    return {
      total_records: data.length,
      avg_processing_time: data.reduce((sum, item) => sum + (item.processingTime || 0), 0) / data.length,
      success_rate: (data.filter(item => item.status === 'completed').length / data.length) * 100,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Extract trend data
   * @private
   * @param {Array} data - Raw data
   * @returns {Object} Trend data
   */
  extractTrends(data) {
    // Group data by date and calculate trends
    const trends = {};
    data.forEach(item => {
      const date = new Date(item.date || item.createdAt).toDateString();
      if (!trends[date]) {
        trends[date] = { count: 0, total: 0 };
      }
      trends[date].count++;
      trends[date].total += item.value || 1;
    });

    return trends;
  }

  /**
   * Extract process data
   * @private
   * @param {Array} data - Raw data
   * @returns {Object} Process data
   */
  extractProcessData(data) {
    return data.filter(item => item.type === 'process' || item.processId);
  }

  /**
   * Extract alerts from data
   * @private
   * @param {Array} data - Raw data
   * @returns {Array} Alert data
   */
  extractAlerts(data) {
    return data.filter(item => item.type === 'alert' || item.severity);
  }

  /**
   * Generate filename
   * @private
   * @param {string} reportType - Report type
   * @param {string} format - Export format
   * @returns {string} Generated filename
   */
  generateFilename(reportType, format) {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'excel' ? 'xlsx' : format;
    return `${reportType}_report_${timestamp}.${extension}`;
  }

  /**
   * Export to CSV (client-side)
   * @private
   */
  async exportToCSV(data, filename, options) {
    return exportToCSV(data, filename, options);
  }

  /**
   * Export to Excel (client-side)
   * @private
   */
  async exportToExcel(data, filename, options) {
    return exportToExcel(data, filename, options);
  }

  /**
   * Export to PDF (client-side)
   * @private
   */
  async exportToPDF(data, filename, options) {
    return exportToPDF(data, filename, options);
  }

  /**
   * Export to JSON (client-side)
   * @private
   */
  async exportToJSON(data, filename, options) {
    const jsonData = {
      ...options.metadata,
      data,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json;charset=utf-8;', 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    return blob;
  }
}

// Export singleton instance
export const exportService = new ExportService();
export default exportService;