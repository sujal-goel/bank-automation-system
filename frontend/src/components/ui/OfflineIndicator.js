/**
 * Offline Indicator Component
 * Shows connection status and queued actions
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import useOffline from '@/hooks/useOffline';
import ResponsiveButton from './ResponsiveButton';

export default function OfflineIndicator({ className, showDetails = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isOnline,
    connectionQuality,
    queuedCount,
    syncInProgress,
    lastSyncTime,
    retrySyncData,
    clearQueuedData,
    isSlowConnection,
  } = useOffline();

  // Don't show indicator if online and no queued items
  if (isOnline && queuedCount === 0 && !showDetails) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (queuedCount > 0) return 'bg-yellow-500';
    if (isSlowConnection) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncInProgress) return 'Syncing...';
    if (queuedCount > 0) return `${queuedCount} queued`;
    if (isSlowConnection) return 'Slow connection';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
      );
    }
    
    if (syncInProgress) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    if (queuedCount > 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    );
  };

  return (
    <div className={cn('fixed top-4 right-4 z-50', className)}>
      {/* Main indicator */}
      <div
        className={cn(
          'flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg cursor-pointer transition-all duration-200',
          'text-white text-sm font-medium',
          getStatusColor(),
          isExpanded && 'rounded-b-none',
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        
        {(queuedCount > 0 || !isOnline) && (
          <svg 
            className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="bg-white border border-gray-200 rounded-b-lg shadow-lg p-4 min-w-[280px]">
          {/* Connection Status */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Connection Status</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={cn(
                'font-medium',
                isOnline ? 'text-green-600' : 'text-red-600',
              )}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {isOnline && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Quality:</span>
                <span className={cn(
                  'font-medium capitalize',
                  connectionQuality === 'excellent' && 'text-green-600',
                  connectionQuality === 'good' && 'text-blue-600',
                  connectionQuality === 'fair' && 'text-yellow-600',
                  connectionQuality === 'poor' && 'text-red-600',
                )}>
                  {connectionQuality}
                </span>
              </div>
            )}
          </div>

          {/* Queued Actions */}
          {queuedCount > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Queued Actions</h3>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium text-yellow-600">{queuedCount} items</span>
              </div>
              
              <div className="flex space-x-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={retrySyncData}
                  disabled={syncInProgress || !isOnline}
                  className="flex-1"
                >
                  {syncInProgress ? 'Syncing...' : 'Retry Sync'}
                </ResponsiveButton>
                
                <ResponsiveButton
                  size="sm"
                  variant="ghost"
                  onClick={clearQueuedData}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear
                </ResponsiveButton>
              </div>
            </div>
          )}

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last sync:</span>
                <span className="text-gray-500">
                  {lastSyncTime.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {/* Offline Tips */}
          {!isOnline && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-blue-900 mb-1">Offline Mode</h4>
              <p className="text-xs text-blue-700">
                You can still view cached content and submit forms. 
                Actions will sync when connection is restored.
              </p>
            </div>
          )}

          {/* Slow Connection Warning */}
          {isOnline && isSlowConnection && (
            <div className="bg-orange-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-orange-900 mb-1">Slow Connection</h4>
              <p className="text-xs text-orange-700">
                Some features may be limited due to poor connection quality.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for mobile
export function CompactOfflineIndicator({ className }) {
  const { isOnline, queuedCount, syncInProgress } = useOffline();

  // Only show if offline or has queued items
  if (isOnline && queuedCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-4 left-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg text-white text-xs font-medium',
      !isOnline ? 'bg-red-500' : 'bg-yellow-500',
      className,
    )}>
      {syncInProgress ? (
        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ) : (
        <div className="w-2 h-2 rounded-full bg-current" />
      )}
      
      <span>
        {!isOnline ? 'Offline' : `${queuedCount} queued`}
      </span>
    </div>
  );
}