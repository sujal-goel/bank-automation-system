const { Pool, Client } = require('pg');
const config = require('../config');

/**
 * Supabase Database Connection Manager
 * Optimized for serverless deployment on Vercel with Supabase PostgreSQL
 */
class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  }

  /**
   * Initialize database connection pool optimized for Supabase and Vercel
   */
  async initialize() {
    try {
      const dbConfig = config.getDatabaseConfig();
      
      console.log('Initializing Supabase database connection:', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.name,
        user: dbConfig.username,
        ssl: dbConfig.ssl,
        serverless: this.isServerless
      });
      
      // Serverless-optimized connection settings
      const poolConfig = {
        connectionString: dbConfig.connectionString || this.buildConnectionString(dbConfig),
        ssl: dbConfig.ssl !== false ? { rejectUnauthorized: false } : false,
        
        // Serverless-optimized pool settings
        max: this.isServerless ? 1 : (dbConfig.poolSize || 5),
        min: 0, // No minimum connections for serverless
        idleTimeoutMillis: this.isServerless ? 1000 : 10000, // Quick cleanup for serverless
        connectionTimeoutMillis: this.isServerless ? 5000 : 10000,
        acquireTimeoutMillis: this.isServerless ? 5000 : 10000,
        
        // Additional Supabase-specific settings
        application_name: 'banking-automation-vercel',
        statement_timeout: 30000, // 30 seconds
        query_timeout: 30000,
        
        // Supabase connection parameters
        options: '--search_path=public'
      };

      this.pool = new Pool(poolConfig);

      // Test the connection
      console.log('Testing Supabase database connection...');
      const testResult = await this.testConnection();
      
      if (testResult.success) {
        this.isConnected = true;
        console.log('Supabase database connection established successfully');
        console.log('Database info:', testResult.info);
      } else {
        throw new Error(testResult.error);
      }
      
      // Set up error handling optimized for serverless
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        this.isConnected = false;
        
        // In serverless, recreate pool on error
        if (this.isServerless) {
          this.pool = null;
        }
      });

      // Handle connection events
      this.pool.on('connect', (client) => {
        console.log('New client connected to Supabase');
        
        // Set session parameters for Supabase
        client.query(`
          SET timezone = 'UTC';
          SET statement_timeout = '30s';
        `).catch(err => console.warn('Failed to set session parameters:', err));
      });

      return this.pool;
    } catch (error) {
      console.error('Failed to initialize Supabase database connection:', error);
      console.error('Database config:', {
        host: config.getDatabaseConfig().host,
        port: config.getDatabaseConfig().port,
        database: config.getDatabaseConfig().name,
        user: config.getDatabaseConfig().username,
        connectionString: config.getDatabaseConfig().connectionString ? 'PROVIDED' : 'NOT_PROVIDED'
      });
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Build connection string for Supabase
   */
  buildConnectionString(dbConfig) {
    const protocol = 'postgresql';
    const auth = `${dbConfig.username}:${encodeURIComponent(dbConfig.password)}`;
    const host = `${dbConfig.host}:${dbConfig.port}`;
    const database = dbConfig.name;
    const sslMode = dbConfig.ssl !== false ? '?sslmode=require' : '';
    
    return `${protocol}://${auth}@${host}/${database}${sslMode}`;
  }

  /**
   * Test database connection with retry logic
   */
  async testConnection(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const client = await this.pool.connect();
        const result = await client.query(`
          SELECT 
            NOW() as current_time,
            version() as version,
            current_database() as database,
            current_user as user
        `);
        
        client.release();
        
        return {
          success: true,
          info: {
            timestamp: result.rows[0].current_time,
            version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
            database: result.rows[0].database,
            user: result.rows[0].user,
            attempt: attempt
          }
        };
      } catch (error) {
        console.warn(`Database connection test attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt === retries) {
          return {
            success: false,
            error: error.message
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Execute a query with parameters (serverless-optimized)
   */
  async query(text, params = []) {
    // Ensure connection exists (lazy initialization for serverless)
    if (!this.pool) {
      await this.initialize();
    }

    if (!this.isConnected) {
      throw new Error('Database not connected to Supabase');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries in development
      if (config.isDevelopment() && duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
      }
      
      // Log query metrics for serverless monitoring
      if (this.isServerless && duration > 5000) {
        console.warn(`Very slow serverless query (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error('Supabase query error:', error.message);
      console.error('Query:', text.substring(0, 200));
      console.error('Params:', params);
      
      // Handle connection errors in serverless
      if (this.isServerless && (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND')) {
        console.log('Attempting to reconnect to Supabase...');
        this.pool = null;
        this.isConnected = false;
        await this.initialize();
        
        // Retry the query once
        return await this.pool.query(text, params);
      }
      
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
   * Begin a transaction (optimized for serverless)
   */
  async beginTransaction() {
    if (!this.pool) {
      await this.initialize();
    }

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
        try {
          await client.query('COMMIT');
        } finally {
          client.release();
        }
      },
      rollback: async () => {
        try {
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }
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
   * Check if database is connected and healthy (Supabase-specific)
   */
  async healthCheck() {
    try {
      if (!this.pool) {
        await this.initialize();
      }

      if (!this.isConnected) {
        return { status: 'unhealthy', error: 'Not connected to Supabase' };
      }

      const result = await this.query(`
        SELECT 
          NOW() as current_time, 
          version() as version,
          current_database() as database,
          pg_database_size(current_database()) as db_size
      `);
      
      const stats = this.getPoolStats();

      return {
        status: 'healthy',
        provider: 'Supabase PostgreSQL',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
        database: result.rows[0].database,
        databaseSize: this.formatBytes(result.rows[0].db_size),
        connectionPool: stats,
        serverless: this.isServerless
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: 'Supabase PostgreSQL',
        error: error.message,
        serverless: this.isServerless
      };
    }
  }

  /**
   * Run database migrations (Supabase-compatible)
   */
  async runMigrations() {
    try {
      console.log('Running Supabase database migrations...');
      
      // Ensure connection
      if (!this.pool) {
        await this.initialize();
      }
      
      // Create migrations table if it doesn't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          checksum VARCHAR(64),
          execution_time_ms INTEGER
        )
      `);

      // Get list of migration files
      const fs = require('fs');
      const path = require('path');
      const migrationsDir = path.join(__dirname, '../../database/migrations');
      
      if (!fs.existsSync(migrationsDir)) {
        console.log('No migrations directory found, skipping migrations');
        return;
      }

      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log(`Found ${migrationFiles.length} migration files`);

      for (const filename of migrationFiles) {
        const existingMigration = await this.queryOne(
          'SELECT * FROM migrations WHERE filename = $1',
          [filename]
        );

        if (!existingMigration) {
          const migrationPath = path.join(migrationsDir, filename);
          const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
          
          // Calculate checksum for integrity
          const crypto = require('crypto');
          const checksum = crypto.createHash('sha256').update(migrationSQL).digest('hex');
          
          console.log(`Executing migration: ${filename}`);
          const startTime = Date.now();
          
          // Execute migration in a transaction
          await this.transaction(async (tx) => {
            await tx.query(migrationSQL);
            await tx.query(
              'INSERT INTO migrations (filename, checksum, execution_time_ms) VALUES ($1, $2, $3)',
              [filename, checksum, Date.now() - startTime]
            );
          });
          
          console.log(`Migration ${filename} executed successfully`);
        } else {
          console.log(`Migration ${filename} already executed`);
        }
      }

      console.log('Supabase database migrations completed');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection (serverless-optimized)
   */
  async close() {
    if (this.pool) {
      try {
        await this.pool.end();
        console.log('Supabase database connection closed');
      } catch (error) {
        console.warn('Error closing database connection:', error.message);
      } finally {
        this.pool = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return {
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
        status: 'not_initialized'
      };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      status: this.isConnected ? 'connected' : 'disconnected'
    };
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Execute raw SQL (for advanced Supabase features)
   */
  async executeRaw(sql, params = []) {
    console.warn('Executing raw SQL - use with caution in production');
    return await this.query(sql, params);
  }

  /**
   * Get database connection info
   */
  getConnectionInfo() {
    const dbConfig = config.getDatabaseConfig();
    return {
      provider: 'Supabase PostgreSQL',
      host: dbConfig.host,
      database: dbConfig.name,
      user: dbConfig.username,
      ssl: dbConfig.ssl !== false,
      serverless: this.isServerless,
      poolStats: this.getPoolStats()
    };
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;