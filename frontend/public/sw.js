/**
 * Service Worker for Banking Frontend
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'banking-frontend-v1';
const STATIC_CACHE = 'banking-static-v1';
const DYNAMIC_CACHE = 'banking-dynamic-v1';
const API_CACHE = 'banking-api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/js/',
  // Add critical images
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache
const CACHEABLE_API_ROUTES = [
  '/api/auth/me',
  '/api/user/profile',
  '/api/notifications',
];

// Routes that require authentication
const AUTH_REQUIRED_ROUTES = [
  '/customer',
  '/employee', 
  '/admin',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle POST requests for background sync
    if (request.method === 'POST') {
      event.respondWith(handlePostRequest(request));
    }
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache first
    event.respondWith(handleStaticAssets(request));
  } else if (isAuthRequiredRoute(url.pathname)) {
    // Auth required routes - network first with offline fallback
    event.respondWith(handleAuthRoute(request));
  } else {
    // Other routes - stale while revalidate
    event.respondWith(handleGeneralRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses for cacheable endpoints
    if (networkResponse.ok && isCacheableApiRoute(url.pathname)) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache');
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'service-worker-cache');
      return response;
    }
    
    // Return offline response for critical endpoints
    if (url.pathname === '/api/auth/me') {
      return new Response(JSON.stringify({ 
        error: 'Offline', 
        offline: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle authentication required routes
async function handleAuthRoute(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for auth route, checking cache');
    
    // Check if user is authenticated (from cache)
    const authResponse = await caches.match('/api/auth/me');
    
    if (authResponse) {
      // Try to serve cached page
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Redirect to offline page or login
    return Response.redirect('/offline', 302);
  }
}

// Handle general requests with stale-while-revalidate
async function handleGeneralRequest(request) {
  const cachedResponse = await caches.match(request);
  
  // Serve from cache immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, networkResponse));
      }
    }).catch(() => {
      // Network failed, but we already served from cache
    });
    
    return cachedResponse;
  }
  
  // No cache, try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed and no cache - serve offline page
    const offlineResponse = await caches.match('/offline');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Handle POST requests for background sync
async function handlePostRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Store for background sync
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    // Store in IndexedDB for background sync
    await storeFailedRequest(requestData);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      self.registration.sync.register('background-sync');
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      queued: true,
      message: 'Request queued for when connection is restored' 
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(syncFailedRequests());
  }
});

// Sync failed requests when connection is restored
async function syncFailedRequests() {
  try {
    const failedRequests = await getFailedRequests();
    
    for (const requestData of failedRequests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          await removeFailedRequest(requestData.timestamp);
          console.log('Service Worker: Successfully synced request:', requestData.url);
          
          // Notify clients of successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                url: requestData.url,
                timestamp: requestData.timestamp
              });
            });
          });
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// IndexedDB operations for storing failed requests
async function storeFailedRequest(requestData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['failedRequests'], 'readwrite');
      const store = transaction.objectStore('failedRequests');
      
      store.add(requestData);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('failedRequests')) {
        const store = db.createObjectStore('failedRequests', { keyPath: 'timestamp' });
        store.createIndex('url', 'url', { unique: false });
      }
    };
  });
}

async function getFailedRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['failedRequests'], 'readonly');
      const store = transaction.objectStore('failedRequests');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

async function removeFailedRequest(timestamp) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['failedRequests'], 'readwrite');
      const store = transaction.objectStore('failedRequests');
      
      store.delete(timestamp);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

// Helper functions
function isCacheableApiRoute(pathname) {
  return CACHEABLE_API_ROUTES.some(route => pathname.startsWith(route));
}

function isAuthRequiredRoute(pathname) {
  return AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}