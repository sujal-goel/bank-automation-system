const express = require('express');
const config = require('./config');
const { apiGateway } = require('./gateway/api-gateway');
const HealthMonitor = require('./services/health-monitor');
const db = require('./database/connection');

const app = express();
const PORT = config.get('server.port');

// Initialize health monitor
const healthMonitor = new HealthMonitor();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', config.get('server.trustProxy'));

// Middleware
const bodyLimit = config.get('server.bodyLimit');
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Make health monitor available to routes
app.use((req, res, next) => {
  req.healthMonitor = healthMonitor;
  next();
});

// API Gateway
app.use('/api', apiGateway);

// Health check endpoints
app.get('/health', (req, res) => {
  const health = healthMonitor.getSimpleHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/health/detailed', async (req, res) => {
  try {
    const healthReport = await healthMonitor.performHealthCheck();
    
    // Add database health check
    const dbHealth = await db.healthCheck();
    healthReport.database = dbHealth;
    
    // Update overall status based on database health
    if (dbHealth.status !== 'healthy') {
      healthReport.system.status = 'unhealthy';
    }
    
    const statusCode = healthReport.system.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthReport);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Service registry endpoints
app.get('/services', (req, res) => {
  const services = healthMonitor.discoverServices(req.query);
  res.json({
    services,
    total: services.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/services/stats', (req, res) => {
  const stats = healthMonitor.serviceRegistry.getStats();
  res.json(stats);
});

// Circuit breaker status endpoint
app.get('/circuit-breakers', (req, res) => {
  const healthReport = healthMonitor.getHealthReport();
  res.json({
    circuitBreakers: healthReport.circuitBreakers,
    timestamp: new Date().toISOString()
  });
});

// Serve static files
app.use('/public', express.static('public'));

// Signup demo page
app.get('/signup-demo', (req, res) => {
  res.sendFile('public/signup-demo.html', { root: '.' });
});

// Email verification page
app.get('/verify-email', (req, res) => {
  res.sendFile('public/verify-email.html', { root: '.' });
});

// Login page redirect
app.get('/login', (req, res) => {
  res.redirect('/signup-demo');
});

// API documentation endpoint (public)
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'Banking Process Automation API',
    version: '1.0.0',
    description: 'Comprehensive banking process automation system with service discovery and health monitoring',
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
    serviceDiscovery: {
      description: 'Dynamic service discovery with health monitoring',
      features: ['Circuit breaker pattern', 'Load balancing', 'Health checks', 'Service registry']
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Application Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
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

app.listen(PORT, config.get('server.host'), async () => {
  console.log(`Banking Process Automation System running on ${config.get('server.host')}:${PORT}`);
  console.log(`Environment: ${config.getEnvironment()}`);
  console.log(`API Documentation available at http://${config.get('server.host')}:${PORT}/api-docs`);
  console.log(`Health check available at http://${config.get('server.host')}:${PORT}/health`);
  console.log(`Detailed health report available at http://${config.get('server.host')}:${PORT}/health/detailed`);
  console.log(`Service discovery available at http://${config.get('server.host')}:${PORT}/services`);
  
  // Initialize database connection
  try {
    await db.initialize();
    await db.runMigrations();
    console.log('Database initialized and migrations completed');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
  
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
      configLoaded: true
    }
  });
});

module.exports = app;