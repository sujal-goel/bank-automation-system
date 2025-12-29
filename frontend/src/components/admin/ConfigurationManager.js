'use client';

import { useState } from 'react';
import { 
  CogIcon, 
  ShieldCheckIcon, 
  CircleStackIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/**
 * Configuration Manager Component
 * Secure interface for system parameter management with backup/restore
 * Requirements: 3.3
 */
export default function ConfigurationManager({
  configurations,
  backups,
  onConfigurationChange,
  onCreateBackup,
  onRestoreBackup,
  onResetToDefaults,
  loading,
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupDescription, setBackupDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Configuration sections with their settings
  const configSections = {
    general: {
      title: 'General Settings',
      icon: CogIcon,
      description: 'Basic system configuration parameters',
      settings: {
        app_name: {
          label: 'Application Name',
          type: 'text',
          description: 'Display name for the application',
          validation: { required: true, minLength: 3, maxLength: 50 },
        },
        app_version: {
          label: 'Application Version',
          type: 'text',
          description: 'Current application version',
          validation: { required: true, pattern: /^\d+\.\d+\.\d+$/ },
        },
        maintenance_mode: {
          label: 'Maintenance Mode',
          type: 'boolean',
          description: 'Enable maintenance mode to restrict access',
        },
        max_file_size: {
          label: 'Maximum File Size (MB)',
          type: 'number',
          description: 'Maximum allowed file upload size',
          validation: { required: true, min: 1, max: 100 },
        },
        session_timeout: {
          label: 'Session Timeout (minutes)',
          type: 'number',
          description: 'User session timeout duration',
          validation: { required: true, min: 5, max: 1440 },
        },
      },
    },
    security: {
      title: 'Security Settings',
      icon: ShieldCheckIcon,
      description: 'Authentication and security parameters',
      settings: {
        password_min_length: {
          label: 'Minimum Password Length',
          type: 'number',
          description: 'Minimum required password length',
          validation: { required: true, min: 6, max: 32 },
        },
        password_require_uppercase: {
          label: 'Require Uppercase',
          type: 'boolean',
          description: 'Require at least one uppercase letter',
        },
        password_require_lowercase: {
          label: 'Require Lowercase',
          type: 'boolean',
          description: 'Require at least one lowercase letter',
        },
        password_require_numbers: {
          label: 'Require Numbers',
          type: 'boolean',
          description: 'Require at least one number',
        },
        password_require_symbols: {
          label: 'Require Symbols',
          type: 'boolean',
          description: 'Require at least one special character',
        },
        max_login_attempts: {
          label: 'Max Login Attempts',
          type: 'number',
          description: 'Maximum failed login attempts before lockout',
          validation: { required: true, min: 3, max: 10 },
        },
        lockout_duration: {
          label: 'Lockout Duration (minutes)',
          type: 'number',
          description: 'Account lockout duration after max attempts',
          validation: { required: true, min: 5, max: 60 },
        },
        two_factor_required: {
          label: 'Require Two-Factor Authentication',
          type: 'boolean',
          description: 'Require 2FA for all user accounts',
        },
      },
    },
    database: {
      title: 'Database Settings',
      icon: CircleStackIcon,
      description: 'Database connection and performance settings',
      settings: {
        connection_pool_size: {
          label: 'Connection Pool Size',
          type: 'number',
          description: 'Maximum database connection pool size',
          validation: { required: true, min: 5, max: 100 },
        },
        query_timeout: {
          label: 'Query Timeout (seconds)',
          type: 'number',
          description: 'Database query timeout duration',
          validation: { required: true, min: 10, max: 300 },
        },
        backup_retention_days: {
          label: 'Backup Retention (days)',
          type: 'number',
          description: 'Number of days to retain database backups',
          validation: { required: true, min: 7, max: 365 },
        },
        auto_backup_enabled: {
          label: 'Enable Automatic Backups',
          type: 'boolean',
          description: 'Automatically create daily database backups',
        },
        backup_time: {
          label: 'Backup Time',
          type: 'time',
          description: 'Daily backup execution time (24-hour format)',
          validation: { required: true },
        },
      },
    },
    notifications: {
      title: 'Notification Settings',
      icon: DocumentDuplicateIcon,
      description: 'Email and notification configuration',
      settings: {
        smtp_host: {
          label: 'SMTP Host',
          type: 'text',
          description: 'SMTP server hostname',
          validation: { required: true },
        },
        smtp_port: {
          label: 'SMTP Port',
          type: 'number',
          description: 'SMTP server port number',
          validation: { required: true, min: 1, max: 65535 },
        },
        smtp_username: {
          label: 'SMTP Username',
          type: 'text',
          description: 'SMTP authentication username',
        },
        smtp_password: {
          label: 'SMTP Password',
          type: 'password',
          description: 'SMTP authentication password',
        },
        smtp_encryption: {
          label: 'SMTP Encryption',
          type: 'select',
          options: [
            { value: 'none', label: 'None' },
            { value: 'tls', label: 'TLS' },
            { value: 'ssl', label: 'SSL' },
          ],
          description: 'SMTP encryption method',
        },
        from_email: {
          label: 'From Email Address',
          type: 'email',
          description: 'Default sender email address',
          validation: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        },
        from_name: {
          label: 'From Name',
          type: 'text',
          description: 'Default sender name',
          validation: { required: true },
        },
        notification_enabled: {
          label: 'Enable Notifications',
          type: 'boolean',
          description: 'Enable email notifications system-wide',
        },
      },
    },
  };

  // Validate configuration value
  const validateValue = (section, key, value) => {
    const setting = configSections[section]?.settings[key];
    if (!setting?.validation) return null;

    const validation = setting.validation;
    const errors = [];

    if (validation.required && (!value || value === '')) {
      errors.push('This field is required');
    }

    if (value && validation.minLength && value.length < validation.minLength) {
      errors.push(`Minimum length is ${validation.minLength} characters`);
    }

    if (value && validation.maxLength && value.length > validation.maxLength) {
      errors.push(`Maximum length is ${validation.maxLength} characters`);
    }

    if (value && validation.min && Number(value) < validation.min) {
      errors.push(`Minimum value is ${validation.min}`);
    }

    if (value && validation.max && Number(value) > validation.max) {
      errors.push(`Maximum value is ${validation.max}`);
    }

    if (value && validation.pattern && !validation.pattern.test(value)) {
      errors.push('Invalid format');
    }

    return errors.length > 0 ? errors : null;
  };

  // Handle configuration change with validation
  const handleConfigChange = (section, key, value) => {
    const errors = validateValue(section, key, value);
    
    setValidationErrors(prev => ({
      ...prev,
      [`${section}.${key}`]: errors,
    }));

    onConfigurationChange(section, key, value);
  };

  // Filter configurations based on search term
  const filteredSections = Object.entries(configSections).filter(([sectionKey, section]) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      section.title.toLowerCase().includes(searchLower) ||
      section.description.toLowerCase().includes(searchLower) ||
      Object.entries(section.settings).some(([key, setting]) =>
        setting.label.toLowerCase().includes(searchLower) ||
        setting.description.toLowerCase().includes(searchLower),
      )
    );
  });

  // Render configuration input field
  const renderConfigField = (section, key, setting) => {
    const value = configurations[section]?.[key] ?? '';
    const fieldKey = `${section}.${key}`;
    const errors = validationErrors[fieldKey];
    const hasError = errors && errors.length > 0;

    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
      hasError 
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }`;

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={fieldKey}
              checked={value === true || value === 'true'}
              onChange={(e) => handleConfigChange(section, key, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={fieldKey} className="ml-2 text-sm text-gray-700">
              {setting.label}
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            id={fieldKey}
            value={value}
            onChange={(e) => handleConfigChange(section, key, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select an option</option>
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            id={fieldKey}
            value={value}
            onChange={(e) => handleConfigChange(section, key, e.target.value)}
            className={baseClasses}
            min={setting.validation?.min}
            max={setting.validation?.max}
          />
        );

      case 'password':
        return (
          <input
            type="password"
            id={fieldKey}
            value={value}
            onChange={(e) => handleConfigChange(section, key, e.target.value)}
            className={baseClasses}
            placeholder="••••••••"
          />
        );

      case 'email':
        return (
          <input
            type="email"
            id={fieldKey}
            value={value}
            onChange={(e) => handleConfigChange(section, key, e.target.value)}
            className={baseClasses}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            id={fieldKey}
            value={value}
            onChange={(e) => handleConfigChange(section, key, e.target.value)}
            className={baseClasses}
          />
        );

      default:
        return (
          <input
            type="text"
            id={fieldKey}
            value={value}
            onChange={(e) => handleConfigChange(section, key, e.target.value)}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with search and actions */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search configuration settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBackupDialog(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              <span>Create Backup</span>
            </button>
            
            <button
              onClick={() => setShowRestoreDialog(true)}
              disabled={backups.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Restore</span>
            </button>
            
            <button
              onClick={() => setShowResetDialog(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Configuration sections">
          {filteredSections.map(([sectionKey, section]) => {
            const Icon = section.icon;
            const isActive = activeTab === sectionKey;
            
            return (
              <button
                key={sectionKey}
                onClick={() => setActiveTab(sectionKey)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{section.title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Configuration content */}
      <div className="p-6">
        {filteredSections.map(([sectionKey, section]) => {
          if (activeTab !== sectionKey) return null;
          
          return (
            <div key={sectionKey}>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{section.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(section.settings).map(([key, setting]) => {
                  const fieldKey = `${sectionKey}.${key}`;
                  const errors = validationErrors[fieldKey];
                  const hasError = errors && errors.length > 0;
                  
                  return (
                    <div key={key} className="space-y-2">
                      {setting.type !== 'boolean' && (
                        <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700">
                          {setting.label}
                          {setting.validation?.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                      )}
                      
                      {renderConfigField(sectionKey, key, setting)}
                      
                      {setting.description && setting.type !== 'boolean' && (
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      )}
                      
                      {hasError && (
                        <div className="text-xs text-red-600">
                          {errors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Backup Dialog */}
      {showBackupDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Configuration Backup</h3>
              <button
                onClick={() => setShowBackupDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="backup-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  id="backup-description"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Enter backup description..."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBackupDialog(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onCreateBackup(backupDescription);
                    setBackupDescription('');
                    setShowBackupDialog(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Dialog */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Restore Configuration</h3>
              <button
                onClick={() => setShowRestoreDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select a backup to restore. This will overwrite current configuration settings.
              </p>
              
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {backups.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No backups available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <div
                        key={backup.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedBackup?.id === backup.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setSelectedBackup(backup)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{backup.description}</p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(backup.created_at).toLocaleString()}
                            </p>
                          </div>
                          {selectedBackup?.id === backup.id && (
                            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRestoreDialog(false);
                    setSelectedBackup(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedBackup) {
                      onRestoreBackup(selectedBackup.id);
                      setShowRestoreDialog(false);
                      setSelectedBackup(null);
                    }
                  }}
                  disabled={!selectedBackup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Restore Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reset to Defaults</h3>
              <button
                onClick={() => setShowResetDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 font-medium">
                    This action cannot be undone
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    All configuration settings will be reset to their default values. 
                    Consider creating a backup before proceeding.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResetDialog(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onResetToDefaults();
                    setShowResetDialog(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}