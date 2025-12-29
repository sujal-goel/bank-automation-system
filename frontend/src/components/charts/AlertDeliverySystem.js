/**
 * Alert Delivery System Component
 * Manages alert delivery channels and tracks delivery status
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { 
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} AlertDelivery
 * @property {string} id - Delivery ID
 * @property {string} alertId - Alert ID
 * @property {'email'|'sms'|'in-app'} channel - Delivery channel
 * @property {string} recipient - Recipient address/number
 * @property {'pending'|'sent'|'delivered'|'failed'|'acknowledged'} status - Delivery status
 * @property {Date} timestamp - Delivery timestamp
 * @property {Date} [deliveredAt] - Delivery confirmation timestamp
 * @property {Date} [acknowledgedAt] - Acknowledgment timestamp
 * @property {string} [error] - Error message if failed
 * @property {number} [retryCount] - Number of retry attempts
 * @property {Object} [metadata] - Additional delivery metadata
 */

/**
 * Alert Delivery System Component
 */
const AlertDeliverySystem = ({ alertId, onClose }) => {
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [expandedDeliveries, setExpandedDeliveries] = useState(new Set());
  const queryClient = useQueryClient();

  // Fetch alert deliveries
  const { data: deliveries, isLoading, error } = useQuery({
    queryKey: ['alert-deliveries', alertId],
    queryFn: async () => {
      const response = await apiClient.request(`/api/analytics/alerts/${alertId}/deliveries`);
      return response.data || [];
    },
    enabled: !!alertId,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Retry delivery mutation
  const retryDeliveryMutation = useMutation({
    mutationFn: async (deliveryId) => {
      return apiClient.request(`/api/analytics/alert-deliveries/${deliveryId}/retry`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-deliveries', alertId]);
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
      queryClient.invalidateQueries(['alert-deliveries', alertId]);
      queryClient.invalidateQueries(['alert-history']);
    },
  });

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email':
        return <EnvelopeIcon className="h-5 w-5 text-blue-500" />;
      case 'sms':
        return <DevicePhoneMobileIcon className="h-5 w-5 text-green-500" />;
      case 'in-app':
        return <BellIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
      case 'acknowledged':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'sent':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <ArrowPathIcon className="h-5 w-5 text-gray-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'acknowledged':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const toggleDeliveryExpansion = (deliveryId) => {
    const newExpanded = new Set(expandedDeliveries);
    if (newExpanded.has(deliveryId)) {
      newExpanded.delete(deliveryId);
    } else {
      newExpanded.add(deliveryId);
    }
    setExpandedDeliveries(newExpanded);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getDeliveryStats = () => {
    if (!deliveries || deliveries.length === 0) {
      return { total: 0, delivered: 0, failed: 0, pending: 0 };
    }

    return {
      total: deliveries.length,
      delivered: deliveries.filter(d => d.status === 'delivered' || d.status === 'acknowledged').length,
      failed: deliveries.filter(d => d.status === 'failed').length,
      pending: deliveries.filter(d => d.status === 'pending' || d.status === 'sent').length,
    };
  };

  const stats = getDeliveryStats();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Failed to load delivery information
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Alert Delivery Status
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track delivery status across all channels
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => acknowledgeAlertMutation.mutate(alertId)}
              disabled={acknowledgeAlertMutation.isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              {acknowledgeAlertMutation.isLoading ? 'Acknowledging...' : 'Acknowledge Alert'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Deliveries
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {stats.delivered}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Delivered
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {stats.failed}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Failed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Pending
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="px-6 py-4">
        {deliveries && deliveries.length > 0 ? (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getChannelIcon(delivery.channel)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {delivery.channel.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        To: {delivery.recipient}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(delivery.status)}
                    <div className="text-right">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatTimestamp(delivery.timestamp)}
                      </div>
                      {delivery.deliveredAt && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Delivered: {formatTimestamp(delivery.deliveredAt)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {delivery.status === 'failed' && (
                        <button
                          onClick={() => retryDeliveryMutation.mutate(delivery.id)}
                          disabled={retryDeliveryMutation.isLoading}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
                        >
                          <ArrowPathIcon className="h-3 w-3 mr-1" />
                          Retry
                        </button>
                      )}
                      
                      <button
                        onClick={() => toggleDeliveryExpansion(delivery.id)}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        {expandedDeliveries.has(delivery.id) ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedDeliveries.has(delivery.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Delivery ID:
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400 font-mono">
                          {delivery.id}
                        </span>
                      </div>
                      
                      {delivery.retryCount > 0 && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Retry Count:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {delivery.retryCount}
                          </span>
                        </div>
                      )}
                      
                      {delivery.acknowledgedAt && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Acknowledged:
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {formatTimestamp(delivery.acknowledgedAt)}
                          </span>
                        </div>
                      )}
                      
                      {delivery.error && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-red-700 dark:text-red-300">
                            Error:
                          </span>
                          <span className="ml-2 text-red-600 dark:text-red-400">
                            {delivery.error}
                          </span>
                        </div>
                      )}
                      
                      {delivery.metadata && Object.keys(delivery.metadata).length > 0 && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Metadata:
                          </span>
                          <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                            {JSON.stringify(delivery.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No deliveries found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No delivery information available for this alert.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertDeliverySystem;