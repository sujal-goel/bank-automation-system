/**
 * Reports API client for employee dashboard
 * Handles report generation, data fetching, and scheduled reports
 */

import { apiClient } from './client';

/**
 * @typedef {Object} ReportFilters
 * @property {string} dateRange - Date range filter
 * @property {Date} [startDate] - Custom start date
 * @property {Date} [endDate] - Custom end date
 * @property {string} [department] - Department filter
 * @property {string} [employee] - Employee filter
 * @property {string} [status] - Status filter
 * @property {string} [applicationType] - Application type filter
 */

/**
 * @typedef {Object} ReportData
 * @property {Array} data - Report data array
 * @property {Object} summary - Report summary statistics
 * @property {Object} metadata - Report metadata
 * @property {number} totalRecords - Total number of records
 */

/**
 * @typedef {Object} ScheduledReport
 * @property {string} id - Report ID
 * @property {string} name - Report name
 * @property {string} type - Report type
 * @property {string} frequency - Report frequency
 * @property {Object} filters - Report filters
 * @property {string} format - Export format
 * @property {string[]} recipients - Email recipients
 * @property {boolean} active - Whether report is active
 * @property {Date} nextRun - Next scheduled run
 */

class ReportsAPI {
  /**
   * Get performance report data
   * @param {ReportFilters} filters - Report filters
   * @returns {Promise<ReportData>} Performance report data
   */
  async getPerformanceReport(filters = {}) {
    try {
      const response = await apiClient.request('/api/reports/performance', {
        method: 'POST',
        body: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch performance report:', error);
      // Return mock data for development
      return this.getMockPerformanceData(filters);
    }
  }

  /**
   * Get applications report data
   * @param {ReportFilters} filters - Report filters
   * @returns {Promise<ReportData>} Applications report data
   */
  async getApplicationsReport(filters = {}) {
    try {
      const response = await apiClient.request('/api/reports/applications', {
        method: 'POST',
        body: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch applications report:', error);
      // Return mock data for development
      return this.getMockApplicationsData(filters);
    }
  }

  /**
   * Get productivity report data
   * @param {ReportFilters} filters - Report filters
   * @returns {Promise<ReportData>} Productivity report data
   */
  async getProductivityReport(filters = {}) {
    try {
      const response = await apiClient.request('/api/reports/productivity', {
        method: 'POST',
        body: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch productivity report:', error);
      // Return mock data for development
      return this.getMockProductivityData(filters);
    }
  }

  /**
   * Get custom report data
   * @param {string} reportType - Custom report type
   * @param {ReportFilters} filters - Report filters
   * @returns {Promise<ReportData>} Custom report data
   */
  async getCustomReport(reportType, filters = {}) {
    try {
      const response = await apiClient.request(`/api/reports/custom/${reportType}`, {
        method: 'POST',
        body: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch custom report:', error);
      throw error;
    }
  }

  /**
   * Get scheduled reports
   * @returns {Promise<ScheduledReport[]>} List of scheduled reports
   */
  async getScheduledReports() {
    try {
      const response = await apiClient.request('/api/reports/scheduled');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch scheduled reports:', error);
      // Return mock data for development
      return this.getMockScheduledReports();
    }
  }

  /**
   * Create scheduled report
   * @param {Object} reportConfig - Report configuration
   * @returns {Promise<ScheduledReport>} Created scheduled report
   */
  async createScheduledReport(reportConfig) {
    try {
      const response = await apiClient.request('/api/reports/scheduled', {
        method: 'POST',
        body: reportConfig,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create scheduled report:', error);
      throw error;
    }
  }

  /**
   * Update scheduled report
   * @param {string} reportId - Report ID
   * @param {Object} updates - Report updates
   * @returns {Promise<ScheduledReport>} Updated scheduled report
   */
  async updateScheduledReport(reportId, updates) {
    try {
      const response = await apiClient.request(`/api/reports/scheduled/${reportId}`, {
        method: 'PUT',
        body: updates,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update scheduled report:', error);
      throw error;
    }
  }

  /**
   * Delete scheduled report
   * @param {string} reportId - Report ID
   * @returns {Promise<void>}
   */
  async deleteScheduledReport(reportId) {
    try {
      await apiClient.request(`/api/reports/scheduled/${reportId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete scheduled report:', error);
      throw error;
    }
  }

  /**
   * Get report templates
   * @returns {Promise<Array>} Available report templates
   */
  async getReportTemplates() {
    try {
      const response = await apiClient.request('/api/reports/templates');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch report templates:', error);
      return this.getMockReportTemplates();
    }
  }

  // Mock data methods for development
  getMockPerformanceData(filters) {
    const mockData = [
      {
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        applicationsProcessed: 45,
        approvalRate: 78,
        avgProcessingTime: 2.5,
        customerSatisfaction: 4.2,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Sarah Johnson',
        applicationsProcessed: 52,
        approvalRate: 85,
        avgProcessingTime: 2.1,
        customerSatisfaction: 4.5,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
      {
        employeeId: 'EMP003',
        employeeName: 'Mike Davis',
        applicationsProcessed: 38,
        approvalRate: 72,
        avgProcessingTime: 3.2,
        customerSatisfaction: 3.9,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    ];

    return {
      data: mockData,
      summary: {
        totalApplications: mockData.reduce((sum, item) => sum + item.applicationsProcessed, 0),
        averageApprovalRate: mockData.reduce((sum, item) => sum + item.approvalRate, 0) / mockData.length,
        averageProcessingTime: mockData.reduce((sum, item) => sum + item.avgProcessingTime, 0) / mockData.length,
        averageCustomerSatisfaction: mockData.reduce((sum, item) => sum + item.customerSatisfaction, 0) / mockData.length,
      },
      metadata: {
        reportType: 'performance',
        generatedAt: new Date().toISOString(),
        filters,
      },
      totalRecords: mockData.length,
    };
  }

  getMockApplicationsData(filters) {
    const mockData = [
      {
        id: 'APP001',
        customerName: 'Alice Brown',
        type: 'Personal Loan',
        status: 'Approved',
        submittedDate: new Date('2024-01-15'),
        processingTime: 24,
        assignedOfficer: 'John Smith',
      },
      {
        id: 'APP002',
        customerName: 'Bob Wilson',
        type: 'Credit Card',
        status: 'Under Review',
        submittedDate: new Date('2024-01-18'),
        processingTime: null,
        assignedOfficer: 'Sarah Johnson',
      },
      {
        id: 'APP003',
        customerName: 'Carol Davis',
        type: 'Account Opening',
        status: 'Completed',
        submittedDate: new Date('2024-01-12'),
        processingTime: 18,
        assignedOfficer: 'Mike Davis',
      },
    ];

    return {
      data: mockData,
      summary: {
        totalApplications: mockData.length,
        approvedApplications: mockData.filter(app => app.status === 'Approved').length,
        pendingApplications: mockData.filter(app => app.status === 'Under Review').length,
        averageProcessingTime: mockData
          .filter(app => app.processingTime)
          .reduce((sum, app) => sum + app.processingTime, 0) / 
          mockData.filter(app => app.processingTime).length,
      },
      metadata: {
        reportType: 'applications',
        generatedAt: new Date().toISOString(),
        filters,
      },
      totalRecords: mockData.length,
    };
  }

  getMockProductivityData(filters) {
    const mockData = [
      {
        date: new Date('2024-01-15'),
        tasksCompleted: 12,
        applicationsReviewed: 8,
        documentsProcessed: 25,
        customerInteractions: 15,
        efficiencyScore: 85,
      },
      {
        date: new Date('2024-01-16'),
        tasksCompleted: 15,
        applicationsReviewed: 10,
        documentsProcessed: 30,
        customerInteractions: 18,
        efficiencyScore: 92,
      },
      {
        date: new Date('2024-01-17'),
        tasksCompleted: 9,
        applicationsReviewed: 6,
        documentsProcessed: 20,
        customerInteractions: 12,
        efficiencyScore: 78,
      },
    ];

    return {
      data: mockData,
      summary: {
        totalTasks: mockData.reduce((sum, item) => sum + item.tasksCompleted, 0),
        totalApplications: mockData.reduce((sum, item) => sum + item.applicationsReviewed, 0),
        totalDocuments: mockData.reduce((sum, item) => sum + item.documentsProcessed, 0),
        averageEfficiency: mockData.reduce((sum, item) => sum + item.efficiencyScore, 0) / mockData.length,
      },
      metadata: {
        reportType: 'productivity',
        generatedAt: new Date().toISOString(),
        filters,
      },
      totalRecords: mockData.length,
    };
  }

  getMockScheduledReports() {
    return [
      {
        id: 'SR001',
        name: 'Weekly Performance Report',
        type: 'performance',
        frequency: 'weekly',
        filters: { dateRange: 'last_7_days' },
        format: 'pdf',
        recipients: ['manager@bank.com'],
        active: true,
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'SR002',
        name: 'Monthly Applications Summary',
        type: 'applications',
        frequency: 'monthly',
        filters: { dateRange: 'last_30_days' },
        format: 'excel',
        recipients: ['admin@bank.com', 'reports@bank.com'],
        active: true,
        nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  getMockReportTemplates() {
    return [
      {
        id: 'TPL001',
        name: 'Standard Performance Report',
        type: 'performance',
        description: 'Employee performance metrics and KPIs',
        fields: ['employeeName', 'applicationsProcessed', 'approvalRate', 'avgProcessingTime'],
      },
      {
        id: 'TPL002',
        name: 'Application Status Report',
        type: 'applications',
        description: 'Application processing status and timeline',
        fields: ['customerName', 'type', 'status', 'submittedDate', 'processingTime'],
      },
      {
        id: 'TPL003',
        name: 'Daily Productivity Report',
        type: 'productivity',
        description: 'Daily productivity metrics and efficiency scores',
        fields: ['date', 'tasksCompleted', 'applicationsReviewed', 'efficiencyScore'],
      },
    ];
  }
}

// Export singleton instance
export const reportsAPI = new ReportsAPI();
export default reportsAPI;