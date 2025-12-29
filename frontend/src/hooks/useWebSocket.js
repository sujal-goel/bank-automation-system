/**
 * WebSocket Hook
 * Custom hook for WebSocket connection management
 */

import { useEffect, useRef, useCallback } from 'react';
import { wsClient } from '@/lib/websocket/client';
import { routeMessage } from '@/lib/websocket/handlers';
import useNotificationStore from '@/stores/notificationStore';

/**
 * Custom hook for WebSocket connection
 * @param {Object} options - WebSocket options
 * @returns {Object} WebSocket connection state and methods
 */
export function useWebSocket(options = {}) {
  const {
    endpoint = '/notifications',
    userId,
    autoConnect = true,
    reconnect = true,
    maxReconnectAttempts = 10,
    reconnectInterval = 5000,
  } = options;

  const socketRef = useRef(null);
  const handlersRef = useRef(new Set());
  const notificationStore = useNotificationStore();

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    if (!userId) {
      console.warn('Cannot connect to WebSocket: userId is required');
      return;
    }

    try {
      const socket = await wsClient.connect(endpoint, {
        userId,
        reconnect,
        maxReconnectAttempts,
        reconnectInterval,
      });

      socketRef.current = socket;

      // Register message handler
      const messageHandler = (data, endpoint) => {
        routeMessage(data, endpoint);
      };

      wsClient.onMessage(endpoint, messageHandler);
      handlersRef.current.add(messageHandler);

      return socket;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  }, [endpoint, userId, reconnect, maxReconnectAttempts, reconnectInterval]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    // Remove message handlers
    handlersRef.current.forEach(handler => {
      wsClient.offMessage(endpoint, handler);
    });
    handlersRef.current.clear();

    // Disconnect socket
    wsClient.disconnect(endpoint);
    socketRef.current = null;
  }, [endpoint]);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message) => {
    wsClient.send(endpoint, message);
  }, [endpoint]);

  /**
   * Check if WebSocket is connected
   */
  const isConnected = useCallback(() => {
    return wsClient.isConnected(endpoint);
  }, [endpoint]);

  /**
   * Add custom message handler
   */
  const addMessageHandler = useCallback((handler) => {
    wsClient.onMessage(endpoint, handler);
    handlersRef.current.add(handler);
  }, [endpoint]);

  /**
   * Remove custom message handler
   */
  const removeMessageHandler = useCallback((handler) => {
    wsClient.offMessage(endpoint, handler);
    handlersRef.current.delete(handler);
  }, [endpoint]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  // Request notification permission on first connection
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      notificationStore.requestNotificationPermission();
    }
  }, [notificationStore]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected,
    addMessageHandler,
    removeMessageHandler,
  };
}

/**
 * Hook for notification-specific WebSocket connection
 * @param {string} userId - User ID
 * @returns {Object} Notification WebSocket state and methods
 */
export function useNotificationWebSocket(userId) {
  return useWebSocket({
    endpoint: '/notifications',
    userId,
    autoConnect: true,
    reconnect: true,
  });
}

/**
 * Hook for real-time application updates
 * @param {string} userId - User ID
 * @param {string} applicationId - Application ID to monitor
 * @returns {Object} Application WebSocket state and methods
 */
export function useApplicationWebSocket(userId, applicationId) {
  const ws = useWebSocket({
    endpoint: `/applications/${applicationId}`,
    userId,
    autoConnect: !!applicationId,
    reconnect: true,
  });

  // Send subscription message on connect
  useEffect(() => {
    if (ws.isConnected() && applicationId) {
      ws.sendMessage({
        action: 'subscribe',
        applicationId,
      });
    }
  }, [ws, applicationId]);

  return ws;
}

/**
 * Hook for real-time document processing updates
 * @param {string} userId - User ID
 * @returns {Object} Document WebSocket state and methods
 */
export function useDocumentWebSocket(userId) {
  return useWebSocket({
    endpoint: '/documents',
    userId,
    autoConnect: true,
    reconnect: true,
  });
}

export default useWebSocket;