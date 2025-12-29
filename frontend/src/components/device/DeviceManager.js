/**
 * Device Manager Component
 * Displays and manages user's connected devices
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Wifi, 
  WifiOff, 
  Trash2, 
  ArrowRightLeft,
  Clock,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import useDeviceSync from '@/hooks/useDeviceSync';

export default function DeviceManager({ onTransferSession, className = '' }) {
  const {
    devices,
    deviceInfo,
    syncStatus,
    lastSyncTime,
    isConnected,
    getDevices,
    removeDevice,
    transferSession,
    currentDeviceId,
  } = useDeviceSync();

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatLastActive = (timestamp) => {
    const now = new Date();
    const lastActive = new Date(timestamp);
    const diffMs = now - lastActive;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleTransferSession = async (targetDeviceId) => {
    setIsTransferring(true);
    try {
      const success = await transferSession(targetDeviceId);
      if (success) {
        onTransferSession?.(targetDeviceId);
        // Show success message
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Session Transfer Initiated', {
            body: 'Your session is being transferred to the selected device.',
            icon: '/icons/icon-192x192.png',
          });
        }
      }
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    const success = await removeDevice(deviceId);
    if (success) {
      setShowConfirmDelete(null);
    }
  };

  const isCurrentDevice = (deviceId) => deviceId === currentDeviceId;
  const isDeviceOnline = (device) => {
    const lastActive = new Date(device.lastActive);
    const now = new Date();
    return (now - lastActive) < 300000; // 5 minutes
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Connected Devices
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage your devices and transfer sessions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <Wifi className="w-4 h-4 mr-1" />
                <span className="text-sm">Online</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="w-4 h-4 mr-1" />
                <span className="text-sm">Offline</span>
              </div>
            )}
            {lastSyncTime && (
              <div className="flex items-center text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  Last sync: {formatLastActive(lastSyncTime.getTime())}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {devices.length === 0 ? (
          <div className="text-center py-8">
            <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No devices found</p>
            <p className="text-sm text-gray-500 mt-1">
              Your devices will appear here when you sign in from other devices
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-4 border rounded-lg transition-colors ${
                  isCurrentDevice(device.id)
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {device.name}
                        </h4>
                        {isCurrentDevice(device.id) && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Current
                          </span>
                        )}
                        {isDeviceOnline(device) ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>{device.browser} on {device.os}</span>
                        <span className="mx-2">•</span>
                        <span>{formatLastActive(device.lastActive)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {device.screen.width}×{device.screen.height}
                        {device.screen.pixelRatio > 1 && 
                          ` @${device.screen.pixelRatio}x`
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isCurrentDevice(device.id) && isDeviceOnline(device) && (
                      <button
                        onClick={() => handleTransferSession(device.id)}
                        disabled={isTransferring}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Transfer session to this device"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    )}
                    
                    {!isCurrentDevice(device.id) && (
                      <button
                        onClick={() => setShowConfirmDelete(device.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {selectedDevice === device.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Device ID:</span>
                        <p className="text-gray-600 font-mono text-xs mt-1">
                          {device.id}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">User Agent:</span>
                        <p className="text-gray-600 text-xs mt-1 truncate">
                          {device.userAgent}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedDevice(
                    selectedDevice === device.id ? null : device.id,
                  )}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  {selectedDevice === device.id ? 'Hide details' : 'Show details'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Sync Status */}
        {syncStatus !== 'idle' && (
          <div className="mt-6 p-4 rounded-lg border">
            <div className="flex items-center space-x-2">
              {syncStatus === 'syncing' && (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-blue-600">Syncing devices...</span>
                </>
              )}
              {syncStatus === 'success' && (
                <>
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-600">Sync completed</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Sync failed</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Remove Device
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to remove this device? The device will need to 
              sign in again to access your account.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveDevice(showConfirmDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}