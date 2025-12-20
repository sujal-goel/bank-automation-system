/**
 * Development Environment Configuration
 */
module.exports = {
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  database: {
    host: 'localhost',
    port: 5432,
    name: 'banking_automation_dev',
    username: 'banking_user',
    ssl: false,
    poolSize: 5,
    logging: true
  },
  
  redis: {
    host: 'localhost',
    port: 6379,
    db: 0
  },
  
  security: {
    jwtExpiresIn: '24h',
    bcryptRounds: 10, // Lower for faster development
    rateLimitMax: 1000, // More lenient for development
    corsOrigins: ['http://localhost:3000', 'http://localhost:3001']
  },
  
  logging: {
    level: 'debug',
    format: 'pretty',
    auditEnabled: true
  },
  
  monitoring: {
    healthCheckInterval: 10000, // More frequent in development
    metricsEnabled: true,
    tracingEnabled: true,
    alertingEnabled: false
  },
  
  features: {
    mockExternalServices: true,
    detailedErrorMessages: true,
    hotReload: true,
    debugMode: true
  },
  
  externalServices: {
    creditBureau: {
      cibil: {
        baseUrl: 'http://localhost:4001/mock/cibil',
        apiKey: 'dev-cibil-key',
        timeout: 5000,
        retryAttempts: 2,
        mockMode: true
      },
      experian: {
        baseUrl: 'http://localhost:4002/mock/experian',
        apiKey: 'dev-experian-key',
        timeout: 5000,
        retryAttempts: 2,
        mockMode: true
      },
      equifax: {
        baseUrl: 'http://localhost:4003/mock/equifax',
        apiKey: 'dev-equifax-key',
        timeout: 5000,
        retryAttempts: 2,
        mockMode: true
      }
    },
    
    governmentDatabases: {
      aadhaar: {
        baseUrl: 'http://localhost:4010/mock/aadhaar',
        apiKey: 'dev-aadhaar-key',
        timeout: 10000,
        mockMode: true
      },
      pan: {
        baseUrl: 'http://localhost:4011/mock/pan',
        apiKey: 'dev-pan-key',
        timeout: 10000,
        mockMode: true
      },
      passport: {
        baseUrl: 'http://localhost:4012/mock/passport',
        apiKey: 'dev-passport-key',
        timeout: 10000,
        mockMode: true
      }
    },
    
    paymentNetworks: {
      swift: {
        baseUrl: 'http://localhost:4020/mock/swift',
        memberCode: 'DEV-BANK-CODE',
        timeout: 30000,
        mockMode: true
      },
      rtgs: {
        baseUrl: 'http://localhost:4021/mock/rtgs',
        bankCode: 'DEV001',
        timeout: 15000,
        mockMode: true
      },
      neft: {
        baseUrl: 'http://localhost:4022/mock/neft',
        bankCode: 'DEV001',
        timeout: 15000,
        mockMode: true
      },
      upi: {
        baseUrl: 'http://localhost:4023/mock/upi',
        vpa: 'devbank@upi',
        timeout: 10000,
        mockMode: true
      }
    },
    
    notifications: {
      email: {
        provider: 'mock',
        apiKey: 'dev-email-key',
        fromAddress: 'noreply@devbank.com'
      },
      sms: {
        provider: 'mock',
        apiKey: 'dev-sms-key',
        fromNumber: '+1234567890'
      }
    }
  }
};