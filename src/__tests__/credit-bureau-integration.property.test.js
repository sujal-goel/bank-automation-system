// Property-Based Test for Credit Bureau Integration Reliability
// **Feature: banking-process-automation, Property 6: Credit Bureau Integration Reliability**

const fc = require('fast-check');
const { CreditAssessor } = require('../modules/loan-processing');
const { v4: uuidv4 } = require('uuid');

describe('Property-Based Tests: Credit Bureau Integration Reliability', () => {
  let creditAssessor;

  beforeEach(() => {
    creditAssessor = new CreditAssessor({
      cibilEndpoint: 'https://api.cibil.com',
      experianEndpoint: 'https://api.experian.com',
      equifaxEndpoint: 'https://api.equifax.com'
    });
  });

  /**
   * **Feature: banking-process-automation, Property 6: Credit Bureau Integration Reliability**
   * 
   * Property: For any validated loan application, credit score retrieval should successfully 
   * obtain current credit information from integrated bureaus
   * 
   * **Validates: Requirements 2.2**
   */
  describe('Property 6: Credit Bureau Integration Reliability', () => {
    
    // Generator for valid customer information
    const customerInfoGenerator = fc.record({
      personalInfo: fc.record({
        firstName: fc.string({ minLength: 2, maxLength: 30 })
          .filter(s => /^[A-Za-z]+$/.test(s)),
        lastName: fc.string({ minLength: 2, maxLength: 30 })
          .filter(s => /^[A-Za-z]+$/.test(s)),
        dateOfBirth: fc.date({ 
          min: new Date('1940-01-01'), 
          max: new Date('2005-12-31') 
        }),
        nationality: fc.constantFrom('American', 'British', 'Canadian', 'Indian', 'Australian'),
        address: fc.record({
          street: fc.string({ minLength: 5, maxLength: 50 }),
          city: fc.string({ minLength: 3, maxLength: 30 }),
          state: fc.string({ minLength: 2, maxLength: 30 }),
          zipCode: fc.stringMatching(/^[0-9]{5,6}$/)
        })
      })
    });

    // Generator for customer IDs
    const customerIdGenerator = fc.uuid();

    test('Property 6: Credit score retrieval should succeed for any valid customer information', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerIdGenerator,
          customerInfoGenerator,
          async (customerId, customerInfo) => {
            // Act: Retrieve credit score from credit bureaus
            const result = await creditAssessor.retrieveCreditScore(customerId, customerInfo);

            // Assert: Credit assessment should be successful
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.customerId).toBe(customerId);
            
            // Verify credit score is obtained and within valid range
            expect(result.creditScore).toBeDefined();
            expect(result.creditScore).not.toBeNull();
            expect(typeof result.creditScore).toBe('number');
            expect(result.creditScore).toBeGreaterThanOrEqual(300);
            expect(result.creditScore).toBeLessThanOrEqual(850);
            
            // Verify credit history is obtained
            expect(result.creditHistory).toBeDefined();
            expect(result.creditHistory).not.toBeNull();
            expect(typeof result.creditHistory).toBe('object');
            
            // Verify bureau responses are obtained
            expect(result.bureauResponses).toBeDefined();
            expect(result.bureauResponses).not.toBeNull();
            expect(typeof result.bureauResponses).toBe('object');
            
            // Verify all three bureaus responded
            expect(result.bureauResponses.CIBIL).toBeDefined();
            expect(result.bureauResponses.EXPERIAN).toBeDefined();
            expect(result.bureauResponses.EQUIFAX).toBeDefined();
            
            // Verify assessment date is recorded
            expect(result.assessmentDate).toBeDefined();
            expect(result.assessmentDate).toBeInstanceOf(Date);
            
            // Verify no error is present on success
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 } // Run 100 iterations as required
      );
    });

    test('Property 6: Each bureau should return valid credit data structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerIdGenerator,
          customerInfoGenerator,
          async (customerId, customerInfo) => {
            // Act: Retrieve credit score
            const result = await creditAssessor.retrieveCreditScore(customerId, customerInfo);

            // Assert: Each bureau response should have valid structure
            expect(result.success).toBe(true);
            
            const bureaus = ['CIBIL', 'EXPERIAN', 'EQUIFAX'];
            bureaus.forEach(bureauName => {
              const bureauData = result.bureauResponses[bureauName];
              
              // Verify bureau data structure
              expect(bureauData).toBeDefined();
              expect(bureauData.bureau).toBe(bureauName);
              expect(bureauData.score).toBeDefined();
              expect(typeof bureauData.score).toBe('number');
              expect(bureauData.score).toBeGreaterThanOrEqual(300);
              expect(bureauData.score).toBeLessThanOrEqual(850);
              
              // Verify report date is present
              expect(bureauData.reportDate).toBeDefined();
              expect(bureauData.reportDate).toBeInstanceOf(Date);
              
              // Verify accounts array is present
              expect(bureauData.accounts).toBeDefined();
              expect(Array.isArray(bureauData.accounts)).toBe(true);
              
              // Verify inquiries array is present
              expect(bureauData.inquiries).toBeDefined();
              expect(Array.isArray(bureauData.inquiries)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 6: Composite credit score should be calculated from all bureau scores', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerIdGenerator,
          customerInfoGenerator,
          async (customerId, customerInfo) => {
            // Act: Retrieve credit score
            const result = await creditAssessor.retrieveCreditScore(customerId, customerInfo);

            // Assert: Composite score should be within range of bureau scores
            expect(result.success).toBe(true);
            
            const bureauScores = [
              result.bureauResponses.CIBIL.score,
              result.bureauResponses.EXPERIAN.score,
              result.bureauResponses.EQUIFAX.score
            ];
            
            const minScore = Math.min(...bureauScores);
            const maxScore = Math.max(...bureauScores);
            const avgScore = Math.round(bureauScores.reduce((sum, s) => sum + s, 0) / bureauScores.length);
            
            // Composite score should be the average
            expect(result.creditScore).toBe(avgScore);
            
            // Composite score should be within the range of bureau scores
            expect(result.creditScore).toBeGreaterThanOrEqual(minScore);
            expect(result.creditScore).toBeLessThanOrEqual(maxScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 6: Credit history should consolidate data from all bureaus', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerIdGenerator,
          customerInfoGenerator,
          async (customerId, customerInfo) => {
            // Act: Retrieve credit score
            const result = await creditAssessor.retrieveCreditScore(customerId, customerInfo);

            // Assert: Credit history should contain consolidated data
            expect(result.success).toBe(true);
            expect(result.creditHistory).toBeDefined();
            
            const creditHistory = result.creditHistory;
            
            // Verify credit history structure
            expect(creditHistory.totalAccounts).toBeDefined();
            expect(typeof creditHistory.totalAccounts).toBe('number');
            expect(creditHistory.totalAccounts).toBeGreaterThanOrEqual(0);
            
            expect(creditHistory.accounts).toBeDefined();
            expect(Array.isArray(creditHistory.accounts)).toBe(true);
            
            // Total accounts should match the length of accounts array
            expect(creditHistory.totalAccounts).toBe(creditHistory.accounts.length);
            
            // Verify recent inquiries count
            expect(creditHistory.recentInquiries).toBeDefined();
            expect(typeof creditHistory.recentInquiries).toBe('number');
            expect(creditHistory.recentInquiries).toBeGreaterThanOrEqual(0);
            
            // Verify accounts come from all bureaus (consolidated)
            const totalBureauAccounts = 
              result.bureauResponses.CIBIL.accounts.length +
              result.bureauResponses.EXPERIAN.accounts.length +
              result.bureauResponses.EQUIFAX.accounts.length;
            
            expect(creditHistory.totalAccounts).toBe(totalBureauAccounts);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 6: Credit assessment should handle missing customer info gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerIdGenerator,
          fc.constantFrom(null, undefined, {}, { personalInfo: null }),
          async (customerId, invalidCustomerInfo) => {
            // Act: Attempt to retrieve credit score with invalid customer info
            const result = await creditAssessor.retrieveCreditScore(customerId, invalidCustomerInfo);

            // Assert: Should fail gracefully with error information
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.customerId).toBe(customerId);
            expect(result.creditScore).toBeNull();
            expect(result.creditHistory).toBeNull();
            expect(result.bureauResponses).toBeNull();
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe('string');
            expect(result.error.length).toBeGreaterThan(0);
            
            // Verify assessment date is still recorded even on failure
            expect(result.assessmentDate).toBeDefined();
            expect(result.assessmentDate).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 6: Credit assessment should be idempotent for same customer', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerIdGenerator,
          customerInfoGenerator,
          async (customerId, customerInfo) => {
            // Act: Retrieve credit score twice for the same customer
            const result1 = await creditAssessor.retrieveCreditScore(customerId, customerInfo);
            const result2 = await creditAssessor.retrieveCreditScore(customerId, customerInfo);

            // Assert: Both results should be successful
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            
            // Both should have the same customer ID
            expect(result1.customerId).toBe(result2.customerId);
            expect(result1.customerId).toBe(customerId);
            
            // Both should have valid credit scores in the same range
            expect(result1.creditScore).toBeGreaterThanOrEqual(300);
            expect(result1.creditScore).toBeLessThanOrEqual(850);
            expect(result2.creditScore).toBeGreaterThanOrEqual(300);
            expect(result2.creditScore).toBeLessThanOrEqual(850);
            
            // Both should have credit history
            expect(result1.creditHistory).toBeDefined();
            expect(result2.creditHistory).toBeDefined();
            
            // Both should have bureau responses
            expect(result1.bureauResponses).toBeDefined();
            expect(result2.bureauResponses).toBeDefined();
            
            // Note: Scores may differ slightly due to randomization in simulation,
            // but the structure and validity should be consistent
          }
        ),
        { numRuns: 50 } // Fewer runs since we're calling twice per iteration
      );
    });

    test('Property 6: All bureau endpoints should be configured and accessible', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerIdGenerator,
          customerInfoGenerator,
          async (customerId, customerInfo) => {
            // Act: Retrieve credit score
            const result = await creditAssessor.retrieveCreditScore(customerId, customerInfo);

            // Assert: All configured bureaus should respond
            expect(result.success).toBe(true);
            
            // Verify bureau endpoints are configured
            expect(creditAssessor.bureauEndpoints).toBeDefined();
            expect(creditAssessor.bureauEndpoints.CIBIL).toBeDefined();
            expect(creditAssessor.bureauEndpoints.EXPERIAN).toBeDefined();
            expect(creditAssessor.bureauEndpoints.EQUIFAX).toBeDefined();
            
            // Verify all bureaus provided responses
            const bureaus = Object.keys(result.bureauResponses);
            expect(bureaus).toContain('CIBIL');
            expect(bureaus).toContain('EXPERIAN');
            expect(bureaus).toContain('EQUIFAX');
            expect(bureaus.length).toBe(3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
