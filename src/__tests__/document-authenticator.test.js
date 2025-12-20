// Document Authenticator Tests

const DocumentAuthenticator = require('../services/document-authenticator');
const { DocumentType } = require('../shared/types');

describe('Document Authenticator', () => {
  let documentAuthenticator;

  beforeEach(() => {
    documentAuthenticator = new DocumentAuthenticator();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(documentAuthenticator).toBeDefined();
      expect(documentAuthenticator.config.enableAdvancedChecks).toBe(true);
      expect(documentAuthenticator.config.confidenceThreshold).toBe(70);
      expect(documentAuthenticator.authenticators).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        enableAdvancedChecks: false,
        confidenceThreshold: 80,
        enableBatchProcessing: false
      };
      const authenticator = new DocumentAuthenticator(customConfig);
      
      expect(authenticator.config.enableAdvancedChecks).toBe(false);
      expect(authenticator.config.confidenceThreshold).toBe(80);
      expect(authenticator.config.enableBatchProcessing).toBe(false);
    });
  });

  describe('Document Authentication', () => {
    test('should authenticate passport document successfully', async () => {
      const extractedData = {
        passportNumber: 'P123456789',
        name: 'JOHN MICHAEL DOE',
        dateOfBirth: '15/06/1985',
        nationality: 'AMERICAN'
      };

      const result = await documentAuthenticator.authenticateDocument(
        'mock-passport.jpg',
        DocumentType.PASSPORT,
        extractedData
      );

      expect(result.isAuthentic).toBe(true);
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.checks.formatCheck).toBe(true);
      expect(result.checks.tamperingCheck).toBe(true);
      expect(result.checks.consistencyCheck).toBe(true);
      expect(result.checks.securityFeatureCheck).toBe(true);
    });

    test('should authenticate Aadhaar document successfully', async () => {
      const extractedData = {
        aadhaarNumber: '123456789012',
        name: 'JOHN DOE',
        dateOfBirth: '15/06/1985'
      };

      const result = await documentAuthenticator.authenticateDocument(
        'mock-aadhaar.jpg',
        DocumentType.AADHAAR,
        extractedData
      );

      expect(result.isAuthentic).toBe(true);
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.checks.formatCheck).toBe(true);
    });

    test('should handle invalid document format', async () => {
      const extractedData = {
        passportNumber: 'INVALID',
        name: 'JOHN DOE'
      };

      const result = await documentAuthenticator.authenticateDocument(
        'mock-passport.jpg',
        DocumentType.PASSPORT,
        extractedData
      );

      expect(result.isAuthentic).toBe(false);
      expect(result.confidence).toBeLessThan(70);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('should handle unsupported document type', async () => {
      const extractedData = { name: 'Test User' };

      const result = await documentAuthenticator.authenticateDocument(
        'mock-document.jpg',
        'UNSUPPORTED_TYPE',
        extractedData
      );

      expect(result.isAuthentic).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.issues).toContain('No authenticator available for document type: UNSUPPORTED_TYPE');
    });
  });

  describe('Document Completeness Validation', () => {
    test('should validate passport completeness', () => {
      const extractedData = {
        passportNumber: 'P123456789',
        name: 'JOHN DOE',
        dateOfBirth: '15/06/1985',
        nationality: 'AMERICAN'
      };

      const result = documentAuthenticator.validateCompleteness(extractedData, DocumentType.PASSPORT);

      expect(result.isComplete).toBe(true);
      expect(result.completenessScore).toBe(100);
      expect(result.missingFields).toHaveLength(0);
      expect(result.presentFields).toContain('passportNumber');
      expect(result.presentFields).toContain('name');
    });

    test('should identify missing required fields', () => {
      const extractedData = {
        passportNumber: 'P123456789',
        name: 'JOHN DOE'
        // Missing dateOfBirth and nationality
      };

      const result = documentAuthenticator.validateCompleteness(extractedData, DocumentType.PASSPORT);

      expect(result.isComplete).toBe(false);
      expect(result.completenessScore).toBe(50);
      expect(result.missingFields).toContain('dateOfBirth');
      expect(result.missingFields).toContain('nationality');
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('should validate Aadhaar completeness', () => {
      const extractedData = {
        aadhaarNumber: '123456789012',
        name: 'JOHN DOE',
        dateOfBirth: '15/06/1985'
      };

      const result = documentAuthenticator.validateCompleteness(extractedData, DocumentType.AADHAAR);

      expect(result.isComplete).toBe(true);
      expect(result.completenessScore).toBe(100);
      expect(result.presentFields).toHaveLength(3);
    });
  });

  describe('Comprehensive Format Validation', () => {
    test('should perform comprehensive format validation for passport', () => {
      const extractedData = {
        passportNumber: 'P123456789',
        name: 'JOHN DOE',
        dateOfBirth: '15/06/1985',
        nationality: 'AMERICAN'
      };

      const result = documentAuthenticator.performComprehensiveFormatValidation(
        extractedData,
        DocumentType.PASSPORT
      );

      expect(result.isValid).toBe(true);
      expect(result.overallScore).toBeGreaterThan(80);
      expect(result.completeness.isComplete).toBe(true);
      expect(result.format.formatScore).toBeGreaterThan(80);
      expect(result.consistency.consistencyScore).toBeGreaterThan(80);
    });

    test('should detect format issues', () => {
      const extractedData = {
        passportNumber: 'INVALID_FORMAT',
        name: 'JOHN DOE',
        dateOfBirth: 'invalid-date',
        nationality: 'AMERICAN'
      };

      const result = documentAuthenticator.performComprehensiveFormatValidation(
        extractedData,
        DocumentType.PASSPORT
      );

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.format.formatScore).toBeLessThan(100);
    });
  });

  describe('Multiple Document Authentication', () => {
    test('should authenticate multiple documents concurrently', async () => {
      const documents = [
        {
          input: 'passport.jpg',
          type: DocumentType.PASSPORT,
          extractedData: {
            passportNumber: 'P123456789',
            name: 'JOHN DOE',
            dateOfBirth: '15/06/1985',
            nationality: 'AMERICAN'
          }
        },
        {
          input: 'aadhaar.jpg',
          type: DocumentType.AADHAAR,
          extractedData: {
            aadhaarNumber: '123456789012',
            name: 'JOHN DOE',
            dateOfBirth: '15/06/1985'
          }
        }
      ];

      const results = await documentAuthenticator.authenticateMultipleDocuments(documents);

      expect(results).toHaveLength(2);
      expect(results[0].isAuthentic).toBe(true);
      expect(results[1].isAuthentic).toBe(true);
    });

    test('should handle batch processing when disabled', async () => {
      const authenticator = new DocumentAuthenticator({ enableBatchProcessing: false });
      
      const documents = [
        {
          input: 'passport.jpg',
          type: DocumentType.PASSPORT,
          extractedData: { passportNumber: 'P123456789', name: 'JOHN DOE' }
        }
      ];

      const results = await authenticator.authenticateMultipleDocuments(documents);
      expect(results).toHaveLength(1);
    });
  });

  describe('Statistics and Metrics', () => {
    test('should return authentication statistics', () => {
      const stats = documentAuthenticator.getAuthenticationStats();
      
      expect(stats.totalAuthentications).toBe(0);
      expect(stats.successfulAuthentications).toBe(0);
      expect(stats.failedAuthentications).toBe(0);
      expect(stats.supportedDocuments).toContain(DocumentType.PASSPORT);
      expect(stats.supportedDocuments).toContain(DocumentType.AADHAAR);
      expect(stats.confidenceThreshold).toBe(70);
    });

    test('should update metrics correctly', () => {
      documentAuthenticator.updateMetrics(true, 85, 1500);
      documentAuthenticator.updateMetrics(false, 45, 800);
      
      const stats = documentAuthenticator.getAuthenticationStats();
      expect(stats.totalAuthentications).toBe(2);
      expect(stats.successfulAuthentications).toBe(1);
      expect(stats.failedAuthentications).toBe(1);
      expect(stats.averageConfidence).toBe(65);
      expect(stats.averageProcessingTime).toBe(1150);
    });
  });

  describe('Utility Functions', () => {
    test('should create batches correctly', () => {
      const items = [1, 2, 3, 4, 5, 6, 7];
      const batches = documentAuthenticator.createBatches(items, 3);
      
      expect(batches).toHaveLength(3);
      expect(batches[0]).toEqual([1, 2, 3]);
      expect(batches[1]).toEqual([4, 5, 6]);
      expect(batches[2]).toEqual([7]);
    });

    test('should get required fields for document types', () => {
      const passportFields = documentAuthenticator.getRequiredFields(DocumentType.PASSPORT);
      expect(passportFields).toContain('passportNumber');
      expect(passportFields).toContain('name');
      
      const aadhaarFields = documentAuthenticator.getRequiredFields(DocumentType.AADHAAR);
      expect(aadhaarFields).toContain('aadhaarNumber');
      expect(aadhaarFields).toContain('name');
    });
  });
});