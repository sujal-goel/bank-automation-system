/**
 * Main API Client for backend communication
 * Handles authentication, request/response interceptors, and error handling
 */

import useAuthStore from '@/lib/auth/auth-store';

/**
 * @typedef {Object} RequestOptions
 * @property {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'} [method] - HTTP method
 * @property {any} [body] - Request body data
 * @property {Object<string, string>} [headers] - Additional headers
 * @property {AbortSignal} [signal] - Abort signal for cancellation
 */

class ApiClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    this.timeout = 10000; // 10 second timeout
  }
  
  /**
   * Get authentication token from store
   * @returns {string|null} JWT token
   */
  getToken() {
    // Only access auth store on client side
    if (typeof window === 'undefined') {
      return null;
    }
    
    const authStore = useAuthStore.getState();
    return authStore.token;
  }
  
  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint (e.g., '/api/auth/users')
   * @param {RequestOptions} options - Request options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    if (options.body && config.method !== 'GET') {
      config.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        // Only handle logout on client side
        if (typeof window !== 'undefined') {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        throw new Error('Authentication required');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }
  
  /**
   * Upload file to backend
   * @param {File} file - File to upload
   * @param {string} endpoint - Upload endpoint
   * @param {function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload response
   */
  async upload(file, endpoint, onProgress) {
    // Only available on client side
    if (typeof window === 'undefined') {
      throw new Error('File upload not available during SSR');
    }
    
    const token = this.getToken();
    const url = `${this.baseURL}${endpoint}`;
    
    const formData = new FormData();
    formData.append('file', file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', url);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }

  /**
   * GET request helper
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request helper
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request helper
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request helper
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request helper
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;