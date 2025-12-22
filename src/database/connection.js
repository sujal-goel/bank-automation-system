const { Pool } = require('pg');
const config = require('../config');

/**
 * Database Connection Manager
 * Handles PostgreSQL connections and provides query utilities
 */
class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      const dbConfig = config.getDatabaseConfig();
      
      console.log('Initializing database connection with config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.name,
        user: dbConfig.username,
        ssl: dbConfig.ssl
      });
      
      this.pool = new Pool({
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.name,
        user: dbConfig.username,
        password: dbConfig.password,
        ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
        
        // Connection pool settings
        max: dbConfig.poolSize || 20,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        
        // Additional settings
        application_name: 'banking-automation-system'
      });

      // Test the connection
      console.log('Testing database connection...');
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log('Database connection test successful:', result.rows[0].current_time);
      client.release();
      
      this.isConnected = true;
      console.log('Database connection established successfully');
      
      // Set up error handling
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        this.isConnected = false;
      });

      return this.pool;
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      console.error('Database config:', {
        host: config.getDatabaseConfig().host,
        port: config.getDatabaseConfig().port,
        database: config.getDatabaseConfig().name,
        user: config.getDatabaseConfig().username
      });
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Execute a query with parameters
   */
  async query(text, params = []) {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries in development
      if (config.isDevelopment() && duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, text);
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Execute a query and return the first row
   */
  async queryOne(text, params = []) {
    const result = await this.query(text, params);
    return result.rows[0] || null;
  }

  /**
   * Execute a query and return all rows
   */
  async queryMany(text, params = []) {
    const result = await this.query(text, params);
    return result.rows;
  }

  /**
   * Begin a transaction
   */
  async beginTransaction() {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    
    // Return a transaction object with commit/rollback methods
    return {
      client,
      query: (text, params) => client.query(text, params),
      queryOne: async (text, params) => {
        const result = await client.query(text, params);
        return result.rows[0] || null;
      },
      queryMany: async (text, params) => {
        const result = await client.query(text, params);
        return result.rows;
      },
      commit: async () => {
        await client.query('COMMIT');
        client.release();
      },
      rollback: async () => {
        await client.query('ROLLBACK');
        client.release();
      }
    };
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    const tx = await this.beginTransaction();
    
    try {
      const result = await callback(tx);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  /**
   * Check if database is connected and healthy
   */
  async healthCheck() {
    try {
      if (!this.isConnected || !this.pool) {
        return { status: 'unhealthy', error: 'Not connected' };
      }

      const result = await this.query('SELECT NOW() as current_time, version() as version');
      const stats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };

      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        connectionPool: stats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    try {
      console.log('Running database migrations...');
      
      // Create migrations table if it doesn't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if users table migration has been run
      const existingMigration = await this.queryOne(
        'SELECT * FROM migrations WHERE filename = $1',
        ['001_create_users_table.sql']
      );

      if (!existingMigration) {
        // Read and execute the migration file
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(__dirname, '../../database/migrations/001_create_users_table.sql');
        
        if (fs.existsSync(migrationPath)) {
          const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
          
          // Execute migration in a transaction
          await this.transaction(async (tx) => {
            await tx.query(migrationSQL);
            await tx.query(
              'INSERT INTO migrations (filename) VALUES ($1)',
              ['001_create_users_table.sql']
            );
          });
          
          console.log('Migration 001_create_users_table.sql executed successfully');
        } else {
          console.warn('Migration file not found:', migrationPath);
        }
      } else {
        console.log('Migration 001_create_users_table.sql already executed');
      }

      console.log('Database migrations completed');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('Database connection closed');
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;