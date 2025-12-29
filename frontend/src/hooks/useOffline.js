/**
 * Offline Detection and Management Hook
 * Provides offline status, queue management, and sync capabilities
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, queueBackgroundSync, getNetworkStatus } from '@/lib/serviceWorker';

export default function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [queuedForms, setQueuedForms] = useState([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Initialize online status and network info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setNetworkStatus(getNetworkStatus());
      loadQueuedForms();
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkStatus(getNetworkStatus());
      syncQueuedData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkStatus(getNetworkStatus());
    };

    const handleConnectionChange = () => {
      setNetworkStatus(getNetworkStatus());
    };

    // Listen for service worker sync events
    const handleSyncSuccess = (event) => {
      console.log('Sync successful:', event.detail);
      loadQueuedForms();
      setLastSyncTime(new Date());
    };

    const handleSyncError = (event) => {
      console.error('Sync failed:', event.detail);
      setSyncInProgress(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('sw-sync-success', handleSyncSuccess);
      window.addEventListener('sw-sync-error', handleSyncError);
      
      // Listen for connection changes
      if (navigator.connection) {
        navigator.connection.addEventListener('change', handleConnectionChange);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('sw-sync-success', handleSyncSuccess);
        window.removeEventListener('sw-sync-error', handleSyncError);
        
        if (navigator.connection) {
          navigator.connection.removeEventListener('change', handleConnectionChange);
        }
      }
    };
  }, []);

  // Load queued forms from storage
  const loadQueuedForms = useCallback(() => {
    const forms = offlineStorage.getStoredForms();
    setQueuedForms(forms);
  }, []);

  // Queue form data for offline submission
  const queueFormData = useCallback(async (formId, data) => {
    try {
      const key = await offlineStorage.storeFormData(formId, data);
      loadQueuedForms();
      
      // Try to sync immediately if online
      if (isOnline) {
        await syncQueuedData();
      }
      
      return key;
    } catch (error) {
      console.error('Failed to queue form data:', error);
      throw error;
    }
  }, [isOnline, loadQueuedForms]);

  // Sync queued data when connection is restored
  const syncQueuedData = useCallback(async () => {
    if (!isOnline || syncInProgress) {
      return;
    }

    setSyncInProgress(true);

    try {
      const forms = offlineStorage.getStoredForms();
      const unsyncedForms = forms.filter(form => !form.synced);

      for (const form of unsyncedForms) {
        try {
          // Attempt to submit the form
          const response = await fetch('/api/forms/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              formId: form.formId,
              data: form.data,
              timestamp: form.timestamp,
            }),
          });

          if (response.ok) {
            offlineStorage.markFormSynced(form.key);
            console.log('Form synced successfully:', form.formId);
          } else {
            console.error('Failed to sync form:', form.formId, response.status);
          }
        } catch (error) {
          console.error('Error syncing form:', form.formId, error);
        }
      }

      // Clean up synced forms
      const cleanedCount = offlineStorage.clearSyncedForms();
      console.log(`Cleaned up ${cleanedCount} synced forms`);

      loadQueuedForms();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, syncInProgress, loadQueuedForms]);

  // Manual retry sync
  const retrySyncData = useCallback(async () => {
    if (isOnline && !syncInProgress) {
      await syncQueuedData();
    }
  }, [isOnline, syncInProgress, syncQueuedData]);

  // Clear all queued data
  const clearQueuedData = useCallback(() => {
    const forms = offlineStorage.getStoredForms();
    forms.forEach(form => {
      localStorage.removeItem(form.key);
    });
    loadQueuedForms();
  }, [loadQueuedForms]);

  // Get connection quality
  const getConnectionQuality = useCallback(() => {
    if (!networkStatus || !networkStatus.connection) {
      return 'unknown';
    }

    const { effectiveType, downlink, rtt } = networkStatus.connection;
    
    if (effectiveType === '4g' && downlink > 1.5 && rtt < 150) {
      return 'excellent';
    } else if (effectiveType === '4g' || (downlink > 0.5 && rtt < 300)) {
      return 'good';
    } else if (effectiveType === '3g' || (downlink > 0.1 && rtt < 500)) {
      return 'fair';
    } else {
      return 'poor';
    }
  }, [networkStatus]);

  // Check if feature should be disabled due to poor connection
  const shouldDisableFeature = useCallback((feature) => {
    if (!isOnline) return true;
    
    const quality = getConnectionQuality();
    
    const featureRequirements = {
      'real-time': ['excellent', 'good'],
      'file-upload': ['excellent', 'good', 'fair'],
      'basic': ['excellent', 'good', 'fair', 'poor'],
    };

    return !featureRequirements[feature]?.includes(quality);
  }, [isOnline, getConnectionQuality]);

  // Estimate data usage for an operation
  const estimateDataUsage = useCallback((operation) => {
    const estimates = {
      'login': 5, // KB
      'form-submit': 10,
      'document-upload': 500,
      'dashboard-load': 50,
      'transaction-list': 25,
    };

    return estimates[operation] || 10;
  }, []);

  return {
    // Status
    isOnline,
    networkStatus,
    connectionQuality: getConnectionQuality(),
    
    // Queue management
    queuedForms,
    queuedCount: queuedForms.filter(form => !form.synced).length,
    
    // Sync status
    syncInProgress,
    lastSyncTime,
    
    // Actions
    queueFormData,
    syncQueuedData,
    retrySyncData,
    clearQueuedData,
    
    // Utilities
    shouldDisableFeature,
    estimateDataUsage,
    
    // Helpers
    isSlowConnection: getConnectionQuality() === 'poor',
    isGoodConnection: ['excellent', 'good'].includes(getConnectionQuality()),
  };
}