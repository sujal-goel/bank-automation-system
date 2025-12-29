'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/auth/auth-store';
import { apiClient } from '@/lib/api/client';
import useNotifications from '@/hooks/useNotifications';
import ConfigurationManager from '@/components/admin/ConfigurationManager';

/**
 * Configuration Management Page
 * Secure interface for system parameter management with backup/restore
 * Requirements: 3.3
 */
export default function ConfigurationManagement() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { showError, showSuccess } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [configurations, setConfigurations] = useState({});
  const [backups, setBackups] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      const response = await apiClient.get('/api/admin/config');
      
      if (response.success) {
        setConfigurations(response.data.configurations || {});
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
      console.error('Failed to load configuration backups:', error);
    }
  };

  const handleConfigurationChange = (section, key, value) => {
    setConfigurations(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const saveConfigurations = async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.post('/api/admin/config', {
        configurations,
      });
      
      if (response.success) {
        setHasUnsavedChanges(false);
        showSuccess('Configuration Saved', 'System configuration has been updated successfully');
        
        // Reload configurations to get any server-side updates
        await loadConfigurations();
        await loadBackups(); // Refresh backups as a new one may have been created
      }
    } catch (error) {
      console.error('Failed to save configurations:', error);
      showError('Save Error', error.message || 'Failed to save configuration changes');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (description) => {
    try {
      const response = await apiClient.post('/api/admin/config/backup', {
        description,
      });
      
      if (response.success) {
        showSuccess('Backup Created', 'Configuration backup created successfully');
        await loadBackups();
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      showError('Backup Error', 'Failed to create configuration backup');
    }
  };

  const restoreBackup = async (backupId) => {
    try {
      const response = await apiClient.post(`/api/admin/config/restore/${backupId}`);
      
      if (response.success) {
        showSuccess('Configuration Restored', 'Configuration has been restored from backup');
        setHasUnsavedChanges(false);
        await loadConfigurations();
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      showError('Restore Error', 'Failed to restore configuration from backup');
    }
  };

  const resetToDefaults = async () => {
    try {
      const response = await apiClient.post('/api/admin/config/reset');
      
      if (response.success) {
        showSuccess('Configuration Reset', 'Configuration has been reset to default values');
        setHasUnsavedChanges(false);
        await loadConfigurations();
      }
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      showError('Reset Error', 'Failed to reset configuration to defaults');
    }
  };

  if (loading && Object.keys(configurations).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
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
              Manage system parameters, backup and restore configurations
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {hasUnsavedChanges && (
              <span className="text-sm text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                Unsaved Changes
              </span>
            )}
            
            <button
              onClick={saveConfigurations}
              disabled={!hasUnsavedChanges || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Configuration Manager Component */}
        <ConfigurationManager
          configurations={configurations}
          backups={backups}
          onConfigurationChange={handleConfigurationChange}
          onCreateBackup={createBackup}
          onRestoreBackup={restoreBackup}
          onResetToDefaults={resetToDefaults}
          loading={loading}
        />
      </div>
    </div>
  );
}