/**
 * Service Worker Registration and Management
 * Handles service worker lifecycle and offline functionality
 */

'use client';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Service worker registration
export const registerServiceWorker = async () => {
  if (!isBrowser || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            showUpdateAvailableNotification(registration);
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Handle service worker messages
const handleServiceWorkerMessage = (event) => {
  if (!isBrowser) return;
  
  const { data } = event;

  switch (data.type) {
    case 'SYNC_SUCCESS':
      // Notify user of successful background sync
      showSyncSuccessNotification(data);
      break;
    
    case 'CACHE_UPDATED':
      // Notify user of cache updates
      console.log('Cache updated:', data);
      break;
    
    case 'OFFLINE_READY':
      // App is ready for offline use
      showOfflineReadyNotification();
      break;
    
    default:
      console.log('Unknown service worker message:', data);
  }
};

// Show update available notification
const showUpdateAvailableNotification = (registration) => {
  if (!isBrowser) return;
  
  // Create a custom event for the app to handle
  const event = new CustomEvent('sw-update-available', {
    detail: { registration },
  });
  window.dispatchEvent(event);
};

// Show sync success notification
const showSyncSuccessNotification = (data) => {
  if (!isBrowser) return;
  
  const event = new CustomEvent('sw-sync-success', {
    detail: data,
  });
  window.dispatchEvent(event);
};

// Show offline ready notification
const showOfflineReadyNotification = () => {
  if (!isBrowser) return;
  
  const event = new CustomEvent('sw-offline-ready');
  window.dispatchEvent(event);
};

// Update service worker
export const updateServiceWorker = (registration) => {
  if (!isBrowser) return;
  
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
};

// Get cache status
export const getCacheStatus = async () => {
  if (!isBrowser || !navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_STATUS' },
      [messageChannel.port2],
    );
  });
};

// Clear all caches
export const clearAllCaches = async () => {
  if (!isBrowser || !('caches' in window)) return;
  
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName)),
  );
  console.log('All caches cleared');
};

// Preload critical resources
export const preloadCriticalResources = async (urls) => {
  if (!isBrowser || !('caches' in window)) return;
  
  const cache = await caches.open('banking-critical-v1');
  await cache.addAll(urls);
  console.log('Critical resources preloaded');
};

// Check if app is running in standalone mode (PWA)
export const isStandalone = () => {
  if (!isBrowser) return false;
  
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Install prompt handling
let deferredPrompt = null;

// Initialize install prompt handling only in browser
if (isBrowser) {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    
    // Dispatch custom event for app to handle
    const customEvent = new CustomEvent('pwa-install-available');
    window.dispatchEvent(customEvent);
  });
}

export const showInstallPrompt = async () => {
  if (!isBrowser || !deferredPrompt) {
    return false;
  }

  try {
    const result = await deferredPrompt.prompt();
    deferredPrompt = null;
    return result.outcome === 'accepted';
  } catch (error) {
    console.error('Error showing install prompt:', error);
    return false;
  }
};

// Get network status
export const getNetworkStatus = () => {
  if (!isBrowser || !navigator.connection) {
    return {
      online: navigator?.onLine || true,
      effectiveType: 'unknown',
      rtt: 0,
      downlink: 0,
    };
  }

  return {
    online: navigator.onLine,
    effectiveType: navigator.connection.effectiveType,
    rtt: navigator.connection.rtt || 0,
    downlink: navigator.connection.downlink || 0,
  };
};

// Background sync utilities
export const queueBackgroundSync = async (tag, data) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    
    // Store data for sync
    await storeDataForSync(tag, data);
    
    // Register sync
    await registration.sync.register(tag);
    
    return true;
  }
  
  return false;
};

// Store data for background sync
const storeDataForSync = async (tag, data) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['syncData'], 'readwrite');
      const store = transaction.objectStore('syncData');
      
      store.put({ tag, data, timestamp: Date.now() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('syncData')) {
        const store = db.createObjectStore('syncData', { keyPath: 'tag' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Offline storage utilities
export const offlineStorage = {
  // Store form data for offline submission
  storeFormData: async (formId, data) => {
    const key = `form_${formId}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({
      formId,
      data,
      timestamp: Date.now(),
      synced: false,
    }));
    return key;
  },

  // Get stored form data
  getStoredForms: () => {
    const forms = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('form_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          forms.push({ key, ...data });
        } catch (error) {
          console.error('Error parsing stored form:', error);
        }
      }
    }
    return forms.sort((a, b) => b.timestamp - a.timestamp);
  },

  // Mark form as synced
  markFormSynced: (key) => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        parsed.synced = true;
        localStorage.setItem(key, JSON.stringify(parsed));
      } catch (error) {
        console.error('Error marking form as synced:', error);
      }
    }
  },

  // Clear synced forms
  clearSyncedForms: () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('form_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.synced) {
            keys.push(key);
          }
        } catch (error) {
          console.error('Error checking form sync status:', error);
        }
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    return keys.length;
  },
};