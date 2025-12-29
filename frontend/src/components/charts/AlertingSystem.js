/**
 * Alerting System Component
 * Manages threshold configuration, alert delivery, and alert history
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { ThresholdsTab, HistoryTab } from './AlertingSystemTabs';
import ThresholdConfigModal from './ThresholdConfigModal';
import AlertDeliverySystem from './AlertDeliverySystem';
import { 
  BellIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  ClockIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} Alert
 * @property {string} id - Alert ID
 * @property {'critical'|'warning'|'info'} severity - Alert severity level
 * @property {string} title - Alert title
 * @property {string} message - Alert message
 * @property {string} metric - Metric that triggered the alert
 * @property {number} value - Current value
 * @property {number} threshold - Threshold value
 * @property {'above'|'below'} condition - Threshold condition
 * @property {Date} timestamp - Alert timestamp
 * @property {'active'|'acknowledged'|'resolved'} status - Alert status
 * @property {string} [acknowledgedBy] - User who acknowledged the alert
 * @property {Date} [acknowledgedAt] - Acknowledgment timestamp
 * @property {string[]} channels - Delivery channels used
 */

/**
 * @typedef {Object} AlertThreshold
 * @property {string} id - Threshold ID
 * @property {string} name - Threshold name
 * @property {string} metric - Metric to monitor
 * @property {'above'|'below'} condition - Threshold condition
 * @property {number} value - Threshold value
 * @property {'critical'|'warning'|'info'} severity - Alert severity
 * @property {boolean} enabled - Whether threshold is active
 * @property {string[]} channels - Delivery channels (email, sms, in-app)
 * @property {string[]} recipients - Email/SMS recipients
 * @property {number} cooldown - Cooldown period in minutes
 */

/**
 * Active Alerts Tab Component
 */
const AlertsTab = ({ alerts, loading, filters, onFiltersChange, onAcknowledge, onDelete, onViewDeliveries }) => {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (severity) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'info':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'acknowledged':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'resolved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
    if (filters.status !== 'all' && alert.status !== filters.status) return false;
    
    // Time range filtering
    const alertTime = new Date(alert.timestamp);
    const now = new Date();
    const timeDiff = now - alertTime;
    
    switch (filters.timeRange) {
      case '1h':
        return timeDiff <= 60 * 60 * 1000;
      case '24h':
        return timeDiff <= 24 * 60 * 60 * 1000;
      case '7d':
        return timeDiff <= 7 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Severity:
          </label>
          <select
            value={filters.severity}
            onChange={(e) => onFiltersChange({ ...filters, severity: e.target.value })}
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
            Status:
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Range:
          </label>
          <select
            value={filters.timeRange}
            onChange={(e) => onFiltersChange({ ...filters, timeRange: e.target.value })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['critical', 'warning', 'info', 'total'].map(type => {
          const count = type === 'total' 
            ? filteredAlerts.length 
            : filteredAlerts.filter(a => a.severity === type).length;
          
          return (
            <div key={type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getSeverityIcon(type === 'total' ? 'info' : type)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                    {type} Alerts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {count}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No alerts</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No alerts match your current filters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      <span className={getSeverityBadge(alert.severity)}>
                        {alert.severity}
                      </span>
                      <span className={getStatusBadge(alert.status)}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Metric: {alert.metric}</span>
                      <span>Value: {alert.value}</span>
                      <span>Threshold: {alert.threshold}</span>
                      <span>
                        <ClockIcon className="inline h-3 w-3 mr-1" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {alert.acknowledgedBy && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                    >
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => onViewDeliveries(alert.id)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    View Deliveries
                  </button>
                  <button
                    onClick={() => onDelete(alert.id)}
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
 * Alerting System Component
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 */
const AlertingSystem = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(null);
  const [selectedAlertForDeliveries, setSelectedAlertForDeliveries] = useState(null);
  const [alertFilters, setAlertFilters] = useState({
    severity: 'all',
    status: 'all',
    timeRange: '24h',
  });

  const queryClient = useQueryClient();

  // Fetch active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', alertFilters],
    queryFn: async () => {
      const response = await apiClient.request('/api/analytics/alerts', {
        method: 'GET',
      });
      return response.data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch alert thresholds
  const { data: thresholds, isLoading: thresholdsLoading } = useQuery({
    queryKey: ['alert-thresholds'],
    queryFn: async () => {
      const response = await apiClient.request('/api/analytics/alert-thresholds');
      return response.data || [];
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      return apiClient.request(`/api/analytics/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      return apiClient.request(`/api/analytics/alerts/${alertId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    },
  });

  const handleEditThreshold = (threshold) => {
    setEditingThreshold(threshold);
    setShowThresholdModal(true);
  };

  const handleAddThreshold = () => {
    setEditingThreshold(null);
    setShowThresholdModal(true);
  };

  const handleCloseThresholdModal = () => {
    setShowThresholdModal(false);
    setEditingThreshold(null);
  };

  const handleViewDeliveries = (alertId) => {
    setSelectedAlertForDeliveries(alertId);
  };

  const handleCloseDeliveries = () => {
    setSelectedAlertForDeliveries(null);
  };

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Alert Management
            </h3>
          </div>
        
          <div className="flex items-center space-x-4">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'alerts'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
              Active Alerts
              </button>
              <button
                onClick={() => setActiveTab('thresholds')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'thresholds'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
              Thresholds
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
              History
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'alerts' && (
            <AlertsTab 
              alerts={alerts || []}
              loading={alertsLoading}
              filters={alertFilters}
              onFiltersChange={setAlertFilters}
              onAcknowledge={(id) => acknowledgeAlertMutation.mutate(id)}
              onDelete={(id) => deleteAlertMutation.mutate(id)}
              onViewDeliveries={handleViewDeliveries}
            />
          )}
        
          {activeTab === 'thresholds' && (
            <ThresholdsTab 
              thresholds={thresholds || []}
              loading={thresholdsLoading}
              onEdit={handleEditThreshold}
              onAdd={handleAddThreshold}
            />
          )}
        
          {activeTab === 'history' && (
            <HistoryTab />
          )}
        </div>
      </div>

      {/* Threshold Configuration Modal */}
      <ThresholdConfigModal
        isOpen={showThresholdModal}
        onClose={handleCloseThresholdModal}
        threshold={editingThreshold}
        onSave={() => {
        // Modal handles the save and will close itself
        // Query invalidation is handled by the mutation in the modal
        }}
      />

      {/* Alert Delivery System Modal */}
      {selectedAlertForDeliveries && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseDeliveries} />
            <div className="relative max-w-4xl w-full">
              <AlertDeliverySystem
                alertId={selectedAlertForDeliveries}
                onClose={handleCloseDeliveries}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertingSystem;