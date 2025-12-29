/**
 * WebSocket Client
 * Handles WebSocket connections and message routing
 */

import useNotificationStore from '@/stores/notificationStore';

class WebSocketClient {
  constructor() {
    this.connections = new Map();
    this.messageHandlers = new Map();
    this.reconnectTimeouts = new Map();
  }

  /**
   * Connect to WebSocket server
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} options - Connection options
   * @returns {Promise<WebSocket>} WebSocket connection
   */
  async connect(endpoint, options = {}) {
    const {
      userId,
      protocols = [],
      reconnect = true,
      maxReconnectAttempts = 10,
      reconnectInterval = 5000,
    } = options;

    const wsUrl = this.buildWebSocketUrl(endpoint, { userId });
    
    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(wsUrl, protocols);
        
        socket.onopen = (event) => {
          console.log(`WebSocket connected to ${endpoint}`);
          this.connections.set(endpoint, socket);
          
          // Clear any existing reconnect timeout
          if (this.reconnectTimeouts.has(endpoint)) {
            clearTimeout(this.reconnectTimeouts.get(endpoint));
            this.reconnectTimeouts.delete(endpoint);
          }
          
          resolve(socket);
        };

        socket.onmessage = (event) => {
          this.handleMessage(endpoint, event);
        };

        socket.onclose = (event) => {
          console.log(`WebSocket disconnected from ${endpoint}:`, event.code, event.reason);
          this.connections.delete(endpoint);
          
          // Attempt reconnection if enabled and not intentionally closed
          if (reconnect && event.code !== 1000) {
            this.scheduleReconnect(endpoint, options);
          }
        };

        socket.onerror = (error) => {
          console.error(`WebSocket error on ${endpoint}:`, error);
          reject(error);
        };

      } catch (error) {
        console.error(`Failed to create WebSocket connection to ${endpoint}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   * @param {string} endpoint - WebSocket endpoint
   */
  disconnect(endpoint) {
    const socket = this.connections.get(endpoint);
    if (socket) {
      socket.close(1000, 'Client disconnected');
      this.connections.delete(endpoint);
    }

    // Clear reconnect timeout
    if (this.reconnectTimeouts.has(endpoint)) {
      clearTimeout(this.reconnectTimeouts.get(endpoint));
      this.reconnectTimeouts.delete(endpoint);
    }
  }

  /**
   * Send message to WebSocket server
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} message - Message to send
   */
  send(endpoint, message) {
    const socket = this.connections.get(endpoint);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn(`Cannot send message to ${endpoint}: connection not open`);
    }
  }

  /**
   * Register message handler for endpoint
   * @param {string} endpoint - WebSocket endpoint
   * @param {function} handler - Message handler function
   */
  onMessage(endpoint, handler) {
    if (!this.messageHandlers.has(endpoint)) {
      this.messageHandlers.set(endpoint, []);
    }
    this.messageHandlers.get(endpoint).push(handler);
  }

  /**
   * Remove message handler for endpoint
   * @param {string} endpoint - WebSocket endpoint
   * @param {function} handler - Message handler function to remove
   */
  offMessage(endpoint, handler) {
    const handlers = this.messageHandlers.get(endpoint);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {string} endpoint - WebSocket endpoint
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(endpoint, event) {
    try {
      const data = JSON.parse(event.data);
      
      // Route to registered handlers
      const handlers = this.messageHandlers.get(endpoint) || [];
      handlers.forEach(handler => {
        try {
          handler(data, endpoint);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });

      // Handle notifications specifically
      if (endpoint === '/notifications' && data.type) {
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification(data);
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Schedule reconnection attempt
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} options - Original connection options
   */
  scheduleReconnect(endpoint, options) {
    const { reconnectInterval = 5000, maxReconnectAttempts = 10 } = options;
    
    // Track reconnection attempts
    if (!this.reconnectAttempts) {
      this.reconnectAttempts = new Map();
    }
    
    const attempts = this.reconnectAttempts.get(endpoint) || 0;
    
    if (attempts >= maxReconnectAttempts) {
      console.log(`Max reconnection attempts reached for ${endpoint}`);
      return;
    }

    this.reconnectAttempts.set(endpoint, attempts + 1);

    const timeout = setTimeout(() => {
      console.log(`Attempting to reconnect to ${endpoint}... (${attempts + 1}/${maxReconnectAttempts})`);
      this.connect(endpoint, options)
        .then(() => {
          // Reset attempts on successful connection
          this.reconnectAttempts.set(endpoint, 0);
        })
        .catch((error) => {
          console.error(`Reconnection failed for ${endpoint}:`, error);
        });
    }, reconnectInterval);

    this.reconnectTimeouts.set(endpoint, timeout);
  }

  /**
   * Build WebSocket URL with query parameters
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} params - Query parameters
   * @returns {string} Complete WebSocket URL
   */
  buildWebSocketUrl(endpoint, params = {}) {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
    const url = new URL(endpoint, baseUrl.replace('http', 'ws'));
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  /**
   * Get connection status for endpoint
   * @param {string} endpoint - WebSocket endpoint
   * @returns {boolean} Connection status
   */
  isConnected(endpoint) {
    const socket = this.connections.get(endpoint);
    return socket && socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get all active connections
   * @returns {Map<string, WebSocket>} Active connections
   */
  getConnections() {
    return new Map(this.connections);
  }

  /**
   * Disconnect all connections
   */
  disconnectAll() {
    this.connections.forEach((socket, endpoint) => {
      this.disconnect(endpoint);
    });
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;