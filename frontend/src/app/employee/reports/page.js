/**
 * Employee Reports Page
 * Comprehensive reporting interface with export functionality
 * Requirements: 2.5 - Report generation and export functionality
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/auth/auth-store';
import { reportsAPI } from '@/lib/api/reports';
import ExportDashboard from '@/components/analytics/ExportDashboard';
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF, 
  generateReportData,
  formatReportMetadata,
  validateExportData,
} from '@/lib/utils/export';

export default function ReportsPage() {
  const { hasPermission } = useAuthStore();
  const [reportType, setReportType] = useState('performance');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [department, setDepartment] = useState('');
  const [employee, setEmployee] = useState('');
  const [status, setStatus] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showScheduledReports, setShowScheduledReports] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDashboard, setShowExportDashboard] = useState(false);
  
  const reportTableRef = useRef(null);

  // Load initial data
  useEffect(() => {
    if (hasPermission('view_reports')) {
      loadReportData();
      loadScheduledReports();
    }
  }, [reportType, dateRange, department, employee, status]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = {
        dateRange,
        startDate: customStartDate,
        endDate: customEndDate,
        department,
        employee,
        status,
      };

      let data;
      switch (reportType) {
        case 'performance':
          data = await reportsAPI.getPerformanceReport(filters);
          break;
        case 'applications':
          data = await reportsAPI.getApplicationsReport(filters);
          break;
        case 'productivity':
          data = await reportsAPI.getProductivityReport(filters);
          break;
        default:
          data = await reportsAPI.getCustomReport(reportType, filters);
      }
      
      setReportData(data);
    } catch (err) {
      setError('Failed to load report data. Please try again.');
      console.error('Report loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledReports = async () => {
    try {
      const reports = await reportsAPI.getScheduledReports();
      setScheduledReports(reports);
    } catch (err) {
      console.error('Failed to load scheduled reports:', err);
    }
  };

  const handleExport = async (format) => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      alert('No data available for export');
      return;
    }

    setIsExporting(true);
    
    try {
      const filters = {
        dateRange,
        startDate: customStartDate,
        endDate: customEndDate,
        department,
        employee,
        status,
      };

      const exportData = generateReportData(reportType, filters, reportData.data);
      validateExportData(exportData, format);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${reportType}_report_${timestamp}`;
      
      switch (format.toLowerCase()) {
        case 'csv':
          exportToCSV(exportData, `${filename}.csv`);
          break;
          
        case 'excel':
          exportToExcel(exportData, `${filename}.xlsx`, {
            sheetName: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
            columnWidths: [
              { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
              { wch: 20 }, { wch: 15 }, { wch: 20 },
            ],
          });
          break;
          
        case 'pdf':
          const metadata = formatReportMetadata(filters, reportType);
          exportToPDF(exportData, `${filename}.pdf`, {
            title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
            metadata,
            orientation: 'landscape',
            theme: 'grid',
          });
          break;
          
        default:
          throw new Error('Unsupported export format');
      }
      
      // Track export event (could be sent to analytics)
      console.log(`Report exported: ${format}, ${exportData.length} records`);
      
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleReport = async (scheduleConfig) => {
    try {
      const newReport = await reportsAPI.createScheduledReport({
        ...scheduleConfig,
        type: reportType,
        filters: {
          dateRange,
          department,
          employee,
          status,
        },
      });
      
      setScheduledReports([...scheduledReports, newReport]);
      setShowScheduleModal(false);
      alert('Report scheduled successfully!');
    } catch (err) {
      console.error('Failed to schedule report:', err);
      alert('Failed to schedule report. Please try again.');
    }
  };

  const handleDeleteScheduledReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }
    
    try {
      await reportsAPI.deleteScheduledReport(reportId);
      setScheduledReports(scheduledReports.filter(r => r.id !== reportId));
      alert('Scheduled report deleted successfully!');
    } catch (err) {
      console.error('Failed to delete scheduled report:', err);
      alert('Failed to delete scheduled report. Please try again.');
    }
  };

  if (!hasPermission('view_reports')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Generate comprehensive reports and export data</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowScheduledReports(!showScheduledReports)}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ClockIcon className="w-5 h-5 mr-2" />
                Scheduled Reports
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Schedule Report
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="performance">Performance Report</option>
              <option value="applications">Applications Report</option>
              <option value="productivity">Productivity Report</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              Advanced Filters
            </button>

            <div className="flex space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={() => handleExport(exportFormat)}
                disabled={isExporting || !reportData}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                )}
                Export
              </button>
              <button
                onClick={() => setShowExportDashboard(!showExportDashboard)}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Advanced Export
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  <option value="loans">Loans</option>
                  <option value="accounts">Accounts</option>
                  <option value="customer_service">Customer Service</option>
                </select>

                <select
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Employees</option>
                  <option value="john_smith">John Smith</option>
                  <option value="sarah_johnson">Sarah Johnson</option>
                  <option value="mike_davis">Mike Davis</option>
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="End Date"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scheduled Reports Panel */}
        {showScheduledReports && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h3>
            {scheduledReports.length === 0 ? (
              <p className="text-gray-500">No scheduled reports found.</p>
            ) : (
              <div className="space-y-3">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600">
                        {report.type} • {report.frequency} • {report.format.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Next run: {new Date(report.nextRun).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Cog6ToothIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteScheduledReport(report.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-gray-600">Loading report data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadReportData}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Report Data */}
        {reportData && !loading && (
          <>
            {/* Summary Metrics */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Object.entries(reportData.summary).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ChartBarIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {typeof value === 'number' ? 
                            (value % 1 === 0 ? value : value.toFixed(1)) : 
                            value
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden" ref={reportTableRef}>
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Data
                </h3>
                <span className="text-sm text-gray-500">
                  {reportData.totalRecords} records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {reportData.data.length > 0 && Object.keys(reportData.data[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.data.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Schedule Report Modal */}
        {showScheduleModal && (
          <ScheduleReportModal
            onClose={() => setShowScheduleModal(false)}
            onSchedule={handleScheduleReport}
            reportType={reportType}
          />
        )}

        {/* Advanced Export Dashboard */}
        {showExportDashboard && reportData && (
          <div className="mt-8">
            <ExportDashboard
              data={reportData.data}
              reportType={reportType}
              filters={{
                dateRange,
                startDate: customStartDate,
                endDate: customEndDate,
                department,
                employee,
                status,
              }}
              className="mb-6"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Schedule Report Modal Component
function ScheduleReportModal({ onClose, onSchedule, reportType }) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [format, setFormat] = useState('pdf');
  const [recipients, setRecipients] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a report name');
      return;
    }

    const recipientList = recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    if (recipientList.length === 0) {
      alert('Please enter at least one recipient email');
      return;
    }

    onSchedule({
      name: name.trim(),
      frequency,
      format,
      recipients: recipientList,
      active: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Report</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter report name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipients (comma-separated emails)
            </label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="manager@bank.com, admin@bank.com"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Schedule Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}