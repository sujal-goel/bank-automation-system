const CreditBureauInterface = require('../services/credit-bureau-interface');
const { CIBILAdapter, ExperianAdapter, EquifaxAdapter } = require('../services/credit-bureau-adapters');
const CreditBureauMockService = require('../services/credit-bureau-mock-service');
const { v4: uuidv4 } = require('uuid');

describe('Credit Bureau Integration', () => {
  let creditBureauInterface;
  let mockService;
  
  const mockCustomerData = {
    customerId: uuidv4(),
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1985-06-15'),
    ssn: '123-45-6789',
    pan: 'ABCDE1234F',
    aadhaar: '123456789012',
    mobileNumber: '9876543210',
    phoneNumber: '555-123-4567',
    email: 'john.doe@example.com',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'ST',
      zipCode: '12345'
    }
  };

  beforeEach(() => {
    // Initialize with mock mode enabled
    creditBureauInterface = new CreditBureauInterface({
      enableMockMode: true,
      timeout: 5000
    });
    
    mockService = new CreditBureauMockService({
      simulateDelay: false, // Disable delay for faster tests
      errorRate: 0 // Disable random errors for predictable tests
    });
  });

  describe('CreditBureauInterface', () => {
    test('should initialize with correct configuration', () => {
      expect(creditBureauInterface).toBeDefined();
      expect(creditBureauInterface.config.enableMockMode).toBe(true);
      expect(creditBureauInterface.config.timeout).toBe(5000);
    });

    test('should validate bureau names correctly', () => {
      expect(() => creditBureauInterface.validateBureau('cibil')).not.toThrow();
      expect(() => creditBureauInterface.validateBureau('experian')).not.toThrow();
      expect(() => creditBureauInterface.validateBureau('equifax')).not.toThrow();
      expect(() => creditBureauInterface.validateBureau('invalid')).toThrow('Invalid bureau');
    });

    test('should validate customer data correctly', () => {
      expect(() => creditBureauInterface.validateCustomerData(mockCustomerData)).not.toThrow();
      
      expect(() => creditBureauInterface.validateCustomerData(null)).toThrow('Customer data is required');
      
      expect(() => creditBureauInterface.validateCustomerData({})).toThrow('Missing required fields');
      
      const invalidDateCustomer = { ...mockCustomerData, dateOfBirth: 'invalid-date' };
      expect(() => creditBureauInterface.validateCustomerData(invalidDateCustomer)).toThrow('Date of birth must be a valid Date object');
    });

    test('should sanitize customer data for audit logging', () => {
      const sanitized = creditBureauInterface.sanitizeCustomerData(mockCustomerData);
      
      expect(sanitized).toHaveProperty('customerId');
      expect(sanitized).toHaveProperty('firstName');
      expect(sanitized).toHaveProperty('lastName');
      expect(sanitized).toHaveProperty('hasSSN', true);
      expect(sanitized).toHaveProperty('hasPAN', true);
      expect(sanitized).toHaveProperty('hasAadhaar', true);
      expect(sanitized).not.toHaveProperty('ssn');
      expect(sanitized).not.toHaveProperty('pan');
      expect(sanitized).not.toHaveProperty('aadhaar');
    });

    test('should get credit score from CIBIL', async () => {
      const result = await creditBureauInterface.getCreditScore('cibil', mockCustomerData);
      
      expect(result).toHaveProperty('bureau', 'cibil');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('creditScore');
      expect(result).toHaveProperty('scoreRange');
      expect(result.scoreRange).toEqual({ min: 300, max: 900 });
      expect(result).toHaveProperty('riskCategory');
      expect(result).toHaveProperty('lastUpdated');
    });

    test('should get credit score from Experian', async () => {
      const result = await creditBureauInterface.getCreditScore('experian', mockCustomerData);
      
      expect(result).toHaveProperty('bureau', 'experian');
      expect(result).toHaveProperty('creditScore');
      expect(result).toHaveProperty('scoreRange');
      expect(result.scoreRange).toEqual({ min: 300, max: 850 });
      expect(result).toHaveProperty('riskCategory');
      expect(result).toHaveProperty('lastUpdated');
    });

    test('should get credit score from Equifax', async () => {
      const result = await creditBureauInterface.getCreditScore('equifax', mockCustomerData);
      
      expect(result).toHaveProperty('bureau', 'equifax');
      expect(result).toHaveProperty('creditScore');
      expect(result).toHaveProperty('scoreRange');
      expect(result.scoreRange).toEqual({ min: 300, max: 850 });
      expect(result).toHaveProperty('riskCategory');
      expect(result).toHaveProperty('lastUpdated');
    });

    test('should get credit report from all bureaus', async () => {
      const bureaus = ['cibil', 'experian', 'equifax'];
      
      for (const bureau of bureaus) {
        const result = await creditBureauInterface.getCreditReport(bureau, mockCustomerData);
        
        expect(result).toHaveProperty('bureau', bureau);
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('creditScore');
        expect(result).toHaveProperty('personalInfo');
        expect(result).toHaveProperty('accounts');
        expect(result).toHaveProperty('inquiries');
        expect(result).toHaveProperty('publicRecords');
        expect(result).toHaveProperty('summary');
        expect(Array.isArray(result.accounts)).toBe(true);
        expect(Array.isArray(result.inquiries)).toBe(true);
      }
    });

    test('should get multi-bureau credit scores', async () => {
      const bureaus = ['cibil', 'experian', 'equifax'];
      const result = await creditBureauInterface.getMultiBureauCreditScore(bureaus, mockCustomerData);
      
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('successfulBureaus');
      expect(result.summary).toHaveProperty('failedBureaus');
      expect(result.summary).toHaveProperty('averageScore');
      expect(result.summary.successfulBureaus).toBe(3);
      expect(result.summary.failedBureaus).toBe(0);
    });

    test('should map credit scores to risk categories correctly', () => {
      expect(creditBureauInterface.mapCIBILRiskCategory(800)).toBe('EXCELLENT');
      expect(creditBureauInterface.mapCIBILRiskCategory(720)).toBe('GOOD');
      expect(creditBureauInterface.mapCIBILRiskCategory(650)).toBe('FAIR');
      expect(creditBureauInterface.mapCIBILRiskCategory(580)).toBe('POOR');
      
      expect(creditBureauInterface.mapExperianRiskCategory(820)).toBe('EXCELLENT');
      expect(creditBureauInterface.mapExperianRiskCategory(750)).toBe('VERY_GOOD');
      expect(creditBureauInterface.mapExperianRiskCategory(680)).toBe('GOOD');
      expect(creditBureauInterface.mapExperianRiskCategory(600)).toBe('FAIR');
      
      expect(creditBureauInterface.mapEquifaxRiskCategory(810)).toBe('EXCELLENT');
      expect(creditBureauInterface.mapEquifaxRiskCategory(760)).toBe('VERY_GOOD');
      expect(creditBureauInterface.mapEquifaxRiskCategory(690)).toBe('GOOD');
      expect(creditBureauInterface.mapEquifaxRiskCategory(620)).toBe('FAIR');
    });

    test('should get health status of all bureaus', () => {
      const healthStatus = creditBureauInterface.getHealthStatus();
      
      expect(healthStatus).toHaveProperty('overall');
      expect(healthStatus).toHaveProperty('bureaus');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus.bureaus).toHaveProperty('cibil');
      expect(healthStatus.bureaus).toHaveProperty('experian');
      expect(healthStatus.bureaus).toHaveProperty('equifax');
      
      Object.values(healthStatus.bureaus).forEach(bureau => {
        expect(bureau).toHaveProperty('healthy');
        expect(bureau).toHaveProperty('state');
        expect(bureau).toHaveProperty('stats');
      });
    });
  });

  describe('Individual Bureau Adapters', () => {
    test('CIBIL adapter should generate mock data correctly', async () => {
      const adapter = new CIBILAdapter({ enableMockMode: true });
      const result = await adapter.getCreditScore(mockCustomerData);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reportDate');
      expect(result).toHaveProperty('inquiryCount');
      expect(result).toHaveProperty('accountCount');
      expect(result).toHaveProperty('status', 'SUCCESS');
      expect(result.score).toBeGreaterThanOrEqual(300);
      expect(result.score).toBeLessThanOrEqual(900);
    });

    test('Experian adapter should generate mock data correctly', async () => {
      const adapter = new ExperianAdapter({ enableMockMode: true });
      const result = await adapter.getCreditScore(mockCustomerData);
      
      expect(result).toHaveProperty('creditScore');
      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('totalInquiries');
      expect(result).toHaveProperty('totalAccounts');
      expect(result).toHaveProperty('status', 'SUCCESS');
      expect(result.creditScore).toBeGreaterThanOrEqual(300);
      expect(result.creditScore).toBeLessThanOrEqual(850);
    });

    test('Equifax adapter should generate mock data correctly', async () => {
      const adapter = new EquifaxAdapter({ enableMockMode: true });
      const result = await adapter.getCreditScore(mockCustomerData);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('inquiries');
      expect(result).toHaveProperty('accounts');
      expect(result).toHaveProperty('status', 'SUCCESS');
      expect(result.score).toBeGreaterThanOrEqual(300);
      expect(result.score).toBeLessThanOrEqual(850);
    });
  });

  describe('Mock Service', () => {
    test('should generate realistic credit scores', async () => {
      const result = await mockService.getMockCreditScore('cibil', mockCustomerData);
      
      expect(result).toHaveProperty('creditScore');
      expect(result).toHaveProperty('riskCategory');
      expect(result.creditScore).toBeGreaterThanOrEqual(300);
      expect(result.creditScore).toBeLessThanOrEqual(900);
    });

    test('should handle predefined scenarios', async () => {
      const excellentCustomer = { ...mockCustomerData, email: 'excellent@example.com' };
      const result = await mockService.getMockCreditScore('cibil', excellentCustomer);
      
      expect(result.creditScore).toBe(820);
      expect(result.riskCategory).toBe('EXCELLENT');
    });

    test('should generate comprehensive credit reports', async () => {
      const result = await mockService.getMockCreditReport('experian', mockCustomerData);
      
      expect(result).toHaveProperty('personalInfo');
      expect(result).toHaveProperty('accounts');
      expect(result).toHaveProperty('inquiries');
      expect(result).toHaveProperty('publicRecords');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('reportSections');
      
      expect(Array.isArray(result.accounts)).toBe(true);
      expect(Array.isArray(result.inquiries)).toBe(true);
      expect(result.accounts.length).toBeGreaterThan(0);
    });

    test('should simulate error scenarios', async () => {
      const errorCustomer = { ...mockCustomerData, email: 'error@example.com' };
      
      await expect(mockService.getMockCreditScore('cibil', errorCustomer))
        .rejects.toThrow('Customer not found in bureau database');
    });

    test('should provide service statistics', () => {
      const stats = mockService.getStatistics();
      
      expect(stats).toHaveProperty('config');
      expect(stats).toHaveProperty('scenarios');
      expect(stats).toHaveProperty('timestamp');
      expect(Array.isArray(stats.scenarios)).toBe(true);
    });

    test('should update configuration', () => {
      const newConfig = { errorRate: 0.2, simulateDelay: true };
      mockService.updateConfiguration(newConfig);
      
      expect(mockService.config.errorRate).toBe(0.2);
      expect(mockService.config.simulateDelay).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid bureau names', async () => {
      await expect(creditBureauInterface.getCreditScore('invalid', mockCustomerData))
        .rejects.toThrow('Invalid bureau');
    });

    test('should handle missing customer data', async () => {
      await expect(creditBureauInterface.getCreditScore('cibil', null))
        .rejects.toThrow('Customer data is required');
    });

    test('should transform bureau-specific errors correctly', () => {
      const originalError = new Error('Invalid PAN number');
      originalError.code = 'INVALID_PAN';
      
      const transformedError = creditBureauInterface.transformError('cibil', originalError);
      
      expect(transformedError.message).toContain('Credit bureau cibil error');
      expect(transformedError.code).toBe('INVALID_PAN');
      expect(transformedError.bureau).toBe('cibil');
      expect(transformedError.originalError).toBe(originalError);
    });

    test('should handle circuit breaker errors', () => {
      const circuitError = new Error('Circuit breaker is OPEN');
      circuitError.code = 'CIRCUIT_OPEN';
      
      const transformedError = creditBureauInterface.transformError('experian', circuitError);
      
      expect(transformedError.code).toBe('SERVICE_UNAVAILABLE');
      expect(transformedError.message).toContain('temporarily unavailable');
    });
  });

  describe('Data Transformation', () => {
    test('should transform CIBIL responses correctly', () => {
      const mockResponse = {
        score: 750,
        reportDate: '2023-12-01',
        inquiryCount: 3,
        accountCount: 8
      };
      
      const transformed = creditBureauInterface.transformCreditResponse('cibil', mockResponse);
      
      expect(transformed.bureau).toBe('cibil');
      expect(transformed.creditScore).toBe(750);
      expect(transformed.scoreRange).toEqual({ min: 300, max: 900 });
      expect(transformed.riskCategory).toBe('EXCELLENT');
      expect(transformed.inquiries).toBe(3);
      expect(transformed.accounts).toBe(8);
    });

    test('should transform Experian responses correctly', () => {
      const mockResponse = {
        creditScore: 720,
        lastUpdated: '2023-12-01',
        totalInquiries: 2,
        totalAccounts: 6
      };
      
      const transformed = creditBureauInterface.transformCreditResponse('experian', mockResponse);
      
      expect(transformed.bureau).toBe('experian');
      expect(transformed.creditScore).toBe(720);
      expect(transformed.scoreRange).toEqual({ min: 300, max: 850 });
      expect(transformed.riskCategory).toBe('GOOD');
      expect(transformed.inquiries).toBe(2);
      expect(transformed.accounts).toBe(6);
    });

    test('should transform Equifax responses correctly', () => {
      const mockResponse = {
        score: 680,
        asOfDate: '2023-12-01',
        inquiries: 4,
        accounts: 5
      };
      
      const transformed = creditBureauInterface.transformCreditResponse('equifax', mockResponse);
      
      expect(transformed.bureau).toBe('equifax');
      expect(transformed.creditScore).toBe(680);
      expect(transformed.scoreRange).toEqual({ min: 300, max: 850 });
      expect(transformed.riskCategory).toBe('GOOD');
      expect(transformed.inquiries).toBe(4);
      expect(transformed.accounts).toBe(5);
    });
  });
});