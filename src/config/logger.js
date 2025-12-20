const config = require('./index');

/**
 * Structured Logging Configuration
 * Provides consistent logging across the application with structured output
 */
class Logger {
  constructor() {
    this.config = config.getLoggingConfig();
    this.level = this.config.level || 'info';
    this.format = this.config.format || 'json';
    this.auditEnabled = this.config.auditEnabled || false;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
  }

  /**
   * Format log message based on configuration
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      environment: config.getEnvironment(),
      ...metadata
    };

    if (this.format === 'json') {
      return JSON.stringify(logEntry);
    } else {
      // Pretty format for development
      const metaStr = Object.keys(metadata).length > 0 
        ? `\n  ${JSON.stringify(metadata, null, 2)}`
        : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Log error message
   */
  error(message, metadata = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, metadata));
    }
  }

  /**
   * Log warning message
   */
  warn(message, metadata = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, metadata));
    }
  }

  /**
   * Log info message
   */
  info(message, metadata = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, metadata));
    }
  }

  /**
   * Log debug message
   */
  debug(message, metadata = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, metadata));
    }
  }

  /**
   * Log trace message
   */
  trace(message, metadata = {}) {
    if (this.shouldLog('trace')) {
      console.log(this.formatMessage('trace', message, metadata));
    }
  }

  /**
   * Log audit event
   */
  audit(action, details = {}) {
    if (this.auditEnabled) {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        type: 'audit',
        action,
        ...details
      };
      
      console.log(JSON.stringify(auditEntry));
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req, res, duration) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 500) {
      this.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      this.warn('HTTP Request Warning', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  /**
   * Log database query
   */
  logQuery(query, duration, error = null) {
    const logData = {
      query: query.substring(0, 200), // Truncate long queries
      duration: `${duration}ms`
    };

    if (error) {
      this.error('Database Query Error', { ...logData, error: error.message });
    } else {
      this.debug('Database Query', logData);
    }
  }

  /**
   * Log external service call
   */
  logExternalCall(service, endpoint, duration, statusCode, error = null) {
    const logData = {
      service,
      endpoint,
      duration: `${duration}ms`,
      statusCode
    };

    if (error) {
      this.error('External Service Error', { ...logData, error: error.message });
    } else {
      this.info('External Service Call', logData);
    }
  }

  /**
   * Log business event
   */
  logBusinessEvent(eventType, details = {}) {
    this.info(`Business Event: ${eventType}`, details);
    
    if (this.auditEnabled) {
      this.audit(eventType, details);
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    const childLogger = Object.create(this);
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  /**
   * Express middleware for request logging
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Log request
      this.debug('Incoming Request', {
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      // Capture response
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        originalSend.call(this, data);
        
        // Log after response is sent
        process.nextTick(() => {
          logger.logRequest(req, res, duration);
        });
      };

      next();
    };
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;