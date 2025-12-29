/**
 * Export Dashboard Component
 * Comprehensive export management interface with templates, scheduling, and history
 * Requirements: 6.4 - Multi-format export functionality
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DocumentArrowDownIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import ExportManager from '../charts/ExportManager';
import ExportTemplates from '../charts/ExportTemplates';
import { exportService } from '../../lib/services/exportService';
import useAuthStore from '../../lib/auth/auth-store';
import useNotificationStore from '../../stores/notificationStore';

/**
 * Export Dashboard Component
 * @param {Object} props
 * @param {Object} [props.data] - Data to export
 * @param {string} [props.reportType] - Default report type
 * @param {Object} [props.filters] - Default filters
 * @param {string} [props.className] - Additional CSS classes
 */
const ExportDashboard = ({
  data,
  reportType = 'analytics',
  filters = {},
  className = '',
}) => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('export');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [scheduledExports, setScheduledExports] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Fetch scheduled exports
  const { data: scheduledData, isLoading: scheduledLoading } = useQuery({
    queryKey: ['scheduled-exports'],
    queryFn: () => exportService.getScheduledExports(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch export history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['export-history'],
    queryFn: () => exportService.getExportHistory({ limit: 50 }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update local state when data changes
  useEffect(() => {
    if (scheduledData) {
      setScheduledExports(scheduledData);
    }
  }, [scheduledData]);

  useEffect(() => {
    if (historyData) {
      setExportHistory(historyData);
    }
  }, [historyData]);

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (exportRequest) => {
      setIsExporting(true);
      setExportProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const result = await exportService.exportData(exportRequest);
        clearInterval(progressInterval);
        setExportProgress(100);
        
        // Reset after delay
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
        }, 1000);

        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setIsExporting(false);
        setExportProgress(0);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      addNotification({
        type: 'success',
        title: 'Export Completed',
        message: `${variables.format.toUpperCase()} export completed successfully`,
      });
      queryClient.invalidateQueries(['export-history']);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.message || 'Failed to export data',
      });
    },
  });

  // Email export mutation
  const emailExportMutation = useMutation({
    mutationFn: async ({ exportRequest, recipients, emailOptions }) => {
      return exportService.emailExport(exportRequest, recipients, emailOptions);
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Export Emailed',
        message: 'Export has been sent via email successfully',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Email Failed',
        message: error.message || 'Failed to send export via email',
      });
    },
  });

  // Schedule export mutation
  const scheduleExportMutation = useMutation({
    mutationFn: async (schedule) => {
      return exportService.scheduleExport(schedule);
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Export Scheduled',
        message: 'Export has been scheduled successfully',
      });
      queryClient.invalidateQueries(['scheduled-exports']);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Scheduling Failed',
        message: error.message || 'Failed to schedule export',
      });
    },
  });

  // Handle export
  const handleExport = async (format, options = {}) => {
    const exportRequest = {
      format,
      reportType,
      filters,
      templateId: selectedTemplate?.id,
      ...options,
    };

    exportMutation.mutate(exportRequest);
  };

  // Handle email export
  const handleEmailExport = async (format, recipients, emailOptions = {}) => {
    const exportRequest = {
      format,
      reportType,
      filters,
      templateId: selectedTemplate?.id,
    };

    emailExportMutation.mutate({ exportRequest, recipients, emailOptions });
  };

  // Handle schedule export
  const handleScheduleExport = async (scheduleConfig) => {
    const schedule = {
      name: `${reportType} Export - ${scheduleConfig.frequency}`,
      frequency: scheduleConfig.frequency,
      time: scheduleConfig.time,
      recipients: scheduleConfig.recipients,
      exportConfig: {
        format: scheduleConfig.format,
        reportType,
        filters,
        templateId: selectedTemplate?.id,
      },
      enabled: true,
    };

    scheduleExportMutation.mutate(schedule);
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    addNotification({
      type: 'info',
      title: 'Template Selected',
      message: `Using template: ${template.name}`,
    });
  };

  // Handle download from history
  const handleDownloadFromHistory = async (exportId) => {
    try {
      const blob = await exportService.downloadExport(exportId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_${exportId}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: error.message || 'Failed to download export',
      });
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'export', name: 'Export Data', icon: DocumentArrowDownIcon },
    { id: 'templates', name: 'Templates', icon: DocumentDuplicateIcon },
    { id: 'schedule', name: 'Scheduled', icon: ClockIcon },
    { id: 'history', name: 'History', icon: ChartBarIcon },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Export Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Export data in multiple formats, create templates, and schedule automated exports
            </p>
          </div>
          
          {selectedTemplate && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <DocumentDuplicateIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Template: {selectedTemplate.name}
              </span>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isExporting && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exporting data...
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {exportProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Export Tab */}
          {activeTab === 'export' && (
            <ExportManager
              data={data}
              title={`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`}
              timeRange={filters.dateRange ? { label: filters.dateRange } : null}
              onExportStart={(format) => {
                addNotification({
                  type: 'info',
                  title: 'Export Started',
                  message: `Starting ${format.toUpperCase()} export...`,
                });
              }}
              onExportComplete={(format, filename) => {
                addNotification({
                  type: 'success',
                  title: 'Export Complete',
                  message: `${filename} has been downloaded successfully`,
                });
              }}
              onExportError={(error) => {
                addNotification({
                  type: 'error',
                  title: 'Export Failed',
                  message: error.message || 'Export failed',
                });
              }}
              showScheduler={true}
            />
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <ExportTemplates
              onTemplateSelect={handleTemplateSelect}
              onTemplateCreate={(template) => {
                addNotification({
                  type: 'success',
                  title: 'Template Created',
                  message: `Template "${template.name}" created successfully`,
                });
              }}
              onTemplateUpdate={(template) => {
                addNotification({
                  type: 'success',
                  title: 'Template Updated',
                  message: `Template "${template.name}" updated successfully`,
                });
              }}
              onTemplateDelete={(templateId) => {
                addNotification({
                  type: 'success',
                  title: 'Template Deleted',
                  message: 'Template deleted successfully',
                });
              }}
            />
          )}

          {/* Scheduled Exports Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Scheduled Exports
                </h3>
                <button
                  onClick={() => {
                    // Open schedule creation modal
                    console.log('Create new schedule');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  <div className="flex items-center space-x-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>New Schedule</span>
                  </div>
                </button>
              </div>

              {scheduledLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : scheduledExports.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Scheduled Exports
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Create your first scheduled export to automate report generation
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledExports.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {schedule.name}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span>Every {schedule.frequency}</span>
                            <span>at {schedule.time}</span>
                            <span>{schedule.exportConfig.format.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              schedule.enabled
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {schedule.enabled ? 'Active' : 'Inactive'}
                            </span>
                            {schedule.nextRun && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Next: {new Date(schedule.nextRun).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Export History
              </h3>

              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : exportHistory.length === 0 ? (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Export History
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Your export history will appear here once you start exporting data
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Export
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Format
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {exportHistory.map((export_) => (
                        <tr key={export_.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {export_.filename || `${export_.reportType}_export`}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {export_.reportType}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              {export_.format.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              export_.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : export_.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {export_.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(export_.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {export_.status === 'completed' && (
                              <button
                                onClick={() => handleDownloadFromHistory(export_.id)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              >
                                Download
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportDashboard;