/**
 * Production Environment Configuration
 */
module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 8080,
    host: '0.0.0.0',
    trustProxy: true,
    requestTimeout: 30000
  },
  
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: true,
    poolSize: parseInt(process.env.DB_POOL_SIZE) || 20,
    connectionTimeout: 10000,
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
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 14,
    rateLimitWindow: 900000, // 15 minutes
    rateLimitMax: 100,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    auditEnabled: true,
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555
  },
  
  monitoring: {
    healthCheckInterval: 30000,
    metricsEnabled: true,
    tracingEnabled: true,
    alertingEnabled: true
  },
  
  features: {
    mockExternalServices: false,
    detailedErrorMessages: false,
    hotReload: false,
    debugMode: false,
    performanceOptimized: true
  },
  
  externalServices: {
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