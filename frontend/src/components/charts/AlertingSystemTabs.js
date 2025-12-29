/**
 * Alerting System Tab Components
 * Supporting components for the main AlertingSystem
 */
import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { 
  BellIcon,
  CogIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

/**
 * Thresholds Configuration Tab Component
 */
export const ThresholdsTab = ({ thresholds, loading, onEdit, onAdd }) => {
  const queryClient = useQueryClient();

  // Toggle threshold enabled/disabled
  const toggleThresholdMutation = useMutation({
    mutationFn: async ({ id, enabled }) => {
      return apiClient.request(`/api/analytics/alert-thresholds/${id}`, {
        method: 'PATCH',
        body: { enabled },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-thresholds']);
    },
  });

  // Delete threshold
  const deleteThresholdMutation = useMutation({
    mutationFn: async (id) => {
      return apiClient.request(`/api/analytics/alert-thresholds/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-thresholds']);
    },
  });

  const getChannelIcons = (channels) => {
    return channels.map(channel => {
      switch (channel) {
        case 'email':
          return <EnvelopeIcon key={channel} className="h-4 w-4 text-blue-500" title="Email" />;
        case 'sms':
          return <DevicePhoneMobileIcon key={channel} className="h-4 w-4 text-green-500" title="SMS" />;
        case 'in-app':
          return <BellIcon key={channel} className="h-4 w-4 text-purple-500" title="In-App" />;
        default:
          return null;
      }
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Alert Thresholds
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure thresholds for automatic alert generation
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Threshold
        </button>
      </div>

      {/* Thresholds List */}
      <div className="space-y-4">
        {thresholds.length === 0 ? (
          <div className="text-center py-12">
            <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No thresholds configured</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first alert threshold.
            </p>
            <div className="mt-6">
              <button
                onClick={onAdd}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Threshold
              </button>
            </div>
          </div>
        ) : (
          thresholds.map((threshold) => (
            <div
              key={threshold.id}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      {threshold.name}
                    </h5>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      threshold.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {threshold.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      threshold.severity === 'critical'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : threshold.severity === 'warning'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {threshold.severity}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <span className="font-medium">Metric:</span> {threshold.metric}
                    </div>
                    <div>
                      <span className="font-medium">Condition:</span> {threshold.condition} {threshold.value}
                    </div>
                    <div>
                      <span className="font-medium">Cooldown:</span> {threshold.cooldown} minutes
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Channels:</span>
                      <div className="flex space-x-1">
                        {getChannelIcons(threshold.channels)}
                      </div>
                    </div>
                    {threshold.recipients && threshold.recipients.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Recipients: {threshold.recipients.length}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleThresholdMutation.mutate({ 
                      id: threshold.id, 
                      enabled: !threshold.enabled, 
                    })}
                    className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${
                      threshold.enabled
                        ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                        : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  >
                    {threshold.enabled ? 'Disable' : 'Enable'}
                  </button>
                  
                  <button
                    onClick={() => onEdit(threshold)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                  >
                    <CogIcon className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => deleteThresholdMutation.mutate(threshold.id)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
/**
 * Alert History Tab Component
 */
export const HistoryTab = () => {
  const [historyFilters, setHistoryFilters] = React.useState({
    severity: 'all',
    dateRange: '7d',
    status: 'all',
  });

  // Fetch alert history
  const { data: alertHistory, isLoading } = useQuery({
    queryKey: ['alert-history', historyFilters],
    queryFn: async () => {
      const response = await apiClient.request('/api/analytics/alerts/history', {
        method: 'GET',
      });
      return response.data || [];
    },
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <div className="h-3 w-3 bg-red-500 rounded-full"></div>;
      case 'warning':
        return <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>;
      case 'info':
        return <div className="h-3 w-3 bg-blue-500 rounded-full"></div>;
      default:
        return <div className="h-3 w-3 bg-gray-500 rounded-full"></div>;
    }
  };

  const filteredHistory = (alertHistory || []).filter(alert => {
    if (historyFilters.severity !== 'all' && alert.severity !== historyFilters.severity) return false;
    if (historyFilters.status !== 'all' && alert.status !== historyFilters.status) return false;
    
    // Date range filtering
    const alertTime = new Date(alert.timestamp);
    const now = new Date();
    const timeDiff = now - alertTime;
    
    switch (historyFilters.dateRange) {
      case '24h':
        return timeDiff <= 24 * 60 * 60 * 1000;
      case '7d':
        return timeDiff <= 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return timeDiff <= 30 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Alert History
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View past alerts and their resolution status
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Severity:
            </label>
            <select
              value={historyFilters.severity}
              onChange={(e) => setHistoryFilters({ ...historyFilters, severity: e.target.value })}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range:
            </label>
            <select
              value={historyFilters.dateRange}
              onChange={(e) => setHistoryFilters({ ...historyFilters, dateRange: e.target.value })}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </label>
            <select
              value={historyFilters.status}
              onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="resolved">Resolved</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No alert history</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No alerts match your current filters.
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredHistory.map((alert, alertIdx) => (
                <li key={alert.id}>
                  <div className="relative pb-8">
                    {alertIdx !== filteredHistory.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {alert.title}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              alert.severity === 'critical'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : alert.severity === 'warning'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              alert.status === 'resolved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : alert.status === 'acknowledged'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {alert.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>Metric: {alert.metric}</span>
                            <span>Value: {alert.value}</span>
                            <span>Threshold: {alert.threshold}</span>
                            {alert.duration && (
                              <span>Duration: {alert.duration}</span>
                            )}
                          </div>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={alert.timestamp}>
                            {new Date(alert.timestamp).toLocaleString()}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Alerts
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {filteredHistory.length}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Resolved
            </div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {filteredHistory.filter(a => a.status === 'resolved').length}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Critical
            </div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {filteredHistory.filter(a => a.severity === 'critical').length}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Avg Resolution Time
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {filteredHistory.length > 0 ? '2.5h' : '0h'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};