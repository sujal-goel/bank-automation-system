/**
 * Notification Store using Zustand
 * Manages real-time notifications with WebSocket integration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * @typedef {Object} Notification
 * @property {string} id - Notification ID
 * @property {'info'|'success'|'warning'|'error'} type - Notification type
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {Date} timestamp - Notification timestamp
 * @property {boolean} read - Read status
 * @property {string} [actionUrl] - Optional action URL
 * @property {Object} [metadata] - Additional metadata
 * @property {boolean} [persistent] - Whether notification should persist across sessions
 * @property {number} [autoHide] - Auto-hide timeout in milliseconds
 */

/**
 * @typedef {Object} NotificationState
 * @property {Notification[]} notifications - Array of notifications
 * @property {number} unreadCount - Count of unread notifications
 * @property {WebSocket|null} socket - WebSocket connection
 * @property {boolean} connected - Connection status
 * @property {boolean} connecting - Connection attempt status
 * @property {number} reconnectAttempts - Number of reconnection attempts
 * @property {function} connect - Connect to WebSocket
 * @property {function} disconnect - Disconnect from WebSocket
 * @property {function} addNotification - Add notification
 * @property {function} markAsRead - Mark notification as read
 * @property {function} markAllAsRead - Mark all notifications as read
 * @property {function} removeNotification - Remove notification
 * @property {function} clearAll - Clear all notifications
 * @property {function} getNotificationsByType - Get notifications by type
 */

const MAX_NOTIFICATIONS = 100;
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      socket: null,
      connected: false,
      connecting: false,
      reconnectAttempts: 0,

      /**
       * Connect to WebSocket server
       * @param {string} userId - User ID for connection
       * @param {string} token - Authentication token
       */
      connect: (userId, token) => {
        // Only connect in browser environment
        if (typeof window === 'undefined') {
          return;
        }

        const state = get();
        
        if (state.socket || state.connecting) {
          return; // Already connected or connecting
        }

        set({ connecting: true });

        try {
          const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
          const socket = new WebSocket(`${wsUrl}/notifications?userId=${userId}&token=${token}`);

          socket.onopen = () => {
            console.log('WebSocket connected');
            set({ 
              socket, 
              connected: true, 
              connecting: false,
              reconnectAttempts: 0,
            });
          };

          socket.onmessage = (event) => {
            try {
              const notification = JSON.parse(event.data);
              get().addNotification(notification);
            } catch (error) {
              console.error('Failed to parse notification:', error);
            }
          };

          socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            set({ 
              socket: null, 
              connected: false, 
              connecting: false, 
            });

            // Attempt reconnection if not intentionally closed
            if (event.code !== 1000 && get().reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              setTimeout(() => {
                const currentAttempts = get().reconnectAttempts;
                set({ reconnectAttempts: currentAttempts + 1 });
                get().connect(userId, token);
              }, RECONNECT_INTERVAL);
            }
          };

          socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            set({ connecting: false });
          };

        } catch (error) {
          console.error('Failed to create WebSocket connection:', error);
          set({ connecting: false });
        }
      },

      /**
       * Disconnect from WebSocket
       */
      disconnect: () => {
        const { socket } = get();
        if (socket) {
          socket.close(1000, 'User disconnected'); // Normal closure
          set({ 
            socket: null, 
            connected: false, 
            connecting: false,
            reconnectAttempts: 0,
          });
        }
      },

      /**
       * Add new notification
       * @param {Notification} notification - Notification object
       */
      addNotification: (notification) => {
        const enhancedNotification = {
          id: notification.id || Date.now().toString(),
          type: notification.type || 'info',
          title: notification.title || 'Notification',
          message: notification.message || '',
          timestamp: notification.timestamp ? new Date(notification.timestamp) : new Date(),
          read: notification.read || false,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
          persistent: notification.persistent || false,
          autoHide: notification.autoHide,
        };

        set((state) => {
          // Limit total notifications
          const notifications = [enhancedNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
          
          return {
            notifications,
            unreadCount: notifications.filter(n => !n.read).length,
          };
        });

        // Auto-hide notification if specified
        if (enhancedNotification.autoHide && enhancedNotification.autoHide > 0) {
          setTimeout(() => {
            get().removeNotification(enhancedNotification.id);
          }, enhancedNotification.autoHide);
        }

        // Show browser notification if permission granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && !notification.read) {
          new Notification(enhancedNotification.title, {
            body: enhancedNotification.message,
            icon: '/favicon.ico',
            tag: enhancedNotification.id,
          });
        }
      },

      /**
       * Mark notification as read
       * @param {string} id - Notification ID
       */
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n,
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      /**
       * Mark all notifications as read
       */
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      /**
       * Remove notification
       * @param {string} id - Notification ID
       */
      removeNotification: (id) => {
        set((state) => {
          const notifications = state.notifications.filter(n => n.id !== id);
          return {
            notifications,
            unreadCount: notifications.filter(n => !n.read).length,
          };
        });
      },

      /**
       * Clear all notifications
       * @param {boolean} onlyNonPersistent - Only clear non-persistent notifications
       */
      clearAll: (onlyNonPersistent = false) => {
        set((state) => {
          const notifications = onlyNonPersistent 
            ? state.notifications.filter(n => n.persistent)
            : [];
          
          return {
            notifications,
            unreadCount: notifications.filter(n => !n.read).length,
          };
        });
      },

      /**
       * Get notifications by type
       * @param {string} type - Notification type
       * @returns {Notification[]} Filtered notifications
       */
      getNotificationsByType: (type) => {
        return get().notifications.filter(n => n.type === type);
      },

      /**
       * Request browser notification permission
       */
      requestPermission: async () => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        // Only persist notifications marked as persistent
        notifications: state.notifications.filter(n => n.persistent),
        unreadCount: state.notifications.filter(n => n.persistent && !n.read).length,
      }),
    },
  ),
);

export default useNotificationStore;