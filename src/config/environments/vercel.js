/**
 * Vercel-specific configuration overrides
 * Optimized for serverless deployment with Supabase
 */

module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: '0.0.0.0',
    trustProxy: true, // Required for Vercel
    requestTimeout: 25000, // Vercel has 30s timeout, leave some buffer
    bodyLimit: '10mb'
  },

  database: {
    // Prefer connection string for Vercel
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    
    // Serverless-optimized pool settings
    poolSize: 1, // Single connection for serverless
    connectionTimeout: 5000,
    idleTimeout: 1000, // Quick cleanup
    ssl: true, // Always use SSL in production
    
    // Supabase-specific settings
    schema: 'public',
    searchPath: 'public'
  },

  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '24h',
    bcryptRounds: 10, // Slightly lower for serverless performance
    rateLimitWindow: 900000, // 15 minutes
    rateLimitMax: 200, // Higher limit for production
    corsOrigins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      ['https://your-frontend.vercel.app']
  },

  logging: {
    level: 'info',
    format: 'json',
    auditEnabled: true,
    auditRetentionDays: 2555 // 7 years for compliance
  },

  monitoring: {
    healthCheckInterval: 60000, // Less frequent in serverless
    metricsEnabled: true,
    tracingEnabled: false, // Disable to reduce cold start time
    alertingEnabled: true
  },

  // Vercel-specific features
  vercel: {
    region: process.env.VERCEL_REGION || 'iad1',
    functionTimeout: 25, // seconds
    maxLambdaSize: '50mb'
  },

  // Supabase integration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    schema: 'public'
  },

  // External services configuration
  externalServices: {
    googleTranslate: {
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
      enabled: !!process.env.GOOGLE_TRANSLATE_API_KEY
    },
    
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    },

    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        from: process.env.SMTP_FROM || 'Banking System <noreply@yourdomain.com>'
      },
      enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
    }
  },

  // Feature flags
  features: {
    accountOpening: process.env.FEATURES_ACCOUNT_OPENING !== 'false',
    loanProcessing: process.env.FEATURES_LOAN_PROCESSING !== 'false',
    kycVerification: process.env.FEATURES_KYC_VERIFICATION !== 'false',
    auditLogging: process.env.FEATURES_AUDIT_LOGGING !== 'false',
    
    // Performance features for serverless
    connectionPooling: false, // Disabled for serverless
    caching: true,
    compression: true,
    
    // Security features
    rateLimiting: true,
    cors: true,
    helmet: true
  },

  // Performance optimizations for Vercel
  performance: {
    enableCompression: true,
    enableCaching: true,
    cacheMaxAge: 300, // 5 minutes
    staticMaxAge: 86400, // 1 day for static assets
    
    // Database optimizations
    queryTimeout: 20000, // 20 seconds max query time
    connectionRetries: 2,
    
    // Memory optimizations
    maxMemoryUsage: '512mb',
    gcInterval: 30000 // Garbage collection interval
  }
};