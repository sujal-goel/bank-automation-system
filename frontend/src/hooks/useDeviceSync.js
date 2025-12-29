/**
 * Cross-Device Synchronization Hook
 * Manages session continuity and data sync across devices
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import useWebSocket from './useWebSocket';

export default function useDeviceSync() {
  const [devices, setDevices] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, success
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  
  const { user, token } = useAuthStore();
  const syncIntervalRef = useRef(null);
  const deviceIdRef = useRef(null);

  // WebSocket for real-time sync
  const { 
    isConnected, 
    sendMessage, 
    lastMessage,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket, 
  } = useWebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/device-sync`);

  // Generate or retrieve device ID
  useEffect(() => {
    const getDeviceId = () => {
      let deviceId = localStorage.getItem('device-id');
      if (!deviceId) {
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('device-id', deviceId);
      }
      return deviceId;
    };

    const getDeviceInfo = () => {
      const info = {
        id: getDeviceId(),
        name: getDeviceName(),
        type: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOSInfo(),
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          pixelRatio: window.devicePixelRatio || 1,
        },
        lastActive: Date.now(),
        userAgent: navigator.userAgent,
      };
      
      setDeviceInfo(info);
      deviceIdRef.current = info.id;
      return info;
    };

    getDeviceInfo();
  }, []);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (user && token && deviceInfo) {
      connectWebSocket({
        headers: {
          Authorization: `Bearer ${token}`,
          'Device-ID': deviceInfo.id,
        },
      });
      
      // Register device
      registerDevice();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, token, deviceInfo, connectWebSocket, disconnectWebSocket]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      handleSyncMessage(lastMessage);
    }
  }, [lastMessage]);

  // Set up periodic sync
  useEffect(() => {
    if (user && token) {
      // Sync every 30 seconds
      syncIntervalRef.current = setInterval(() => {
        syncDeviceData();
      }, 30000);

      // Initial sync
      syncDeviceData();
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [user, token]);

  // Register device with server
  const registerDevice = useCallback(async () => {
    if (!deviceInfo || !token) return;

    try {
      const response = await fetch('/api/devices/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deviceInfo),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Device registered:', data);
      }
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  }, [deviceInfo, token]);

  // Get list of user's devices
  const getDevices = useCallback(async () => {
    if (!token) return [];

    try {
      const response = await fetch('/api/devices', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        return data.devices;
      }
    } catch (error) {
      console.error('Failed to get devices:', error);
    }

    return [];
  }, [token]);

  // Sync device data
  const syncDeviceData = useCallback(async () => {
    if (!deviceInfo || !token || syncStatus === 'syncing') return;

    setSyncStatus('syncing');

    try {
      // Get local data to sync
      const localData = {
        formData: getLocalFormData(),
        preferences: getLocalPreferences(),
        sessionData: getLocalSessionData(),
        timestamp: Date.now(),
      };

      const response = await fetch('/api/devices/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Device-ID': deviceInfo.id,
        },
        body: JSON.stringify({
          deviceId: deviceInfo.id,
          data: localData,
        }),
      });

      if (response.ok) {
        const syncData = await response.json();
        
        // Handle sync response
        if (syncData.conflicts) {
          setConflictData(syncData.conflicts);
          setSyncStatus('error');
        } else {
          // Apply synced data
          if (syncData.data) {
            await applySyncedData(syncData.data);
          }
          
          setSyncStatus('success');
          setLastSyncTime(new Date());
          
          // Clear success status after 3 seconds
          setTimeout(() => {
            setSyncStatus('idle');
          }, 3000);
        }
      } else {
        throw new Error('Sync request failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 5000);
    }
  }, [deviceInfo, token, syncStatus]);

  // Handle WebSocket sync messages
  const handleSyncMessage = useCallback(async (message) => {
    const data = JSON.parse(message.data);
    
    switch (data.type) {
      case 'device-connected':
        console.log('Device connected:', data.device);
        await getDevices();
        break;
        
      case 'device-disconnected':
        console.log('Device disconnected:', data.deviceId);
        await getDevices();
        break;
        
      case 'data-updated':
        console.log('Data updated from another device');
        await applySyncedData(data.data);
        break;
        
      case 'session-transferred':
        console.log('Session transferred from another device');
        handleSessionTransfer(data);
        break;
        
      default:
        console.log('Unknown sync message:', data);
    }
  }, []);

  // Transfer session to another device
  const transferSession = useCallback(async (targetDeviceId) => {
    if (!deviceInfo || !token) return false;

    try {
      const sessionData = {
        currentPath: window.location.pathname,
        formData: getLocalFormData(),
        preferences: getLocalPreferences(),
        timestamp: Date.now(),
      };

      const response = await fetch('/api/devices/transfer-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Device-ID': deviceInfo.id,
        },
        body: JSON.stringify({
          sourceDeviceId: deviceInfo.id,
          targetDeviceId,
          sessionData,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Session transfer failed:', error);
      return false;
    }
  }, [deviceInfo, token]);

  // Handle incoming session transfer
  const handleSessionTransfer = useCallback((transferData) => {
    const { sessionData } = transferData;
    
    // Apply session data
    if (sessionData.formData) {
      applyFormData(sessionData.formData);
    }
    
    if (sessionData.preferences) {
      applyPreferences(sessionData.preferences);
    }
    
    // Navigate to the same path
    if (sessionData.currentPath && sessionData.currentPath !== window.location.pathname) {
      window.location.href = sessionData.currentPath;
    }
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Transferred', {
        body: 'Your session has been transferred from another device.',
        icon: '/icons/icon-192x192.png',
      });
    }
  }, []);

  // Resolve sync conflicts
  const resolveConflict = useCallback(async (conflictId, resolution) => {
    if (!token) return false;

    try {
      const response = await fetch('/api/devices/resolve-conflict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conflictId,
          resolution, // 'local', 'remote', or 'merge'
        }),
      });

      if (response.ok) {
        setConflictData(null);
        setSyncStatus('idle');
        return true;
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }

    return false;
  }, [token]);

  // Remove device
  const removeDevice = useCallback(async (deviceId) => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await getDevices();
        return true;
      }
    } catch (error) {
      console.error('Failed to remove device:', error);
    }

    return false;
  }, [token, getDevices]);

  // Utility functions
  const getLocalFormData = () => {
    const formData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('form_')) {
        try {
          formData[key] = JSON.parse(localStorage.getItem(key));
        } catch (error) {
          console.error('Error parsing form data:', error);
        }
      }
    }
    return formData;
  };

  const getLocalPreferences = () => {
    try {
      return JSON.parse(localStorage.getItem('user-preferences') || '{}');
    } catch (error) {
      return {};
    }
  };

  const getLocalSessionData = () => {
    return {
      currentPath: window.location.pathname,
      timestamp: Date.now(),
    };
  };

  const applySyncedData = async (data) => {
    if (data.formData) {
      applyFormData(data.formData);
    }
    
    if (data.preferences) {
      applyPreferences(data.preferences);
    }
  };

  const applyFormData = (formData) => {
    Object.entries(formData).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  };

  const applyPreferences = (preferences) => {
    localStorage.setItem('user-preferences', JSON.stringify(preferences));
  };

  // Device detection utilities
  const getDeviceName = () => {
    const userAgent = navigator.userAgent;
    
    if (/iPhone/.test(userAgent)) return 'iPhone';
    if (/iPad/.test(userAgent)) return 'iPad';
    if (/Android/.test(userAgent)) return 'Android Device';
    if (/Windows/.test(userAgent)) return 'Windows PC';
    if (/Mac/.test(userAgent)) return 'Mac';
    if (/Linux/.test(userAgent)) return 'Linux PC';
    
    return 'Unknown Device';
  };

  const getDeviceType = () => {
    const userAgent = navigator.userAgent;
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/.test(userAgent)) return 'tablet';
    
    return 'desktop';
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    
    return 'Unknown';
  };

  const getOSInfo = () => {
    const userAgent = navigator.userAgent;
    
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iOS/.test(userAgent)) return 'iOS';
    
    return 'Unknown';
  };

  return {
    // State
    devices,
    syncStatus,
    lastSyncTime,
    conflictData,
    deviceInfo,
    isConnected,
    
    // Actions
    syncDeviceData,
    transferSession,
    resolveConflict,
    removeDevice,
    getDevices,
    
    // Utilities
    currentDeviceId: deviceIdRef.current,
    isSyncing: syncStatus === 'syncing',
    hasConflicts: !!conflictData,
    isOnline: isConnected,
  };
}