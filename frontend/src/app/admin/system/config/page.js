'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/auth/auth-store';
import { apiClient } from '@/lib/api/client';
import useNotifications from '@/hooks/useNotifications';

/**
 * Configuration Management Interface
 * Secure configuration interface with validation and backup/restore
 * Requirements: 3.3
 */
export default function ConfigurationManagement() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { showError, showSuccess, showWarning } = useNotifications();
  
  const [configurations, setConfigurations] = useState({});
  const [originalConfigurations, setOriginalConfigurations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  const [hasChanges, setHasChanges] = useState(false);
  const [backups, setBackups] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  const configSections = {
    system: {
      title: 'System Settings',
      icon: '⚙️',
      fields: [
        { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'boolean', description: 'Enable maintenance mode to prevent user access' },
        { key: 'max_login_attempts', label: 'Max Login Attempts', type: 'number', min: 1, max: 10, description: 'Maximum failed login attempts before account lockout' },
        { key: 'session_timeout', label: 'Session Timeout (minutes)', type: 'number', min: 5, max: 480, description: 'User session timeout in minutes' },
        { key: 'password_expiry_days', label: 'Password Expiry (days)', type: 'number', min: 30, max: 365, description: 'Days before password expires' },
        { key: 'backup_retention_days', label: 'Backup Retention (days)', type: 'number', min: 7, max: 365, description: 'Days to retain system backups' },
      ],
    },
    security: {
      title: 'Security Settings',
      icon: '🔒',
      fields: [
        { key: 'require_2fa', label: 'Require Two-Factor Authentication', type: 'boolean', description: 'Require 2FA for all user accounts' },
        { key: 'password_min_length', label: 'Minimum Password Length', type: 'number', min: 8, max: 32, description: 'Minimum required password length' },
        { key: 'password_require_special', label: 'Require Special Characters', type: 'boolean', description: 'Require special characters in passwords' },
        { key: 'ip_whitelist_enabled', label: 'IP Whitelist Enabled', type: 'boolean', description: 'Enable IP address whitelisting' },
        { key: 'audit_log_retention', label: 'Audit Log Retention (days)', type: 'number', min: 30, max: 2555, description: 'Days to retain audit logs' },
      ],
    },
    notifications: {
      title: 'Notification Settings',
      icon: '📧',
      fields: [
        { key: 'email_notifications_enabled', label: 'Email Notifications', type: 'boolean', description: 'Enable email notifications' },
        { key: 'sms_notifications_enabled', label: 'SMS Notifications', type: 'boolean', description: 'Enable SMS notifications' },
        { key: 'notification_retry_attempts', label: 'Retry Attempts', type: 'number', min: 1, max: 5, description: 'Number of retry attempts for failed notifications' },
        { key: 'notification_batch_size', label: 'Batch Size', type: 'number', min: 10, max: 1000, description: 'Number of notifications to process in batch' },
        { key: 'email_rate_limit', label: 'Email Rate Limit (per hour)', type: 'number', min: 10, max: 10000, description: 'Maximum emails per hour' },
      ],
    },
    api: {
      title: 'API Settings',
      icon: '🔌',
      fields: [
        { key: 'api_rate_limit', label: 'API Rate Limit (per minute)', type: 'number', min: 10, max: 10000, description: 'Maximum API requests per minute per user' },
        { key: 'api_timeout', label: 'API Timeout (seconds)', type: 'number', min: 5, max: 300, description: 'API request timeout in seconds' },
        { key: 'cors_enabled', label: 'CORS Enabled', type: 'boolean', description: 'Enable Cross-Origin Resource Sharing' },
        { key: 'api_versioning_enabled', label: 'API Versioning', type: 'boolean', description: 'Enable API versioning support' },
        { key: 'webhook_timeout', label: 'Webhook Timeout (seconds)', type: 'number', min: 5, max: 60, description: 'Webhook request timeout' },
      ],
    },
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !['admin', 'super_admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    loadConfigurations();
    loadBackups();
  }, [isAuthenticated, user, router]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/config');
      
      if (response.success) {
        setConfigurations(response.data.config);
        setOriginalConfigurations(response.data.config);
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
      showError('Configuration Error', 'Failed to load system configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await apiClient.get('/api/admin/config/backups');
      
      if (response.success) {
        setBackups(response.data.backups || []);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const handleConfigChange = (key, value) => {
    const newConfigurations = { ...configurations, [key]: value };
    setConfigurations(newConfigurations);
    
    // Check if there are changes
    const hasChanges = JSON.stringify(newConfigurations) !== JSON.stringify(originalConfigurations);
    setHasChanges(hasChanges);
  };

  const validateConfiguration = (key, value, field) => {
    if (field.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) return 'Must be a valid number';
      if (field.min !== undefined && numValue < field.min) return `Must be at least ${field.min}`;
      if (field.max !== undefined && numValue > field.max) return `Must be at most ${field.max}`;
    }
    
    if (field.required && (value === undefined || value === null || value === '')) {
      return 'This field is required';
    }
    
    return null;
  };

  const saveConfigurations = async () => {
    try {
      setSaving(true);
      
      // Validate all configurations
      const errors = [];
      Object.entries(configSections).forEach(([sectionKey, section]) => {
        section.fields.forEach(field => {
          const error = validateConfiguration(field.key, configurations[field.key], field);
          if (error) {
            errors.push(`${field.label}: ${error}`);
          }
        });
      });
      
      if (errors.length > 0) {
        showError('Validation Error', errors.join('\n'));
        return;
      }
      
      const response = await apiClient.post('/api/admin/config', {
        config: configurations,
      });
      
      if (response.success) {
        setOriginalConfigurations(configurations);
        setHasChanges(false);
        showSuccess('Configuration Saved', 'System configuration has been updated successfully');
        
        // Reload backups to show the new backup
        loadBackups();
      }
    } catch (error) {
      console.error('Failed to save configurations:', error);
      showError('Save Error', 'Failed to save system configurations');
    } finally {
      setSaving(false);
    }
  };

  const resetConfigurations = () => {
    setConfigurations(originalConfigurations);
    setHasChanges(false);
    showSuccess('Reset Complete', 'Configuration changes have been reset');
  };

  const createBackup = async () => {
    try {
      const response = await apiClient.post('/api/admin/config/backup', {
        description: `Manual backup - ${new Date().toLocaleString()}`,
      });
      
      if (response.success) {
        showSuccess('Backup Created', 'Configuration backup created successfully');
        loadBackups();
        setShowBackupModal(false);
      }
    } catch (error) {
      showError('Backup Error', 'Failed to create configuration backup');
    }
  };

  const restoreBackup = async (backupId) => {
    try {
      const response = await apiClient.post(`/api/admin/config/restore/${backupId}`);
      
      if (response.success) {
        showSuccess('Restore Complete', 'Configuration has been restored from backup');
        loadConfigurations();
        setShowRestoreModal(false);
        setSelectedBackup(null);
      }
    } catch (error) {
      showError('Restore Error', 'Failed to restore configuration from backup');
    }
  };

  const renderField = (field) => {
    const value = configurations[field.key];
    
    switch (field.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleConfigChange(field.key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        );
      
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="number"
              value={value || ''}
              min={field.min}
              max={field.max}
              onChange={(e) => handleConfigChange(field.key, parseInt(e.target.value) || 0)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );
      
      case 'text':
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleConfigChange(field.key, e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuration Management</h1>
            <p className="mt-2 text-gray-600">
              Manage system settings and configuration parameters
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowBackupModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Create Backup
            </button>
            
            <button
              onClick={() => setShowRestoreModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Restore Backup
            </button>
            
            {hasChanges && (
              <>
                <button
                  onClick={resetConfigurations}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Reset Changes
                </button>
                
                <button
                  onClick={saveConfigurations}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Configuration Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {Object.entries(configSections).map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {configSections[activeTab].title}
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {configSections[activeTab].fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  {renderField(field)}
                  {field.description && (
                    <p className="text-xs text-gray-500">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Backup Modal */}
        {showBackupModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowBackupModal(false)} />
              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Configuration Backup</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    This will create a backup of the current system configuration that can be restored later.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowBackupModal(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createBackup}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restore Modal */}
        {showRestoreModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowRestoreModal(false)} />
              <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Restore Configuration Backup</h3>
                  
                  {backups.length === 0 ? (
                    <p className="text-sm text-gray-600 mb-6">No configuration backups available.</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        Select a backup to restore. This will overwrite the current configuration.
                      </p>
                      
                      <div className="max-h-64 overflow-y-auto mb-6">
                        <div className="space-y-2">
                          {backups.map((backup) => (
                            <div
                              key={backup.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedBackup?.id === backup.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedBackup(backup)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {backup.description || `Backup ${backup.id}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Created: {new Date(backup.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {backup.size ? `${(backup.size / 1024).toFixed(1)} KB` : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowRestoreModal(false);
                        setSelectedBackup(null);
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    {selectedBackup && (
                      <button
                        onClick={() => restoreBackup(selectedBackup.id)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        Restore Backup
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}