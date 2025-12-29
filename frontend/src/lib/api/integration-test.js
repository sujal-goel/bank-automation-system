/**
 * Integration Test Suite for Frontend-Backend Communication
 * Tests all critical API endpoints and authentication flow
 */

import { apiClient } from './client';

class IntegrationTester {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  /**
   * Log test result
   */
  logResult(testName, success, message, data = null) {
    const result = {
      test: testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
    
    if (data) {
      console.log('  Data:', data);
    }
  }

  /**
   * Test backend health endpoint
   */
  async testBackendHealth() {
    try {
      const response = await fetch('http://localhost:3000/health');
      const data = await response.json();
      
      if (response.ok && data.status === 'healthy') {
        this.logResult('Backend Health Check', true, 'Backend is healthy', data);
        return true;
      } else {
        this.logResult('Backend Health Check', false, 'Backend is not healthy', data);
        return false;
      }
    } catch (error) {
      this.logResult('Backend Health Check', false, `Backend connection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test API Gateway health
   */
  async testApiGatewayHealth() {
    try {
      const response = await fetch('http://localhost:3000/api/health');
      const data = await response.json();
      
      if (response.ok && data.status === 'healthy') {
        this.logResult('API Gateway Health', true, 'API Gateway is healthy', data);
        return true;
      } else {
        this.logResult('API Gateway Health', false, 'API Gateway is not healthy', data);
        return false;
      }
    } catch (error) {
      this.logResult('API Gateway Health', false, `API Gateway connection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test authentication with default admin user
   */
  async testAuthentication() {
    try {
      const loginData = {
        email: 'admin@bank.com',
        password: 'Admin@123',
      };

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        this.authToken = data.token;
        this.logResult('Authentication', true, 'Login successful', { 
          user: data.user?.email,
          role: data.user?.role, 
        });
        return true;
      } else {
        this.logResult('Authentication', false, `Login failed: ${data.error || 'Unknown error'}`, data);
        return false;
      }
    } catch (error) {
      this.logResult('Authentication', false, `Authentication request failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test authenticated API request
   */
  async testAuthenticatedRequest() {
    if (!this.authToken) {
      this.logResult('Authenticated Request', false, 'No auth token available');
      return false;
    }

    try {
      const response = await fetch('http://localhost:3000/api/status', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        this.logResult('Authenticated Request', true, 'Authenticated API request successful', data);
        return true;
      } else {
        this.logResult('Authenticated Request', false, `Authenticated request failed: ${data.error || 'Unknown error'}`, data);
        return false;
      }
    } catch (error) {
      this.logResult('Authenticated Request', false, `Authenticated request failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test CORS configuration
   */
  async testCorsConfiguration() {
    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3001',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });

      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
      };

      if (corsHeaders['access-control-allow-origin']) {
        this.logResult('CORS Configuration', true, 'CORS is properly configured', corsHeaders);
        return true;
      } else {
        this.logResult('CORS Configuration', false, 'CORS headers missing', corsHeaders);
        return false;
      }
    } catch (error) {
      this.logResult('CORS Configuration', false, `CORS test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test Next.js API proxy
   */
  async testNextjsProxy() {
    try {
      // This should be called from the frontend to test the proxy
      const response = await fetch('/api/health');
      const data = await response.json();

      if (response.ok && data.status === 'healthy') {
        this.logResult('Next.js API Proxy', true, 'API proxy is working', data);
        return true;
      } else {
        this.logResult('Next.js API Proxy', false, 'API proxy failed', data);
        return false;
      }
    } catch (error) {
      this.logResult('Next.js API Proxy', false, `API proxy test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test database connectivity through API
   */
  async testDatabaseConnectivity() {
    try {
      const response = await fetch('http://localhost:3000/health/detailed');
      const data = await response.json();

      if (response.ok && data.database?.status === 'healthy') {
        this.logResult('Database Connectivity', true, 'Database is connected and healthy', data.database);
        return true;
      } else {
        this.logResult('Database Connectivity', false, 'Database connection issues', data.database || data);
        return false;
      }
    } catch (error) {
      this.logResult('Database Connectivity', false, `Database test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting Frontend-Backend Integration Tests...\n');
    
    const tests = [
      () => this.testBackendHealth(),
      () => this.testApiGatewayHealth(),
      () => this.testDatabaseConnectivity(),
      () => this.testCorsConfiguration(),
      () => this.testAuthentication(),
      () => this.testAuthenticatedRequest(),
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    for (const test of tests) {
      const result = await test();
      if (result) passedTests++;
      console.log(''); // Add spacing between tests
    }

    // Summary
    console.log('📊 Integration Test Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All integration tests passed! Frontend-Backend integration is working correctly.');
    } else {
      console.log('⚠️  Some integration tests failed. Please check the issues above.');
    }

    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      results: this.results,
    };
  }

  /**
   * Run tests that can be executed from the frontend (through Next.js proxy)
   */
  async runFrontendTests() {
    console.log('🌐 Starting Frontend-side Integration Tests...\n');
    
    const tests = [
      () => this.testNextjsProxy(),
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    for (const test of tests) {
      const result = await test();
      if (result) passedTests++;
      console.log(''); // Add spacing between tests
    }

    // Summary
    console.log('📊 Frontend Test Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      results: this.results,
    };
  }
}

export default IntegrationTester;