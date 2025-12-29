/**
 * Production Environment Configuration
 * Optimized for production deployment with Supabase and enhanced security
 */
module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: true,
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    bodyLimit: process.env.BODY_LIMIT || '10mb'
  },
  
  database: {
    // Support both connection string and individual parameters
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    
    host: process.env.DB_HOST || process.env.SUPABASE_HOST,
    port: parseInt(process.env.DB_PORT || process.env.SUPABASE_PORT) || 5432,
    name: process.env.DB_NAME || process.env.SUPABASE_DB_NAME || 'postgres',
    username: process.env.DB_USERNAME || process.env.SUPABASE_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.SUPABASE_PASSWORD,
    
    ssl: true, // Always use SSL in production
    poolSize: parseInt(process.env.DB_POOL_SIZE) || (process.env.VERCEL ? 1 : 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    
    // Production-specific settings
    schema: process.env.DB_SCHEMA || 'public',
    searchPath: process.env.DB_SEARCH_PATH || 'public',
    logging: false
  },
  
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    tls: process.env.REDIS_TLS === 'true'
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET, // Must be set in production
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    corsOrigins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      ['https://yourdomain.com']
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'warn', // Less verbose in production
    format: 'json',
    auditEnabled: true,
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555
  },
  
  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    metricsEnabled: true,
    tracingEnabled: process.env.TRACING_ENABLED === 'true',
    alertingEnabled: true
  },
  
  features: {
    mockExternalServices: false,
    detailedErrorMessages: false,
    hotReload: false,
    debugMode: false,
    performanceOptimized: true,
    accountOpening: true,
    loanProcessing: true,
    kycVerification: true,
    auditLogging: true,
    rateLimiting: true,
    cors: true,
    helmet: true,
    compression: true
  },
  
  // Supabase integration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    schema: 'public'
  },
  
  externalServices: {
    googleTranslate: {
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
      enabled: !!process.env.GOOGLE_TRANSLATE_API_KEY
    },
    
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    },

    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        from: process.env.SMTP_FROM || 'Banking System <noreply@yourdomain.com>'
      }
    },
    
    creditBureau: {
      cibil: {
        baseUrl: process.env.CIBIL_API_URL,
        apiKey: process.env.CIBIL_API_KEY,
        timeout: parseInt(process.env.CIBIL_TIMEOUT) || 10000,
        retryAttempts: parseInt(process.env.CIBIL_RETRY_ATTEMPTS) || 3,
        mockMode: false
      },
      experian: {
        baseUrl: process.env.EXPERIAN_API_URL,
        apiKey: process.env.EXPERIAN_API_KEY,
        timeout: parseInt(process.env.EXPERIAN_TIMEOUT) || 10000,
        retryAttempts: parseInt(process.env.EXPERIAN_RETRY_ATTEMPTS) || 3,
        mockMode: false
      },
      equifax: {
        baseUrl: process.env.EQUIFAX_API_URL,
        apiKey: process.env.EQUIFAX_API_KEY,
        timeout: parseInt(process.env.EQUIFAX_TIMEOUT) || 10000,
        retryAttempts: parseInt(process.env.EQUIFAX_RETRY_ATTEMPTS) || 3,
        mockMode: false
      }
    },
    
    governmentDatabases: {
      aadhaar: {
        baseUrl: process.env.AADHAAR_API_URL,
        apiKey: process.env.AADHAAR_API_KEY,
        timeout: parseInt(process.env.AADHAAR_TIMEOUT) || 15000,
        mockMode: false
      },
      pan: {
        baseUrl: process.env.PAN_API_URL,
        apiKey: process.env.PAN_API_KEY,
        timeout: parseInt(process.env.PAN_TIMEOUT) || 15000,
        mockMode: false
      },
      passport: {
        baseUrl: process.env.PASSPORT_API_URL,
        apiKey: process.env.PASSPORT_API_KEY,
        timeout: parseInt(process.env.PASSPORT_TIMEOUT) || 15000,
        mockMode: false
      }
    },
    
    paymentNetworks: {
      swift: {
        baseUrl: process.env.SWIFT_API_URL,
        memberCode: process.env.SWIFT_MEMBER_CODE,
        certificatePath: process.env.SWIFT_CERT_PATH,
        privateKeyPath: process.env.SWIFT_KEY_PATH,
        timeout: parseInt(process.env.SWIFT_TIMEOUT) || 60000,
        mockMode: false
      },
      rtgs: {
        baseUrl: process.env.RTGS_API_URL,
        bankCode: process.env.RTGS_BANK_CODE,
        certificatePath: process.env.RTGS_CERT_PATH,
        timeout: parseInt(process.env.RTGS_TIMEOUT) || 30000,
        mockMode: false
      },
      neft: {
        baseUrl: process.env.NEFT_API_URL,
        bankCode: process.env.NEFT_BANK_CODE,
        timeout: parseInt(process.env.NEFT_TIMEOUT) || 30000,
        mockMode: false
      },
      upi: {
        baseUrl: process.env.UPI_API_URL,
        vpa: process.env.UPI_VPA,
        merchantId: process.env.UPI_MERCHANT_ID,
        timeout: parseInt(process.env.UPI_TIMEOUT) || 15000,
        mockMode: false
      }
    },
    
    notifications: {
      email: {
        provider: process.env.EMAIL_PROVIDER || 'sendgrid',
        apiKey: process.env.EMAIL_API_KEY,
        fromAddress: process.env.EMAIL_FROM_ADDRESS,
        templatePath: process.env.EMAIL_TEMPLATE_PATH
      },
      sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        apiKey: process.env.SMS_API_KEY,
        fromNumber: process.env.SMS_FROM_NUMBER
      },
      push: {
        provider: process.env.PUSH_PROVIDER || 'firebase',
        apiKey: process.env.PUSH_API_KEY,
        projectId: process.env.PUSH_PROJECT_ID
      }
    }
  }
};