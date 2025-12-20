/**
 * Test Environment Configuration
 */
module.exports = {
  server: {
    port: 0, // Random port for testing
    host: 'localhost'
  },
  
  database: {
    host: 'localhost',
    port: 5432,
    name: 'banking_automation_test',
    username: 'test_user',
    ssl: false,
    poolSize: 2,
    logging: false
  },
  
  redis: {
    host: 'localhost',
    port: 6379,
    db: 1 // Different DB for tests
  },
  
  security: {
    jwtSecret: 'test-secret-key-not-for-production',
    jwtExpiresIn: '1h',
    bcryptRounds: 4, // Minimal for fast tests
    rateLimitMax: 10000, // Very lenient for tests
    corsOrigins: ['http://localhost:3000']
  },
  
  logging: {
    level: 'error', // Minimal logging during tests
    format: 'json',
    auditEnabled: false
  },
  
  monitoring: {
    healthCheckInterval: 60000, // Less frequent in tests
    metricsEnabled: false,
    tracingEnabled: false,
    alertingEnabled: false
  },
  
  features: {
    mockExternalServices: true,
    detailedErrorMessages: false,
    hotReload: false,
    debugMode: false,
    fastMode: true
  },
  
  externalServices: {
    creditBureau: {
      cibil: {
        baseUrl: 'http://mock-service/cibil',
        apiKey: 'test-cibil-key',
        timeout: 1000,
        retryAttempts: 1,
        mockMode: true
      },
      experian: {
        baseUrl: 'http://mock-service/experian',
        apiKey: 'test-experian-key',
        timeout: 1000,
        retryAttempts: 1,
        mockMode: true
      },
      equifax: {
        baseUrl: 'http://mock-service/equifax',
        apiKey: 'test-equifax-key',
        timeout: 1000,
        retryAttempts: 1,
        mockMode: true
      }
    },
    
    governmentDatabases: {
      aadhaar: {
        baseUrl: 'http://mock-service/aadhaar',
        apiKey: 'test-aadhaar-key',
        timeout: 1000,
        mockMode: true
      },
      pan: {
        baseUrl: 'http://mock-service/pan',
        apiKey: 'test-pan-key',
        timeout: 1000,
        mockMode: true
      },
      passport: {
        baseUrl: 'http://mock-service/passport',
        apiKey: 'test-passport-key',
        timeout: 1000,
        mockMode: true
      }
    },
    
    paymentNetworks: {
      swift: {
        baseUrl: 'http://mock-service/swift',
        memberCode: 'TEST-BANK-CODE',
        timeout: 1000,
        mockMode: true
      },
      rtgs: {
        baseUrl: 'http://mock-service/rtgs',
        bankCode: 'TEST001',
        timeout: 1000,
        mockMode: true
      },
      neft: {
        baseUrl: 'http://mock-service/neft',
        bankCode: 'TEST001',
        timeout: 1000,
        mockMode: true
      },
      upi: {
        baseUrl: 'http://mock-service/upi',
        vpa: 'testbank@upi',
        timeout: 1000,
        mockMode: true
      }
    },
    
    notifications: {
      email: {
        provider: 'mock',
        apiKey: 'test-email-key',
        fromAddress: 'test@testbank.com'
      },
      sms: {
        provider: 'mock',
        apiKey: 'test-sms-key',
        fromNumber: '+1000000000'
      }
    }
  }
};