const config = require('./index');

/**
 * Database Configuration Helper
 * Provides database connection configuration and utilities
 */
class DatabaseConfig {
  constructor() {
    this.config = config.getDatabaseConfig();
  }

  /**
   * Get PostgreSQL connection configuration
   */
  getPostgreSQLConfig() {
    return {
      host: this.config.host,
      port: this.config.port,
      database: this.config.name,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      
      // Connection pool settings
      max: this.config.poolSize,
      min: 2,
      acquire: this.config.connectionTimeout,
      idle: 10000,
      
      // Additional options
      logging: this.config.logging ? console.log : false,
      dialectOptions: {
        ssl: this.config.ssl ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    };
  }

  /**
   * Get Redis connection configuration
   */
  getRedisConfig() {
    const redisConfig = config.getRedisConfig();
    
    return {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      
      // Connection options
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      
      // TLS configuration for production
      ...(redisConfig.tls && {
        tls: {
          rejectUnauthorized: false
        }
      })
    };
  }

  /**
   * Get connection string for PostgreSQL
   */
  getConnectionString() {
    const { host, port, name, username, password, ssl } = this.config;
    const sslParam = ssl ? '?sslmode=require' : '';
    
    return `postgresql://${username}:${password}@${host}:${port}/${name}${sslParam}`;
  }

  /**
   * Get migration configuration
   */
  getMigrationConfig() {
    return {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
      extension: 'js'
    };
  }

  /**
   * Get seed configuration
   */
  getSeedConfig() {
    return {
      directory: './src/database/seeds',
      extension: 'js'
    };
  }

  /**
   * Validate database configuration
   */
  validate() {
    const required = ['host', 'port', 'name', 'username'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required database configuration: ${missing.join(', ')}`);
    }

    // Validate in production
    if (config.isProduction()) {
      if (!this.config.password) {
        throw new Error('Database password is required in production');
      }
      
      if (!this.config.ssl) {
        console.warn('Warning: SSL is not enabled for database connection in production');
      }
    }

    return true;
  }
}

module.exports = new DatabaseConfig();