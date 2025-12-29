const path = require('path');
const fs = require('fs');
const envLoader = require('./env-loader');

/**
 * Configuration Management System
 * Provides environment-based configuration loading with support for:
 * - Environment-specific configurations
 * - Business rule configurations
 * - Database and external service configurations
 * - Secure credential management
 */
class ConfigurationManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = {};
    this.businessRules = {};
    this.loadConfiguration();
  }

  /**
   * Load configuration from multiple sources
   */
  loadConfiguration() {
    try {
      // Load base configuration
      this.config = this.loadBaseConfig();
      
      // Load environment-specific overrides
      this.loadEnvironmentConfig();
      
      // Load business rules
      this.loadBusinessRules();
      
      // Validate required configurations
      this.validateConfiguration();
      
      console.log(`Configuration loaded for environment: ${this.environment}`);
    } catch (error) {
      console.error('Failed to load configuration:', error.message);
      throw error;
    }
  }

  /**
   * Load base configuration with defaults
   */
  loadBaseConfig() {
    return {
      server: {
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || 'localhost',
        trustProxy: process.env.TRUST_PROXY === 'true',
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
        bodyLimit: process.env.BODY_LIMIT || '10mb'
      },
      
      database: {
        // Supabase connection string (preferred for Vercel deployment)
        connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
        
        // Individual connection parameters (fallback)
        host: process.env.DB_HOST || process.env.SUPABASE_HOST ||'localhost',
        port: parseInt(process.env.DB_PORT || process.env.SUPABASE_PORT) || 5432,
        name: process.env.DB_NAME || process.env.SUPABASE_DB_NAME || 'banking_automation',
        username: process.env.DB_USERNAME || process.env.SUPABASE_USER || 'banking_user',
        password: process.env.DB_PASSWORD || process.env.SUPABASE_PASSWORD || '',
        
        // SSL configuration (required for Supabase)
        ssl: process.env.DB_SSL !== 'false' && process.env.NODE_ENV === 'production',
        
        // Connection pool settings optimized for serverless
        poolSize: parseInt(process.env.DB_POOL_SIZE) || (process.env.VERCEL ? 1 : 5),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
        
        // Supabase-specific settings
        schema: process.env.DB_SCHEMA || 'public',
        searchPath: process.env.DB_SEARCH_PATH || 'public'
      },
      
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'banking:'
      },
      
      security: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
      },
      
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        auditEnabled: process.env.AUDIT_LOGGING === 'true',
        auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555 // 7 years
      },
      
      monitoring: {
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
        metricsEnabled: process.env.METRICS_ENABLED === 'true',
        tracingEnabled: process.env.TRACING_ENABLED === 'true',
        alertingEnabled: process.env.ALERTING_ENABLED === 'true'
      }
    };
  }

  /**
   * Load environment-specific configuration overrides
   */
  loadEnvironmentConfig() {
    const envConfigPath = path.join(__dirname, 'environments', `${this.environment}.js`);
    
    if (fs.existsSync(envConfigPath)) {
      const envConfig = require(envConfigPath);
      this.config = this.mergeDeep(this.config, envConfig);
    }
  }

  /**
   * Load business rules configuration
   */
  loadBusinessRules() {
    const businessRulesPath = path.join(__dirname, 'business-rules');
    
    if (fs.existsSync(businessRulesPath)) {
      const ruleFiles = fs.readdirSync(businessRulesPath).filter(file => file.endsWith('.js'));
      
      for (const file of ruleFiles) {
        const ruleName = path.basename(file, '.js');
        this.businessRules[ruleName] = require(path.join(businessRulesPath, file));
      }
    }
  }

  /**
   * Validate required configuration values
   */
  validateConfiguration() {
    const required = [
      'server.port',
      'database.host',
      'database.name',
      'security.jwtSecret'
    ];

    for (const key of required) {
      const value = this.get(key);
      if (value === undefined || value === null || value === '') {
        throw new Error(`Required configuration missing: ${key}`);
      }
    }

    // Validate JWT secret in production
    if (this.environment === 'production' && this.config.security.jwtSecret === 'default-secret-change-in-production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  }

  /**
   * Get configuration value by dot notation path
   */
  get(path, defaultValue = undefined) {
    return this.getNestedValue(this.config, path, defaultValue);
  }

  /**
   * Get business rule configuration
   */
  getBusinessRule(ruleName, defaultValue = {}) {
    return this.businessRules[ruleName] || defaultValue;
  }

  /**
   * Get external service configuration
   */
  getExternalService(serviceName) {
    return this.get(`externalServices.${serviceName}`, {});
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return this.config.database;
  }

  /**
   * Get Redis configuration
   */
  getRedisConfig() {
    return this.config.redis;
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return this.config.security;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.config.logging;
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig() {
    return this.config.monitoring;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Get environment name
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Check if running in production
   */
  isProduction() {
    return this.environment === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment() {
    return this.environment === 'development';
  }

  /**
   * Check if running in test
   */
  isTest() {
    return this.environment === 'test';
  }

  /**
   * Helper method to get nested object values
   */
  getNestedValue(obj, path, defaultValue) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Deep merge two objects
   */
  mergeDeep(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Reload configuration (useful for hot reloading in development)
   */
  reload() {
    // Clear require cache for configuration files
    const configDir = __dirname;
    Object.keys(require.cache).forEach(key => {
      if (key.startsWith(configDir)) {
        delete require.cache[key];
      }
    });

    this.loadConfiguration();
  }
}

// Create singleton instance
const configManager = new ConfigurationManager();

module.exports = configManager;