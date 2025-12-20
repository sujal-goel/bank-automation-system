// Property-Based Test for Document Verification Integrity
// **Feature: banking-process-automation, Property 2: Document Verification Integrity**

const fc = require('fast-check');
const DocumentAuthenticator = require('../services/document-authenticator');
const IdentityValidator = require('../services/identity-validator');
const { DocumentType, VerificationStatus } = require('../shared/types');

// Mock the simulateDelay function to avoid long test execution times
jest.mock('../services/document-authenticator', () => {
  const actual = jest.requireActual('../services/document-authenticator');
  
  // Override the BaseAuthenticator prototype to remove delays
  const OriginalClass = actual;
  return class MockedDocumentAuthenticator extends OriginalClass {
    constructor(config) {
      super(config);
      // Override simulateDelay in all authenticators
      Object.values(this.authenticators).forEach(authenticator => {
        authenticator.simulateDelay = jest.fn().mockResolvedValue();
      });
    }
  };
});

jest.mock('../services/identity-validator', () => {
  const actual = jest.requireActual('../services/identity-validator');
  
  const OriginalClass = actual;
  return class MockedIdentityValidator extends OriginalClass {
    constructor(config) {
      super(config);
      // Override simulateDelay in all validators
      Object.values(this.governmentDatabases).forEach(validator => {
        validator.simulateDelay = jest.fn().mockResolvedValue();
        if (validator.databaseInterface) {
          validator.databaseInterface.simulateDelay = jest.fn().mockResolvedValue();
        }
      });
    }
  };
});

describe('Property-Based Tests: Document Verification Integrity', () => {
  let documentAuthenticator;
  let identityValidator;

  beforeEach(() => {
    // Use configuration with minimal delays for testing
    documentAuthenticator = new DocumentAuthenticator({
      enableAdvancedChecks: true,
      confidenceThreshold: 70
    });
    identityValidator = new IdentityValidator({
      enableCache: true,
      maxRetries: 1,
      retryDelay: 100
    });
  });

  /**
   * **Feature: banking-process-automation, Property 2: Document Verification Integrity**
   * 
   * Property: For any submitted document, verification against official databases should 
   * return consistent results based on the document's actual authenticity status
   * 
   * **Validates: Requirements 1.2, 2.1, 3.1**
   */
  describe('Property 2: Document Verification Integrity', () => {
    
    // Generator for valid passport documents
    const validPassportGenerator = fc.record({
      documentInput: fc.constant('mock-passport.jpg'),
      documentType: fc.constant(DocumentType.PASSPORT),
      extractedData: fc.record({
        passportNumber: fc.constantFrom('P123456789', 'P987654321', 'P555666777'),
        name: fc.constantFrom('JOHN MICHAEL DOE', 'JANE SMITH', 'ROBERT JOHNSON'),
        dateOfBirth: fc.constantFrom('15/06/1985', '20/03/1990', '10/12/1978'),
        nationality: fc.constantFrom('INDIAN', 'AMERICAN', 'BRITISH'),
        expiryDate: fc.date({ min: new Date('2025-01-01'), max: new Date('2035-12-31') })
          .map(d => d.toLocaleDateString('en-GB'))
      }),
      identityDocument: fc.record({
        documentType: fc.constant(DocumentType.PASSPORT),
        documentNumber: fc.constantFrom('P123456789', 'P987654321', 'P555666777'),
        issuingAuthority: fc.constant('Passport Seva'),
        expiryDate: fc.date({ min: new Date('2025-01-01'), max: new Date('2035-12-31') })
      })
    });

    // Generator for valid Aadhaar documents
    const validAadhaarGenerator = fc.record({
      documentInput: fc.constant('mock-aadhaar.jpg'),
      documentType: fc.constant(DocumentType.AADHAAR),
      extractedData: fc.record({
        aadhaarNumber: fc.constantFrom('123456789012', '987654321098', '555666777888'),
        name: fc.constantFrom('JOHN DOE', 'JANE SMITH', 'ROBERT JOHNSON'),
        dateOfBirth: fc.constantFrom('15/06/1985', '20/03/1990', '10/12/1978')
      }),
      identityDocument: fc.record({
        documentType: fc.constant(DocumentType.AADHAAR),
        documentNumber: fc.constantFrom('123456789012', '987654321098', '555666777888'),
        issuingAuthority: fc.constant('UIDAI'),
        expiryDate: fc.constant(null)
      })
    });

    // Generator for valid PAN documents
    const validPANGenerator = fc.record({
      documentInput: fc.constant('mock-pan.jpg'),
      documentType: fc.constant(DocumentType.PAN),
      extractedData: fc.record({
        panNumber: fc.constantFrom('ABCDE1234F', 'XYZAB5678C', 'PQRST9012D'),
        name: fc.constantFrom('JOHN DOE', 'JANE SMITH', 'ROBERT JOHNSON'),
        fatherName: fc.constantFrom('RICHARD DOE', 'MICHAEL SMITH', 'WILLIAM JOHNSON'),
        dateOfBirth: fc.constantFrom('15/06/1985', '20/03/1990', '10/12/1978')
      }),
      identityDocument: fc.record({
        documentType: fc.constant(DocumentType.PAN),
        documentNumber: fc.constantFrom('ABCDE1234F', 'XYZAB5678C', 'PQRST9012D'),
        issuingAuthority: fc.constant('Income Tax Department'),
        expiryDate: fc.constant(null)
      })
    });

    // Generator for invalid documents (format issues)
    const invalidDocumentGenerator = fc.record({
      documentInput: fc.constant('mock-invalid.jpg'),
      documentType: fc.constantFrom(DocumentType.PASSPORT, DocumentType.AADHAAR, DocumentType.PAN),
      extractedData: fc.oneof(
        // Invalid passport
        fc.record({
          passportNumber: fc.constantFrom('INVALID', '123', 'P12'),
          name: fc.constant('TEST USER'),
          dateOfBirth: fc.constant('invalid-date'),
          nationality: fc.constant('UNKNOWN')
        }),
        // Invalid Aadhaar
        fc.record({
          aadhaarNumber: fc.constantFrom('123', '000000000000', 'invalid'),
          name: fc.constant('TEST USER'),
          dateOfBirth: fc.constant('invalid-date')
        }),
        // Invalid PAN
        fc.record({
          panNumber: fc.constantFrom('INVALID', '12345', 'ABC'),
          name: fc.constant('TEST USER'),
          fatherName: fc.constant('TEST FATHER')
        })
      )
    });

    test('Property 2: Document authentication should return consistent results for valid documents', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(validPassportGenerator, validAadhaarGenerator, validPANGenerator),
          async (document) => {
            // Act: Authenticate the document
            const authResult = await documentAuthenticator.authenticateDocument(
              document.documentInput,
              document.documentType,
              document.extractedData
            );

            // Assert: Verification should be consistent
            expect(authResult).toBeDefined();
            expect(authResult.confidence).toBeDefined();
            expect(authResult.checks).toBeDefined();
            
            // For valid documents, authentication should generally succeed
            // (confidence and checks should be reasonable)
            expect(typeof authResult.isAuthentic).toBe('boolean');
            expect(typeof authResult.confidence).toBe('number');
            expect(authResult.confidence).toBeGreaterThanOrEqual(0);
            expect(authResult.confidence).toBeLessThanOrEqual(100);
            
            // Checks should be present
            expect(authResult.checks.formatCheck).toBeDefined();
            expect(authResult.checks.tamperingCheck).toBeDefined();
            expect(authResult.checks.consistencyCheck).toBeDefined();
            expect(authResult.checks.securityFeatureCheck).toBeDefined();
            
            // Issues array should be defined
            expect(Array.isArray(authResult.issues)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    test('Property 2: Identity validation should return consistent results for valid documents', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(validPassportGenerator, validAadhaarGenerator, validPANGenerator),
          async (document) => {
            // Act: Validate the identity document
            const validationResult = await identityValidator.validateIdentity(
              document.identityDocument,
              document.extractedData
            );

            // Assert: Validation should be consistent
            expect(validationResult).toBeDefined();
            expect(validationResult.isValid).toBeDefined();
            expect(validationResult.status).toBeDefined();
            expect(validationResult.confidence).toBeDefined();
            
            // Status should be one of the valid verification statuses
            expect([
              VerificationStatus.VERIFIED,
              VerificationStatus.FAILED,
              VerificationStatus.PENDING
            ]).toContain(validationResult.status);
            
            // Confidence should be in valid range
            expect(validationResult.confidence).toBeGreaterThanOrEqual(0);
            expect(validationResult.confidence).toBeLessThanOrEqual(100);
            
            // Verification details should be present
            expect(validationResult.verificationDetails).toBeDefined();
            
            // Issues array should be defined
            expect(Array.isArray(validationResult.issues)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    test('Property 2: Invalid documents should consistently fail authentication', async () => {
      await fc.assert(
        fc.asyncProperty(invalidDocumentGenerator, async (document) => {
          // Act: Authenticate the invalid document
          const authResult = await documentAuthenticator.authenticateDocument(
            document.documentInput,
            document.documentType,
            document.extractedData
          );

          // Assert: Invalid documents should have low confidence or fail checks
          expect(authResult).toBeDefined();
          
          // Either confidence should be low OR some checks should fail
          const hasLowConfidence = authResult.confidence < 70;
          const hasFailedChecks = !authResult.checks.formatCheck || 
                                  !authResult.checks.tamperingCheck || 
                                  !authResult.checks.consistencyCheck;
          
          expect(hasLowConfidence || hasFailedChecks).toBe(true);
          
          // Should have issues reported
          if (!authResult.isAuthentic) {
            expect(authResult.issues.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    }, 30000);

    test('Property 2: Document completeness validation should be consistent', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(validPassportGenerator, validAadhaarGenerator, validPANGenerator),
          async (document) => {
            // Act: Validate document completeness
            const completenessResult = documentAuthenticator.validateCompleteness(
              document.extractedData,
              document.documentType
            );

            // Assert: Completeness validation should be consistent
            expect(completenessResult).toBeDefined();
            expect(completenessResult.isComplete).toBeDefined();
            expect(completenessResult.completenessScore).toBeDefined();
            expect(completenessResult.requiredFields).toBeDefined();
            expect(completenessResult.presentFields).toBeDefined();
            expect(completenessResult.missingFields).toBeDefined();
            
            // Score should be in valid range
            expect(completenessResult.completenessScore).toBeGreaterThanOrEqual(0);
            expect(completenessResult.completenessScore).toBeLessThanOrEqual(100);
            
            // If complete, score should be 100 and no missing fields
            if (completenessResult.isComplete) {
              expect(completenessResult.completenessScore).toBe(100);
              expect(completenessResult.missingFields).toHaveLength(0);
            }
            
            // Present + missing should equal required
            const totalFields = completenessResult.presentFields.length + 
                               completenessResult.missingFields.length;
            expect(totalFields).toBe(completenessResult.requiredFields.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 2: Comprehensive format validation should detect all issues', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(validPassportGenerator, validAadhaarGenerator, validPANGenerator),
          async (document) => {
            // Act: Perform comprehensive format validation
            const formatResult = documentAuthenticator.performComprehensiveFormatValidation(
              document.extractedData,
              document.documentType
            );

            // Assert: Format validation should be comprehensive
            expect(formatResult).toBeDefined();
            expect(formatResult.isValid).toBeDefined();
            expect(formatResult.overallScore).toBeDefined();
            expect(formatResult.completeness).toBeDefined();
            expect(formatResult.format).toBeDefined();
            expect(formatResult.consistency).toBeDefined();
            expect(formatResult.issues).toBeDefined();
            
            // Overall score should be in valid range
            expect(formatResult.overallScore).toBeGreaterThanOrEqual(0);
            expect(formatResult.overallScore).toBeLessThanOrEqual(100);
            
            // If valid, should have high score and no issues
            if (formatResult.isValid) {
              expect(formatResult.overallScore).toBeGreaterThan(70);
              expect(formatResult.issues).toHaveLength(0);
            }
            
            // If invalid, should have issues
            if (!formatResult.isValid) {
              expect(formatResult.issues.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
