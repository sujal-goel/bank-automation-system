const EventEmitter = require('events');

/**
 * Circuit Breaker implementation for external service calls
 * Prevents cascading failures by monitoring service health and failing fast
 */
class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration options
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    this.expectedErrors = options.expectedErrors || [];
    
    // State management
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalTimeouts: 0,
      totalRejected: 0,
      averageResponseTime: 0,
      lastRequest: null
    };
    
    // Request tracking for monitoring period
    this.recentRequests = [];
    
    console.log(`Circuit breaker initialized with threshold: ${this.failureThreshold}, timeout: ${this.recoveryTimeout}ms`);
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Function to execute (should return a Promise)
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise} Result of the function or rejection if circuit is open
   */
  async execute(fn, ...args) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    this.stats.lastRequest = new Date();

    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        this.stats.totalRejected++;
        const error = new Error('Circuit breaker is OPEN');
        error.code = 'CIRCUIT_OPEN';
        this.emit('rejected', error);
        throw error;
      } else {
        // Transition to half-open state
        this.state = 'HALF_OPEN';
        this.emit('stateChanged', 'HALF_OPEN');
        console.log('Circuit breaker transitioning to HALF_OPEN state');
      }
    }

    try {
      // Execute the function with timeout
      const result = await this.executeWithTimeout(fn, args, startTime);
      this.onSuccess(startTime);
      return result;
    } catch (error) {
      this.onFailure(error, startTime);
      throw error;
    }
  }

  /**
   * Execute function with timeout protection
   * @param {Function} fn - Function to execute
   * @param {Array} args - Function arguments
   * @param {number} startTime - Start time for metrics
   * @returns {Promise} Function result
   */
  async executeWithTimeout(fn, args, startTime) {
    const timeout = this.recoveryTimeout / 2; // Use half of recovery timeout as execution timeout
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stats.totalTimeouts++;
        const error = new Error(`Circuit breaker timeout after ${timeout}ms`);
        error.code = 'CIRCUIT_TIMEOUT';
        reject(error);
      }, timeout);

      try {
        const result = await fn(...args);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle successful execution
   * @param {number} startTime - Request start time
   */
  onSuccess(startTime) {
    const responseTime = Date.now() - startTime;
    this.updateResponseTimeStats(responseTime);
    
    this.stats.totalSuccesses++;
    this.successCount++;
    this.addRecentRequest(true, responseTime);

    if (this.state === 'HALF_OPEN') {
      // Reset and close circuit after successful call in half-open state
      this.reset();
      this.emit('stateChanged', 'CLOSED');
      console.log('Circuit breaker reset to CLOSED state after successful call');
    }

    this.emit('success', { responseTime, state: this.state });
  }

  /**
   * Handle failed execution
   * @param {Error} error - The error that occurred
   * @param {number} startTime - Request start time
   */
  onFailure(error, startTime) {
    const responseTime = Date.now() - startTime;
    this.updateResponseTimeStats(responseTime);
    
    // Check if this is an expected error that shouldn't trigger circuit breaker
    if (this.isExpectedError(error)) {
      this.emit('expectedError', error);
      return;
    }

    this.stats.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.addRecentRequest(false, responseTime);

    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.openCircuit();
    }

    this.emit('failure', { error, responseTime, state: this.state, failureCount: this.failureCount });
  }

  /**
   * Check if error is expected and shouldn't trigger circuit breaker
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is expected
   */
  isExpectedError(error) {
    return this.expectedErrors.some(expectedError => {
      if (typeof expectedError === 'string') {
        return error.message.includes(expectedError) || error.code === expectedError;
      }
      if (expectedError instanceof RegExp) {
        return expectedError.test(error.message);
      }
      if (typeof expectedError === 'function') {
        return expectedError(error);
      }
      return false;
    });
  }

  /**
   * Determine if circuit should be opened
   * @returns {boolean} True if circuit should be opened
   */
  shouldOpenCircuit() {
    if (this.state === 'OPEN') return false;

    // Check failure threshold
    if (this.failureCount >= this.failureThreshold) {
      return true;
    }

    // Check failure rate in monitoring period
    const recentFailures = this.recentRequests.filter(req => !req.success).length;
    const recentTotal = this.recentRequests.length;
    
    if (recentTotal >= this.failureThreshold) {
      const failureRate = recentFailures / recentTotal;
      return failureRate >= 0.5; // 50% failure rate
    }

    return false;
  }

  /**
   * Open the circuit breaker
   */
  openCircuit() {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + this.recoveryTimeout;
    this.emit('stateChanged', 'OPEN');
    console.log(`Circuit breaker OPENED. Next attempt at: ${new Date(this.nextAttemptTime)}`);
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.recentRequests = [];
  }

  /**
   * Add request to recent requests tracking
   * @param {boolean} success - Whether request was successful
   * @param {number} responseTime - Response time in milliseconds
   */
  addRecentRequest(success, responseTime) {
    const now = Date.now();
    this.recentRequests.push({
      success,
      responseTime,
      timestamp: now
    });

    // Remove requests older than monitoring period
    this.recentRequests = this.recentRequests.filter(
      req => now - req.timestamp <= this.monitoringPeriod
    );
  }

  /**
   * Update response time statistics
   * @param {number} responseTime - Response time in milliseconds
   */
  updateResponseTimeStats(responseTime) {
    const totalRequests = this.stats.totalSuccesses + this.stats.totalFailures;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Get current circuit breaker state and statistics
   * @returns {Object} Current state and stats
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      stats: { ...this.stats },
      recentRequests: this.recentRequests.length,
      configuration: {
        failureThreshold: this.failureThreshold,
        recoveryTimeout: this.recoveryTimeout,
        monitoringPeriod: this.monitoringPeriod
      }
    };
  }

  /**
   * Force circuit breaker to open state (for testing or manual intervention)
   */
  forceOpen() {
    this.openCircuit();
    console.log('Circuit breaker manually forced to OPEN state');
  }

  /**
   * Force circuit breaker to closed state (for testing or manual intervention)
   */
  forceClosed() {
    this.reset();
    this.emit('stateChanged', 'CLOSED');
    console.log('Circuit breaker manually forced to CLOSED state');
  }

  /**
   * Check if circuit breaker is healthy
   * @returns {boolean} True if circuit is closed or half-open
   */
  isHealthy() {
    return this.state !== 'OPEN';
  }
}

module.exports = CircuitBreaker;