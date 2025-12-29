/**
 * Threshold Configuration Modal Component
 * Allows creating and editing alert thresholds
 */
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} ThresholdFormData
 * @property {string} name - Threshold name
 * @property {string} metric - Metric to monitor
 * @property {'above'|'below'} condition - Threshold condition
 * @property {number} value - Threshold value
 * @property {'critical'|'warning'|'info'} severity - Alert severity
 * @property {boolean} enabled - Whether threshold is active
 * @property {string[]} channels - Delivery channels (email, sms, in-app)
 * @property {string[]} recipients - Email/SMS recipients
 * @property {number} cooldown - Cooldown period in minutes
 * @property {string} description - Optional description
 */

/**
 * Available metrics for threshold configuration
 */
const AVAILABLE_METRICS = [
  { value: 'cpu_usage', label: 'CPU Usage (%)', unit: '%' },
  { value: 'memory_usage', label: 'Memory Usage (%)', unit: '%' },
  { value: 'disk_usage', label: 'Disk Usage (%)', unit: '%' },
  { value: 'response_time', label: 'Response Time', unit: 'ms' },
  { value: 'error_rate', label: 'Error Rate (%)', unit: '%' },
  { value: 'active_users', label: 'Active Users', unit: 'users' },
  { value: 'transaction_volume', label: 'Transaction Volume', unit: 'txns/min' },
  { value: 'queue_length', label: 'Queue Length', unit: 'items' },
  { value: 'database_connections', label: 'Database Connections', unit: 'connections' },
  { value: 'api_requests', label: 'API Requests', unit: 'req/min' },
];

/**
 * Threshold Configuration Modal Component
 */
const ThresholdConfigModal = ({ isOpen, onClose, threshold = null, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    metric: '',
    condition: 'above',
    value: 0,
    severity: 'warning',
    enabled: true,
    channels: ['in-app'],
    recipients: [],
    cooldown: 15,
    description: '',
  });

  const [newRecipient, setNewRecipient] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // Initialize form data when threshold prop changes
  useEffect(() => {
    if (threshold) {
      setFormData({
        name: threshold.name || '',
        metric: threshold.metric || '',
        condition: threshold.condition || 'above',
        value: threshold.value || 0,
        severity: threshold.severity || 'warning',
        enabled: threshold.enabled !== undefined ? threshold.enabled : true,
        channels: threshold.channels || ['in-app'],
        recipients: threshold.recipients || [],
        cooldown: threshold.cooldown || 15,
        description: threshold.description || '',
      });
    } else {
      // Reset form for new threshold
      setFormData({
        name: '',
        metric: '',
        condition: 'above',
        value: 0,
        severity: 'warning',
        enabled: true,
        channels: ['in-app'],
        recipients: [],
        cooldown: 15,
        description: '',
      });
    }
    setErrors({});
    setNewRecipient('');
  }, [threshold, isOpen]);

  // Create/Update threshold mutation
  const saveThresholdMutation = useMutation({
    mutationFn: async (data) => {
      const endpoint = threshold 
        ? `/api/analytics/alert-thresholds/${threshold.id}`
        : '/api/analytics/alert-thresholds';
      
      return apiClient.request(endpoint, {
        method: threshold ? 'PUT' : 'POST',
        body: data,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['alert-thresholds']);
      onSave?.(data);
      onClose();
    },
    onError: (error) => {
      console.error('Failed to save threshold:', error);
      setErrors({ submit: error.message });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Threshold name is required';
    }

    if (!formData.metric) {
      newErrors.metric = 'Metric selection is required';
    }

    if (formData.value === '' || formData.value < 0) {
      newErrors.value = 'Threshold value must be a positive number';
    }

    if (formData.cooldown < 1 || formData.cooldown > 1440) {
      newErrors.cooldown = 'Cooldown must be between 1 and 1440 minutes';
    }

    if (formData.channels.length === 0) {
      newErrors.channels = 'At least one delivery channel must be selected';
    }

    if ((formData.channels.includes('email') || formData.channels.includes('sms')) && formData.recipients.length === 0) {
      newErrors.recipients = 'Recipients are required for email/SMS channels';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    saveThresholdMutation.mutate(formData);
  };

  const handleChannelToggle = (channel) => {
    const newChannels = formData.channels.includes(channel)
      ? formData.channels.filter(c => c !== channel)
      : [...formData.channels, channel];
    
    setFormData({ ...formData, channels: newChannels });
  };

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !formData.recipients.includes(newRecipient.trim())) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, newRecipient.trim()],
      });
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (recipient) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter(r => r !== recipient),
    });
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email':
        return <EnvelopeIcon className="h-4 w-4" />;
      case 'sms':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'in-app':
        return <BellIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {threshold ? 'Edit Alert Threshold' : 'Create Alert Threshold'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Basic Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Threshold Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="e.g., High CPU Usage"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Metric *
                  </label>
                  <select
                    value={formData.metric}
                    onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.metric 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  >
                    <option value="">Select a metric</option>
                    {AVAILABLE_METRICS.map(metric => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                  {errors.metric && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.metric}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optional description for this threshold"
                />
              </div>
            </div>

            {/* Threshold Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Threshold Configuration
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condition *
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value *
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.value 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                  {errors.value && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.value}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cooldown Period (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.cooldown}
                  onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) || 15 })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cooldown 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="15"
                  min="1"
                  max="1440"
                />
                {errors.cooldown && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cooldown}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum time between alerts for the same threshold
                </p>
              </div>
            </div>

            {/* Delivery Channels */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Delivery Channels
              </h4>
              
              <div className="space-y-3">
                {['in-app', 'email', 'sms'].map(channel => (
                  <label key={channel} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(channel)}
                      onChange={() => handleChannelToggle(channel)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(channel)}
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {channel === 'in-app' ? 'In-App Notification' : channel.toUpperCase()}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              
              {errors.channels && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.channels}</p>
              )}
            </div>

            {/* Recipients */}
            {(formData.channels.includes('email') || formData.channels.includes('sms')) && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Recipients
                </h4>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter email or phone number"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
                  />
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                {formData.recipients.length > 0 && (
                  <div className="space-y-2">
                    {formData.recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{recipient}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(recipient)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.recipients && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.recipients}</p>
                )}
              </div>
            )}

            {/* Status */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Status
              </h4>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable this threshold
                </span>
              </label>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (threshold ? 'Update Threshold' : 'Create Threshold')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ThresholdConfigModal;