const fs = require('fs');
const path = require('path');

/**
 * Environment Configuration Loader
 * Loads environment variables from .env files based on NODE_ENV
 */
class EnvironmentLoader {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.loadEnvironmentFiles();
  }

  /**
   * Load environment files in order of precedence
   */
  loadEnvironmentFiles() {
    const envFiles = [
      '.env',                           // Base environment file
      `.env.${this.environment}`,       // Environment-specific file
      `.env.${this.environment}.local`, // Local environment overrides
      '.env.local'                      // Local overrides (not in version control)
    ];

    envFiles.forEach(file => {
      this.loadEnvFile(file);
    });
  }

  /**
   * Load a specific .env file
   */
  loadEnvFile(filename) {
    const filePath = path.resolve(process.cwd(), filename);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.parseEnvContent(content, filename);
        console.log(`Loaded environment file: ${filename}`);
      } catch (error) {
        console.warn(`Warning: Could not load ${filename}: ${error.message}`);
      }
    }
  }

  /**
   * Parse .env file content and set environment variables
   */
  parseEnvContent(content, filename) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip empty lines and comments
      line = line.trim();
      if (!line || line.startsWith('#')) {
        return;
      }

      // Parse key=value pairs
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        
        // Only set if not already defined (precedence)
        if (process.env[key] === undefined) {
          process.env[key] = this.parseValue(value);
        }
      } else {
        console.warn(`Warning: Invalid line in ${filename}:${index + 1}: ${line}`);
      }
    });
  }

  /**
   * Parse environment variable value
   */
  parseValue(value) {
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle escape sequences
    value = value.replace(/\\n/g, '\n');
    value = value.replace(/\\r/g, '\r');
    value = value.replace(/\\t/g, '\t');
    value = value.replace(/\\\\/g, '\\');

    return value;
  }

  /**
   * Get current environment
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Validate required environment variables
   */
  validateRequired(requiredVars) {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Get environment variable with default
   */
  get(key, defaultValue = undefined) {
    return process.env[key] || defaultValue;
  }

  /**
   * Set environment variable
   */
  set(key, value) {
    process.env[key] = value;
  }

  /**
   * Check if environment variable exists
   */
  has(key) {
    return key in process.env;
  }

  /**
   * Get all environment variables with prefix
   */
  getWithPrefix(prefix) {
    const result = {};
    
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(prefix)) {
        const newKey = key.substring(prefix.length);
        result[newKey] = process.env[key];
      }
    });
    
    return result;
  }

  /**
   * Create sample .env file for development
   */
  createSampleEnvFile() {
    const sampleContent = `# Banking Process Automation System Environment Configuration
# Copy this file to .env and update the values

# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost
TRUST_PROXY=false
REQUEST_TIMEOUT=30000
BODY_LIMIT=10mb

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banking_automation_dev
DB_USERNAME=dev_user
DB_PASSWORD=dev_password
DB_SSL=false
DB_POOL_SIZE=10
DB_CONNECTION_TIMEOUT=5000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=banking:

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
AUDIT_LOGGING=true
AUDIT_RETENTION_DAYS=2555

# Monitoring Configuration
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
TRACING_ENABLED=true
ALERTING_ENABLED=true

# External Services - Credit Bureaus
CIBIL_API_URL=https://api.cibil.com
CIBIL_API_KEY=your-cibil-api-key
CIBIL_TIMEOUT=10000
CIBIL_RETRY_ATTEMPTS=3

EXPERIAN_API_URL=https://api.experian.com
EXPERIAN_API_KEY=your-experian-api-key
EXPERIAN_TIMEOUT=10000
EXPERIAN_RETRY_ATTEMPTS=3

EQUIFAX_API_URL=https://api.equifax.com
EQUIFAX_API_KEY=your-equifax-api-key
EQUIFAX_TIMEOUT=10000
EQUIFAX_RETRY_ATTEMPTS=3

# External Services - Government Databases
AADHAAR_API_URL=https://api.uidai.gov.in
AADHAAR_API_KEY=your-aadhaar-api-key
AADHAAR_TIMEOUT=15000

PAN_API_URL=https://api.incometax.gov.in
PAN_API_KEY=your-pan-api-key
PAN_TIMEOUT=15000

PASSPORT_API_URL=https://api.passportindia.gov.in
PASSPORT_API_KEY=your-passport-api-key
PASSPORT_TIMEOUT=15000

# External Services - Payment Networks
SWIFT_API_URL=https://api.swift.com
SWIFT_MEMBER_CODE=your-swift-member-code
SWIFT_CERT_PATH=/path/to/swift/certificate.pem
SWIFT_KEY_PATH=/path/to/swift/private-key.pem
SWIFT_TIMEOUT=60000

RTGS_API_URL=https://api.rbi.org.in/rtgs
RTGS_BANK_CODE=your-bank-code
RTGS_CERT_PATH=/path/to/rtgs/certificate.pem
RTGS_TIMEOUT=30000

NEFT_API_URL=https://api.rbi.org.in/neft
NEFT_BANK_CODE=your-bank-code
NEFT_TIMEOUT=30000

UPI_API_URL=https://api.npci.org.in/upi
UPI_VPA=yourbank@upi
UPI_MERCHANT_ID=your-merchant-id
UPI_TIMEOUT=15000

# External Services - Notifications
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM_ADDRESS=noreply@yourbank.com
EMAIL_TEMPLATE_PATH=/path/to/email/templates

SMS_PROVIDER=twilio
SMS_API_KEY=your-sms-api-key
SMS_FROM_NUMBER=+1234567890

PUSH_PROVIDER=firebase
PUSH_API_KEY=your-push-api-key
PUSH_PROJECT_ID=your-firebase-project-id

# Postman API (for testing)
POSTMAN_API_KEY=your-postman-api-key
`;

    const samplePath = path.resolve(process.cwd(), '.env.sample');
    fs.writeFileSync(samplePath, sampleContent);
    console.log('Created sample environment file: .env.sample');
  }
}

// Load environment variables immediately when this module is required
const envLoader = new EnvironmentLoader();

module.exports = envLoader;