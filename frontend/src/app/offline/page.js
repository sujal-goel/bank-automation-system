/**
 * Offline Page
 * Displayed when the user is offline and no cached content is available
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResponsiveButton from '@/components/ui/ResponsiveButton';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [queuedRequests, setQueuedRequests] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for service worker messages
    const handleMessage = (event) => {
      if (event.data.type === 'SYNC_SUCCESS') {
        setQueuedRequests(prev => 
          prev.filter(req => req.timestamp !== event.data.timestamp),
        );
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    // Get queued requests from service worker
    getQueuedRequests();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const getQueuedRequests = async () => {
    try {
      // Get failed requests from IndexedDB
      const request = indexedDB.open('BankingOfflineDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['failedRequests'], 'readonly');
        const store = transaction.objectStore('failedRequests');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          setQueuedRequests(getAllRequest.result || []);
        };
      };
    } catch (error) {
      console.error('Failed to get queued requests:', error);
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    try {
      // Test connection with a simple fetch
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache', 
      });
      
      if (response.ok) {
        // Connection restored, redirect to intended page
        const intendedPath = sessionStorage.getItem('intendedPath') || '/';
        sessionStorage.removeItem('intendedPath');
        router.push(intendedPath);
      }
    } catch (error) {
      // Still offline
      console.log('Still offline, retry failed');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const clearQueuedRequests = async () => {
    try {
      const request = indexedDB.open('BankingOfflineDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['failedRequests'], 'readwrite');
        const store = transaction.objectStore('failedRequests');
        store.clear();
        setQueuedRequests([]);
      };
    } catch (error) {
      console.error('Failed to clear queued requests:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Offline Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" 
              />
            </svg>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </h1>
          
          <p className="text-gray-600 mb-4">
            {isOnline 
              ? 'Your internet connection has been restored. You can now continue using the banking app.'
              : 'It looks like you\'re not connected to the internet. Some features may not be available.'
            }
          </p>

          {/* Connection Status Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Queued Requests */}
        {queuedRequests.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Queued Actions ({queuedRequests.length})
            </h3>
            <p className="text-xs text-blue-700 mb-3">
              These actions will be completed automatically when your connection is restored.
            </p>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {queuedRequests.slice(0, 5).map((request, index) => (
                <div key={request.timestamp} className="text-xs text-blue-600 bg-white p-2 rounded">
                  {new URL(request.url).pathname} - {new Date(request.timestamp).toLocaleTimeString()}
                </div>
              ))}
              {queuedRequests.length > 5 && (
                <div className="text-xs text-blue-600">
                  +{queuedRequests.length - 5} more actions queued
                </div>
              )}
            </div>
            
            <ResponsiveButton
              variant="outline"
              size="sm"
              onClick={clearQueuedRequests}
              className="mt-3 text-xs"
            >
              Clear Queue
            </ResponsiveButton>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isOnline ? (
            <ResponsiveButton
              variant="primary"
              fullWidth
              onClick={handleGoHome}
            >
              Continue to App
            </ResponsiveButton>
          ) : (
            <>
              <ResponsiveButton
                variant="primary"
                fullWidth
                onClick={handleRetry}
                disabled={retryCount >= 3}
              >
                {retryCount >= 3 ? 'Max Retries Reached' : `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
              </ResponsiveButton>
              
              <ResponsiveButton
                variant="outline"
                fullWidth
                onClick={handleGoHome}
              >
                Go to Home
              </ResponsiveButton>
            </>
          )}
        </div>

        {/* Offline Tips */}
        {!isOnline && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              While you're offline:
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• View cached account information</li>
              <li>• Access previously loaded pages</li>
              <li>• Form submissions will be queued</li>
              <li>• Real-time features are unavailable</li>
            </ul>
          </div>
        )}

        {/* Auto-retry indicator */}
        {!isOnline && retryCount < 3 && (
          <div className="mt-4 text-xs text-gray-500">
            Automatically checking connection...
          </div>
        )}
      </div>
    </div>
  );
}