const ServiceRegistry = require('./service-registry');
const CircuitBreaker = require('./circuit-breaker');

/**
 * Health Monitor service for comprehensive system health monitoring
 * Manages health checks, service discovery, and circuit breaker patterns
 */
class HealthMonitor {
  constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.circuitBreakers = new Map();
    this.systemHealth = {
      status: 'healthy',
      lastCheck: new Date(),
      components: {},
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    };

    // Register event listeners
    this.setupEventListeners();
    
    // Register core system components
    this.registerCoreComponents();
  }

  /**
   * Setup event listeners for service registry and circuit breakers
   */
  setupEventListeners() {
    this.serviceRegistry.on('serviceRegistered', (service) => {
      console.log(`Health Monitor: Service registered - ${service.name}`);
      this.updateComponentHealth(service.name, 'healthy');
    });

    this.serviceRegistry.on('serviceUnregistered', (service) => {
      console.log(`Health Monitor: Service unregistered - ${service.name}`);
      this.updateComponentHealth(service.name, 'removed');
    });

    this.serviceRegistry.on('serviceStatusChanged', (service, previousStatus) => {
      console.log(`Health Monitor: Service ${service.name} status changed from ${previousStatus} to ${service.status}`);
      this.updateComponentHealth(service.name, service.status);
    });
  }

  /**
   * Register core system components for health monitoring
   */
  registerCoreComponents() {
    const coreComponents = [
      {
        name: 'account-opening',
        host: 'localhost',
        port: 3000,
        version: '1.0.0',
        endpoints: ['/api/accounts'],
        metadata: { type: 'core', module: 'account-opening' }
      },
      {
        name: 'loan-processing',
        host: 'localhost',
        port: 3000,
        version: '1.0.0',
        endpoints: ['/api/loans'],
        metadata: { type: 'core', module: 'loan-processing' }
      },
      {
        name: 'kyc-module',
        host: 'localhost',
        port: 3000,
        version: '1.0.0',
        endpoints: ['/api/kyc'],
        metadata: { type: 'core', module: 'kyc' }
      },
      {
        name: 'aml-module',
        host: 'localhost',
        port: 3000,
        version: '1.0.0',
        endpoints: ['/api/aml'],
        metadata: { type: 'core', module: 'aml' }
      },
      {
        name: 'transaction-processing',
        host: 'localhost',
        port: 3000,
        version: '1.0.0',
        endpoints: ['/api/transactions'],
        metadata: { type: 'core', module: 'transaction-processing' }
      },
      {
        name: 'payment-processing',
        host: 'localhost',
        port: 3000,
        version: '1.0.0',
        endpoints: ['/api/payments'],
        metadata: { type: 'core', module: 'payment-processing' }
      }
    ];

    // Register components (they will be marked as unhealthy until actual services start)
    coreComponents.forEach(component => {
      try {
        this.serviceRegistry.registerService(component);
      } catch (error) {
        console.warn(`Failed to register component ${component.name}:`, error.message);
      }
    });
  }

  /**
   * Create or get circuit breaker for a service
   * @param {string} serviceName - Name of the service
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  getCircuitBreaker(serviceName, options = {}) {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 30000,
        monitoringPeriod: 10000,
        ...options
      });

      // Setup circuit breaker event listeners
      circuitBreaker.on('stateChanged', (state) => {
        console.log(`Circuit breaker for ${serviceName} changed to ${state}`);
        this.updateComponentHealth(serviceName, state === 'OPEN' ? 'circuit_open' : 'healthy');
      });

      this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    return this.circuitBreakers.get(serviceName);
  }

  /**
   * Execute a service call with circuit breaker protection
   * @param {string} serviceName - Name of the service
   * @param {Function} serviceCall - Function that makes the service call
   * @param {Object} options - Circuit breaker options
   * @returns {Promise} Result of the service call
   */
  async executeWithCircuitBreaker(serviceName, serviceCall, options = {}) {
    const circuitBreaker = this.getCircuitBreaker(serviceName, options);
    return circuitBreaker.execute(serviceCall);
  }

  /**
   * Update component health status
   * @param {string} componentName - Name of the component
   * @param {string} status - Health status
   * @param {Object} details - Additional health details
   */
  updateComponentHealth(componentName, status, details = {}) {
    this.systemHealth.components[componentName] = {
      status,
      lastCheck: new Date(),
      details
    };

    // Update overall system health
    this.updateSystemHealth();
  }

  /**
   * Update overall system health based on component health
   */
  updateSystemHealth() {
    const components = Object.values(this.systemHealth.components);
    const healthyComponents = components.filter(c => c.status === 'healthy').length;
    const totalComponents = components.length;

    if (totalComponents === 0) {
      this.systemHealth.status = 'unknown';
    } else if (healthyComponents === totalComponents) {
      this.systemHealth.status = 'healthy';
    } else if (healthyComponents === 0) {
      this.systemHealth.status = 'unhealthy';
    } else {
      this.systemHealth.status = 'degraded';
    }

    this.systemHealth.lastCheck = new Date();
    this.systemHealth.uptime = process.uptime();
    this.systemHealth.memory = process.memoryUsage();
  }

  /**
   * Get comprehensive system health report
   * @returns {Object} System health report
   */
  getHealthReport() {
    const serviceStats = this.serviceRegistry.getStats();
    const circuitBreakerStats = {};

    // Collect circuit breaker statistics
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      circuitBreakerStats[serviceName] = circuitBreaker.getState();
    }

    return {
      system: { ...this.systemHealth },
      services: {
        registry: serviceStats,
        instances: this.serviceRegistry.getAllServices()
      },
      circuitBreakers: circuitBreakerStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get simple health status for load balancer health checks
   * @returns {Object} Simple health status
   */
  getSimpleHealth() {
    return {
      status: this.systemHealth.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  /**
   * Perform comprehensive health check of all components
   * @returns {Promise<Object>} Health check results
   */
  async performHealthCheck() {
    console.log('Performing comprehensive health check...');
    
    // Update system metrics
    this.systemHealth.uptime = process.uptime();
    this.systemHealth.memory = process.memoryUsage();

    // Trigger service registry health checks
    await this.serviceRegistry.performHealthChecks();

    // Check database connectivity (mock implementation)
    try {
      await this.checkDatabaseHealth();
      this.updateComponentHealth('database', 'healthy');
    } catch (error) {
      this.updateComponentHealth('database', 'unhealthy', { error: error.message });
    }

    // Check external service connectivity (mock implementation)
    await this.checkExternalServices();

    return this.getHealthReport();
  }

  /**
   * Mock database health check
   * @returns {Promise<boolean>} Database health status
   */
  async checkDatabaseHealth() {
    // Mock database connection check
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional database issues
        if (Math.random() > 0.95) {
          reject(new Error('Database connection timeout'));
        } else {
          resolve(true);
        }
      }, 100);
    });
  }

  /**
   * Check external services health
   * @returns {Promise<void>}
   */
  async checkExternalServices() {
    const externalServices = [
      { name: 'credit-bureau', url: 'https://api.creditbureau.com/health' },
      { name: 'government-db', url: 'https://api.government.gov/health' },
      { name: 'payment-network', url: 'https://api.payments.com/health' }
    ];

    for (const service of externalServices) {
      try {
        // Mock external service check
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Simulate occasional external service issues
        if (Math.random() > 0.9) {
          throw new Error('Service unavailable');
        }
        
        this.updateComponentHealth(service.name, 'healthy');
      } catch (error) {
        this.updateComponentHealth(service.name, 'unhealthy', { error: error.message });
      }
    }
  }

  /**
   * Register a new service for monitoring
   * @param {Object} serviceInfo - Service information
   * @returns {string} Service ID
   */
  registerService(serviceInfo) {
    return this.serviceRegistry.registerService(serviceInfo);
  }

  /**
   * Unregister a service from monitoring
   * @param {string} serviceId - Service ID
   * @returns {boolean} Success status
   */
  unregisterService(serviceId) {
    return this.serviceRegistry.unregisterService(serviceId);
  }

  /**
   * Discover services by criteria
   * @param {string|Object} criteria - Service discovery criteria
   * @returns {Array} Matching services
   */
  discoverServices(criteria) {
    return this.serviceRegistry.discoverServices(criteria);
  }

  /**
   * Get a healthy service instance with circuit breaker protection
   * @param {string} serviceName - Service name
   * @param {string} strategy - Load balancing strategy
   * @returns {Object|null} Service instance
   */
  getHealthyServiceInstance(serviceName, strategy = 'round-robin') {
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    
    if (!circuitBreaker.isHealthy()) {
      console.warn(`Circuit breaker for ${serviceName} is open, service unavailable`);
      return null;
    }

    return this.serviceRegistry.getServiceInstance(serviceName, strategy);
  }

  /**
   * Shutdown health monitor and cleanup resources
   */
  shutdown() {
    console.log('Shutting down Health Monitor...');
    this.serviceRegistry.stopHealthMonitoring();
    this.circuitBreakers.clear();
  }
}

module.exports = HealthMonitor;