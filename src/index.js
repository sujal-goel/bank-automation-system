const express = require('express');
const config = require('./config');
const { apiGateway } = require('./gateway/api-gateway');
const HealthMonitor = require('./services/health-monitor');
const db = require('./database/connection');

const app = express();
const PORT = config.get('server.port');
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Initialize health monitor
const healthMonitor = new HealthMonitor();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', config.get('server.trustProxy'));

// Middleware
const bodyLimit = config.get('server.bodyLimit');
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Serverless-optimized database initialization
let dbInitialized = false;
const initializeDatabase = async () => {
  if (!dbInitialized && !isServerless) {
    try {
      await db.initialize();
      await db.runMigrations();
      dbInitialized = true;
      console.log('Database initialized and migrations completed');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
};

// Lazy database initialization middleware for serverless
app.use(async (req, res, next) => {
  if (isServerless && !dbInitialized) {
    try {
      await db.initialize();
      dbInitialized = true;
    } catch (error) {
      console.error('Serverless database initialization failed:', error);
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Please try again in a moment',
        timestamp: new Date().toISOString()
      });
    }
  }
  req.healthMonitor = healthMonitor;
  next();
});

// API Gateway
app.use('/api', apiGateway);

// Serverless-optimized health check endpoints
app.get('/health', async (req, res) => {
  try {
    // Quick health check for load balancers
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.getEnvironment(),
      serverless: isServerless
    };

    // Add database health if available
    if (dbInitialized || !isServerless) {
      try {
        const dbHealth = await db.healthCheck();
        health.database = {
          status: dbHealth.status,
          provider: dbHealth.provider || 'Supabase PostgreSQL'
        };
        
        if (dbHealth.status !== 'healthy') {
          health.status = 'degraded';
        }
      } catch (error) {
        health.database = { status: 'unhealthy', error: error.message };
        health.status = 'degraded';
      }
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      serverless: isServerless
    });
  }
});

app.get('/health/detailed', async (req, res) => {
  try {
    const healthReport = await healthMonitor.performHealthCheck();
    
    // Add database health check
    if (dbInitialized || !isServerless) {
      try {
        const dbHealth = await db.healthCheck();
        healthReport.database = dbHealth;
        
        // Update overall status based on database health
        if (dbHealth.status !== 'healthy') {
          healthReport.system.status = 'unhealthy';
        }
      } catch (error) {
        healthReport.database = { status: 'unhealthy', error: error.message };
        healthReport.system.status = 'degraded';
      }
    }

    // Add serverless-specific information
    healthReport.deployment = {
      serverless: isServerless,
      platform: process.env.VERCEL ? 'Vercel' : (process.env.AWS_LAMBDA_FUNCTION_NAME ? 'AWS Lambda' : 'Traditional'),
      region: process.env.VERCEL_REGION || process.env.AWS_REGION || 'unknown',
      environment: config.getEnvironment()
    };
    
    const statusCode = healthReport.system.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthReport);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      serverless: isServerless
    });
  }
});

// Database-specific health endpoint
app.get('/health/database', async (req, res) => {
  try {
    if (!dbInitialized && isServerless) {
      await db.initialize();
      dbInitialized = true;
    }
    
    const dbHealth = await db.healthCheck();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(dbHealth);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      provider: 'Supabase PostgreSQL'
    });
  }
});

// Service registry endpoints (simplified for serverless)
app.get('/services', (req, res) => {
  const services = healthMonitor.discoverServices(req.query);
  res.json({
    services,
    total: services.length,
    timestamp: new Date().toISOString(),
    serverless: isServerless
  });
});

app.get('/services/stats', (req, res) => {
  const stats = healthMonitor.serviceRegistry.getStats();
  res.json({
    ...stats,
    serverless: isServerless,
    timestamp: new Date().toISOString()
  });
});

// Circuit breaker status endpoint
app.get('/circuit-breakers', (req, res) => {
  const healthReport = healthMonitor.getHealthReport();
  res.json({
    circuitBreakers: healthReport.circuitBreakers,
    timestamp: new Date().toISOString(),
    serverless: isServerless
  });
});

// Serve static files (disabled in serverless)
if (!isServerless) {
  app.use('/public', express.static('public'));
}

// API documentation endpoint (public)
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'Banking Process Automation API',
    version: '1.0.0',
    description: 'Comprehensive banking process automation system with Supabase integration',
    deployment: {
      serverless: isServerless,
      platform: process.env.VERCEL ? 'Vercel' : (process.env.AWS_LAMBDA_FUNCTION_NAME ? 'AWS Lambda' : 'Traditional'),
      database: 'Supabase PostgreSQL'
    },
    endpoints: {
      authentication: {
        'POST /api/auth/login': 'Authenticate user and get JWT token',
        'POST /api/auth/refresh': 'Refresh JWT token'
      },
      modules: {
        'GET /api/accounts/*': 'Account Opening Module (requires bank_officer or admin role)',
        'GET /api/loans/*': 'Loan Processing Module (requires bank_officer or admin role)',
        'GET /api/kyc/*': 'KYC Module (requires compliance_officer, bank_officer, or admin role)',
        'GET /api/aml/*': 'AML Module (requires compliance_officer or admin role)',
        'GET /api/transactions/*': 'Transaction Processing Module (requires bank_officer, customer, or admin role)',
        'GET /api/payments/*': 'Payment Processing Module (requires bank_officer, customer, or admin role)',
        'GET /api/audit/*': 'Audit and Compliance Module (requires compliance_officer or admin role)'
      },
      monitoring: {
        'GET /health': 'Simple health check for load balancers',
        'GET /health/detailed': 'Comprehensive health report with all components',
        'GET /health/database': 'Database-specific health check',
        'GET /services': 'Service discovery endpoint with optional query filters',
        'GET /services/stats': 'Service registry statistics',
        'GET /circuit-breakers': 'Circuit breaker status for all services'
      }
    },
    rateLimits: {
      general: '100 requests per 15 minutes',
      authentication: '5 requests per 15 minutes',
      transactions: '10 requests per minute'
    },
    features: {
      serviceDiscovery: 'Dynamic service discovery with health monitoring',
      circuitBreaker: 'Circuit breaker pattern for resilience',
      supabaseIntegration: 'Optimized for Supabase PostgreSQL',
      serverlessOptimized: isServerless
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Banking Process Automation API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: config.getEnvironment(),
    serverless: isServerless,
    database: 'Supabase PostgreSQL',
    endpoints: {
      health: '/health',
      documentation: '/api-docs',
      api: '/api'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableEndpoints: ['/health', '/api-docs', '/api', '/services']
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Application Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    serverless: isServerless
  });
});

// Graceful shutdown handling (not applicable in serverless)
if (!isServerless) {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    healthMonitor.shutdown();
    await db.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    healthMonitor.shutdown();
    await db.close();
    process.exit(0);
  });
}

// Server startup (only for traditional deployment)
if (!isServerless) {
  app.listen(PORT, config.get('server.host'), async () => {
    console.log(`Banking Process Automation System running on ${config.get('server.host')}:${PORT}`);
    console.log(`Environment: ${config.getEnvironment()}`);
    console.log(`Database: Supabase PostgreSQL`);
    console.log(`API Documentation: http://${config.get('server.host')}:${PORT}/api-docs`);
    console.log(`Health Check: http://${config.get('server.host')}:${PORT}/health`);
    
    // Initialize database connection
    await initializeDatabase();
    
    // Register this main service with the health monitor
    healthMonitor.registerService({
      name: 'api-gateway',
      host: config.get('server.host'),
      port: PORT,
      version: '1.0.0',
      endpoints: ['/api', '/health', '/services'],
      metadata: { 
        type: 'gateway', 
        role: 'main',
        environment: config.getEnvironment(),
        database: 'Supabase PostgreSQL',
        configLoaded: true
      }
    });
  });
} else {
  console.log('Banking Process Automation API - Serverless Mode');
  console.log(`Environment: ${config.getEnvironment()}`);
  console.log(`Database: Supabase PostgreSQL`);
  console.log('Ready to handle requests...');
}

module.exports = app;