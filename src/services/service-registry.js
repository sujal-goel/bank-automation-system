const EventEmitter = require('events');

/**
 * Service Registry for dynamic service discovery and health monitoring
 * Manages microservice registration, discovery, and health status
 */
class ServiceRegistry extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimer = null;
    this.startHealthMonitoring();
  }

  /**
   * Register a service with the registry
   * @param {Object} serviceInfo - Service information
   * @param {string} serviceInfo.name - Service name
   * @param {string} serviceInfo.host - Service host
   * @param {number} serviceInfo.port - Service port
   * @param {string} serviceInfo.version - Service version
   * @param {Array} serviceInfo.endpoints - Available endpoints
   * @param {Object} serviceInfo.metadata - Additional metadata
   */
  registerService(serviceInfo) {
    const { name, host, port, version, endpoints = [], metadata = {} } = serviceInfo;
    
    if (!name || !host || !port) {
      throw new Error('Service name, host, and port are required');
    }

    const serviceId = `${name}-${host}-${port}`;
    const service = {
      id: serviceId,
      name,
      host,
      port,
      version,
      endpoints,
      metadata,
      status: 'healthy',
      lastHealthCheck: new Date(),
      registeredAt: new Date(),
      healthCheckUrl: `http://${host}:${port}/health`,
      consecutiveFailures: 0
    };

    this.services.set(serviceId, service);
    this.emit('serviceRegistered', service);
    
    console.log(`Service registered: ${name} at ${host}:${port}`);
    return serviceId;
  }

  /**
   * Unregister a service from the registry
   * @param {string} serviceId - Service ID to unregister
   */
  unregisterService(serviceId) {
    const service = this.services.get(serviceId);
    if (service) {
      this.services.delete(serviceId);
      this.emit('serviceUnregistered', service);
      console.log(`Service unregistered: ${service.name}`);
      return true;
    }
    return false;
  }

  /**
   * Discover services by name or criteria
   * @param {string|Object} criteria - Service name or search criteria
   * @returns {Array} Array of matching services
   */
  discoverServices(criteria) {
    if (typeof criteria === 'string') {
      // Simple name-based discovery
      return Array.from(this.services.values())
        .filter(service => service.name === criteria && service.status === 'healthy');
    }

    // Advanced criteria-based discovery
    return Array.from(this.services.values())
      .filter(service => {
        if (criteria.name && service.name !== criteria.name) return false;
        if (criteria.status && service.status !== criteria.status) return false;
        if (criteria.version && service.version !== criteria.version) return false;
        if (criteria.metadata) {
          for (const [key, value] of Object.entries(criteria.metadata)) {
            if (service.metadata[key] !== value) return false;
          }
        }
        return true;
      });
  }

  /**
   * Get a healthy service instance using load balancing
   * @param {string} serviceName - Name of the service
   * @param {string} strategy - Load balancing strategy ('round-robin', 'random')
   * @returns {Object|null} Service instance or null if none available
   */
  getServiceInstance(serviceName, strategy = 'round-robin') {
    const healthyServices = this.discoverServices(serviceName);
    
    if (healthyServices.length === 0) {
      return null;
    }

    if (healthyServices.length === 1) {
      return healthyServices[0];
    }

    switch (strategy) {
      case 'random':
        return healthyServices[Math.floor(Math.random() * healthyServices.length)];
      
      case 'round-robin':
      default:
        // Simple round-robin implementation
        const serviceKey = `${serviceName}_rr_index`;
        if (!this[serviceKey]) this[serviceKey] = 0;
        const service = healthyServices[this[serviceKey] % healthyServices.length];
        this[serviceKey]++;
        return service;
    }
  }

  /**
   * Get all registered services
   * @returns {Array} Array of all services
   */
  getAllServices() {
    return Array.from(this.services.values());
  }

  /**
   * Get service by ID
   * @param {string} serviceId - Service ID
   * @returns {Object|null} Service or null if not found
   */
  getService(serviceId) {
    return this.services.get(serviceId) || null;
  }

  /**
   * Update service health status
   * @param {string} serviceId - Service ID
   * @param {string} status - Health status ('healthy', 'unhealthy', 'unknown')
   * @param {Object} healthData - Additional health information
   */
  updateServiceHealth(serviceId, status, healthData = {}) {
    const service = this.services.get(serviceId);
    if (service) {
      const previousStatus = service.status;
      service.status = status;
      service.lastHealthCheck = new Date();
      service.healthData = healthData;

      if (status === 'healthy') {
        service.consecutiveFailures = 0;
      } else {
        service.consecutiveFailures++;
      }

      if (previousStatus !== status) {
        this.emit('serviceStatusChanged', service, previousStatus);
      }
    }
  }

  /**
   * Start health monitoring for all registered services
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);

    console.log(`Health monitoring started with ${this.healthCheckInterval}ms interval`);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('Health monitoring stopped');
    }
  }

  /**
   * Perform health checks on all registered services
   */
  async performHealthChecks() {
    const services = Array.from(this.services.values());
    const healthCheckPromises = services.map(service => this.checkServiceHealth(service));
    
    try {
      await Promise.allSettled(healthCheckPromises);
    } catch (error) {
      console.error('Error during health checks:', error);
    }
  }

  /**
   * Check health of a specific service
   * @param {Object} service - Service to check
   */
  async checkServiceHealth(service) {
    try {
      const fetch = require('node-fetch').default || require('node-fetch');
      const response = await fetch(service.healthCheckUrl, {
        method: 'GET',
        timeout: 5000,
        headers: { 'User-Agent': 'ServiceRegistry/1.0' }
      });

      if (response.ok) {
        const healthData = await response.json().catch(() => ({}));
        this.updateServiceHealth(service.id, 'healthy', healthData);
      } else {
        this.updateServiceHealth(service.id, 'unhealthy', { 
          error: `HTTP ${response.status}`,
          statusText: response.statusText 
        });
      }
    } catch (error) {
      this.updateServiceHealth(service.id, 'unhealthy', { 
        error: error.message,
        type: error.name 
      });

      // Remove service if it fails too many consecutive health checks
      if (service.consecutiveFailures >= 5) {
        console.warn(`Removing unhealthy service after 5 failures: ${service.name}`);
        this.unregisterService(service.id);
      }
    }
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    const services = Array.from(this.services.values());
    return {
      totalServices: services.length,
      healthyServices: services.filter(s => s.status === 'healthy').length,
      unhealthyServices: services.filter(s => s.status === 'unhealthy').length,
      unknownServices: services.filter(s => s.status === 'unknown').length,
      servicesByName: services.reduce((acc, service) => {
        acc[service.name] = (acc[service.name] || 0) + 1;
        return acc;
      }, {}),
      lastHealthCheck: new Date()
    };
  }
}

module.exports = ServiceRegistry;