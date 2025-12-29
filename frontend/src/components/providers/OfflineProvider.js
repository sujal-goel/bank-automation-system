/**
 * Offline Provider Component
 * Manages service worker registration and offline functionality
 */

'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker, updateServiceWorker } from '@/lib/serviceWorker';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import  ToastContainer  from '@/components/notifications/ToastContainer';
import  useNotifications  from '@/hooks/useNotifications';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export default function OfflineProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const { addNotification } = useNotifications();

  // Ensure component only runs on client side
  useEffect(() => {
    if (isBrowser) {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !isBrowser) return;

    // Register service worker
    const initServiceWorker = async () => {
      try {
        const reg = await registerServiceWorker();
        setRegistration(reg);
        
        if (reg) {
          console.log('Service Worker registered successfully');
          
          // Show offline ready notification
          addNotification({
            type: 'info',
            title: 'App Ready for Offline Use',
            message: 'You can now use the app even when offline. Forms will sync when connection is restored.',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    initServiceWorker();

    // Listen for service worker events
    const handleUpdateAvailable = (event) => {
      setUpdateAvailable(true);
      setRegistration(event.detail.registration);
      
      addNotification({
        type: 'info',
        title: 'App Update Available',
        message: 'A new version of the app is available. Click to update.',
        duration: 0, // Persistent
        action: {
          label: 'Update Now',
          onClick: () => handleUpdate(event.detail.registration),
        },
      });
    };

    const handleSyncSuccess = (event) => {
      addNotification({
        type: 'success',
        title: 'Data Synced',
        message: 'Your offline actions have been synchronized successfully.',
        duration: 3000,
      });
    };

    const handleInstallPrompt = (event) => {
      setInstallPromptEvent(event);
      
      // Show install notification after a delay
      setTimeout(() => {
        addNotification({
          type: 'info',
          title: 'Install Banking App',
          message: 'Install the app for a better experience with offline access.',
          duration: 0, // Persistent
          action: {
            label: 'Install',
            onClick: handleInstall,
          },
        });
      }, 10000); // Show after 10 seconds
    };

    const handleOfflineReady = () => {
      addNotification({
        type: 'success',
        title: 'Offline Ready',
        message: 'The app is now ready to work offline.',
        duration: 3000,
      });
    };

    // Add event listeners
    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-sync-success', handleSyncSuccess);
    window.addEventListener('sw-offline-ready', handleOfflineReady);
    window.addEventListener('pwa-install-available', handleInstallPrompt);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-sync-success', handleSyncSuccess);
      window.removeEventListener('sw-offline-ready', handleOfflineReady);
      window.removeEventListener('pwa-install-available', handleInstallPrompt);
    };
  }, [addNotification, mounted]);

  const handleUpdate = (reg) => {
    if (reg) {
      updateServiceWorker(reg);
      setUpdateAvailable(false);
    }
  };

  const handleInstall = async () => {
    if (installPromptEvent) {
      try {
        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        
        if (outcome === 'accepted') {
          addNotification({
            type: 'success',
            title: 'App Installed',
            message: 'The Banking App has been installed successfully.',
            duration: 3000,
          });
        }
        
        setInstallPromptEvent(null);
      } catch (error) {
        console.error('Install prompt failed:', error);
      }
    }
  };

  // Handle app state changes for background sync
  useEffect(() => {
    if (!mounted || !isBrowser) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && registration) {
        // App became visible, check for updates
        registration.update();
      }
    };

    const handleFocus = () => {
      if (registration) {
        // App gained focus, check for updates
        registration.update();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [registration, mounted]);

  // Preload critical resources when app loads
  useEffect(() => {
    if (!mounted || !isBrowser) return;

    const preloadResources = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('banking-critical-v1');
          
          // Preload critical pages
          const criticalUrls = [
            '/',
            '/login',
            '/customer/dashboard',
            '/offline',
          ];
          
          await cache.addAll(criticalUrls);
          console.log('Critical resources preloaded');
        } catch (error) {
          console.error('Failed to preload critical resources:', error);
        }
      }
    };

    // Preload after a short delay to not block initial render
    setTimeout(preloadResources, 2000);
  }, [mounted]);

  return (
    <>
      {children}
      
      {/* Only render client-side components after mounting */}
      {mounted && isBrowser && (
        <>
          {/* Offline Indicator */}
          <OfflineIndicator />
          
          {/* Toast Notifications */}
          <ToastContainer />
          
          {/* PWA Install Banner (for browsers that don't show native prompt) */}
          {installPromptEvent && (
            <div className="fixed bottom-0 left-0 right-0 bg-primary-600 text-white p-4 z-50 lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Install Banking App</p>
                  <p className="text-xs opacity-90">Get the full app experience</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setInstallPromptEvent(null)}
                    className="text-xs px-3 py-1 border border-white/30 rounded"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleInstall}
                    className="text-xs px-3 py-1 bg-white text-primary-600 rounded font-medium"
                  >
                    Install
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}