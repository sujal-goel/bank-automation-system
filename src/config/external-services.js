const config = require('./index');

/**
 * External Services Configuration Helper
 * Provides configuration for all external service integrations
 */
class ExternalServicesConfig {
  constructor() {
    this.services = {};
    this.loadServiceConfigurations();
  }

  /**
   * Load all external service configurations
   */
  loadServiceConfigurations() {
    // Credit Bureau Services
    this.services.creditBureau = {
      cibil: this.getServiceConfig('creditBureau.cibil'),
      experian: this.getServiceConfig('creditBureau.experian'),
      equifax: this.getServiceConfig('creditBureau.equifax')
    };

    // Government Database Services
    this.services.governmentDatabases = {
      aadhaar: this.getServiceConfig('governmentDatabases.aadhaar'),
      pan: this.getServiceConfig('governmentDatabases.pan'),
      passport: this.getServiceConfig('governmentDatabases.passport')
    };

    // Payment Network Services
    this.services.paymentNetworks = {
      swift: this.getServiceConfig('paymentNetworks.swift'),
      rtgs: this.getServiceConfig('paymentNetworks.rtgs'),
      neft: this.getServiceConfig('paymentNetworks.neft'),
      upi: this.getServiceConfig('paymentNetworks.upi')
    };

    // Notification Services
    this.services.notifications = {
      email: this.getServiceConfig('notifications.email'),
      sms: this.getServiceConfig('notifications.sms'),
      push: this.getServiceConfig('notifications.push')
    };
  }

  /**
   * Get service configuration with defaults
   */
  getServiceConfig(servicePath) {
    const serviceConfig = config.getExternalService(servicePath.replace('.', '/'));
    
    return {
      ...serviceConfig,
      
      // Default timeout and retry settings
      timeout: serviceConfig.timeout || 30000,
      retryAttempts: serviceConfig.retryAttempts || 3,
      retryDelay: serviceConfig.retryDelay || 1000,
      
      // Circuit breaker settings
      circuitBreaker: {
        enabled: serviceConfig.circuitBreakerEnabled !== false,
        failureThreshold: serviceConfig.failureThreshold || 5,
        resetTimeout: serviceConfig.resetTimeout || 60000,
        monitoringPeriod: serviceConfig.monitoringPeriod || 10000
      },
      
      // Health check settings
      healthCheck: {
        enabled: serviceConfig.healthCheckEnabled !== false,
        interval: serviceConfig.healthCheckInterval || 30000,
        timeout: serviceConfig.healthCheckTimeout || 5000,
        endpoint: serviceConfig.healthCheckEndpoint || '/health'
      }
    };
  }

  /**
   * Get credit bureau configuration
   */
  getCreditBureauConfig(bureau = null) {
    if (bureau) {
      return this.services.creditBureau[bureau];
    }
    return this.services.creditBureau;
  }

  /**
   * Get government database configuration
   */
  getGovernmentDatabaseConfig(database = null) {
    if (database) {
      return this.services.governmentDatabases[database];
    }
    return this.services.governmentDatabases;
  }

  /**
   * Get payment network configuration
   */
  getPaymentNetworkConfig(network = null) {
    if (network) {
      return this.services.paymentNetworks[network];
    }
    return this.services.paymentNetworks;
  }

  /**
   * Get notification service configuration
   */
  getNotificationConfig(service = null) {
    if (service) {
      return this.services.notifications[service];
    }
    return this.services.notifications;
  }

  /**
   * Check if service is in mock mode
   */
  isServiceMocked(servicePath) {
    const serviceConfig = this.getServiceByPath(servicePath);
    return serviceConfig?.mockMode === true;
  }

  /**
   * Get service by dot notation path
   */
  getServiceByPath(path) {
    const parts = path.split('.');
    let current = this.services;
    
    for (const part of parts) {
      if (current && current[part]) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current;
  }

  /**
   * Get all services with their health status
   */
  getAllServices() {
    const allServices = [];
    
    Object.keys(this.services).forEach(category => {
      Object.keys(this.services[category]).forEach(serviceName => {
        const service = this.services[category][serviceName];
        allServices.push({
          category,
          name: serviceName,
          baseUrl: service.baseUrl,
          mockMode: service.mockMode,
          enabled: service.enabled !== false,
          timeout: service.timeout,
          retryAttempts: service.retryAttempts
        });
      });
    });
    
    return allServices;
  }

  /**
   * Validate external service configurations
   */
  validate() {
    const errors = [];
    
    // Validate credit bureau services
    Object.keys(this.services.creditBureau).forEach(bureau => {
      const service = this.services.creditBureau[bureau];
      if (!service.baseUrl) {
        errors.push(`Credit bureau ${bureau} missing baseUrl`);
      }
      if (!service.mockMode && !service.apiKey) {
        errors.push(`Credit bureau ${bureau} missing apiKey for production mode`);
      }
    });

    // Validate government database services
    Object.keys(this.services.governmentDatabases).forEach(db => {
      const service = this.services.governmentDatabases[db];
      if (!service.baseUrl) {
        errors.push(`Government database ${db} missing baseUrl`);
      }
      if (!service.mockMode && !service.apiKey) {
        errors.push(`Government database ${db} missing apiKey for production mode`);
      }
    });

    // Validate payment network services
    Object.keys(this.services.paymentNetworks).forEach(network => {
      const service = this.services.paymentNetworks[network];
      if (!service.baseUrl) {
        errors.push(`Payment network ${network} missing baseUrl`);
      }
      
      // Special validation for SWIFT
      if (network === 'swift' && !service.mockMode) {
        if (!service.memberCode) {
          errors.push('SWIFT service missing memberCode for production mode');
        }
        if (!service.certificatePath) {
          errors.push('SWIFT service missing certificatePath for production mode');
        }
      }
    });

    // Validate notification services
    Object.keys(this.services.notifications).forEach(service => {
      const config = this.services.notifications[service];
      if (config && !config.provider) {
        errors.push(`Notification service ${service} missing provider`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`External service configuration errors:\n${errors.join('\n')}`);
    }

    return true;
  }

  /**
   * Get service endpoints for API documentation
   */
  getServiceEndpoints() {
    const endpoints = {};
    
    Object.keys(this.services).forEach(category => {
      endpoints[category] = {};
      Object.keys(this.services[category]).forEach(serviceName => {
        const service = this.services[category][serviceName];
        endpoints[category][serviceName] = {
          baseUrl: service.baseUrl,
          healthCheck: `${service.baseUrl}${service.healthCheck.endpoint}`,
          mockMode: service.mockMode,
          timeout: service.timeout
        };
      });
    });
    
    return endpoints;
  }
}

module.exports = new ExternalServicesConfig();