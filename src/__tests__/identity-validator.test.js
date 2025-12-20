// Identity Validator Tests

const IdentityValidator = require('../services/identity-validator');
const { DocumentType, VerificationStatus } = require('../shared/types');

describe('Identity Validator', () => {
  let identityValidator;

  beforeEach(() => {
    identityValidator = new IdentityValidator();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(identityValidator).toBeDefined();
      expect(identityValidator.config.enableCache).toBe(true);
      expect(identityValidator.config.maxRetries).toBe(3);
      expect(identityValidator.governmentDatabases).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        enableCache: false,
        maxRetries: 5,
        retryDelay: 2000
      };
      const validator = new IdentityValidator(customConfig);
      
      expect(validator.config.enableCache).toBe(false);
      expect(validator.config.maxRetries).toBe(5);
      expect(validator.config.retryDelay).toBe(2000);
    });
  });

  describe('Document Validation', () => {
    test('should validate Aadhaar document successfully', async () => {
      const identityDocument = {
        documentType: DocumentType.AADHAAR,
        documentNumber: '123456789012',
        issuingAuthority: 'UIDAI',
        expiryDate: null
      };

      const extractedData = {
        name: 'JOHN DOE',
        dateOfBirth: '15/06/1985'
      };

      const result = await identityValidator.validateIdentity(identityDocument, extractedData);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.verificationDetails).toBeDefined();
    });

    test('should validate PAN document successfully', async () => {
      const identityDocument = {
        documentType: DocumentType.PAN,
        documentNumber: 'ABCDE1234F',
        issuingAuthority: 'Income Tax Department',
        expiryDate: null
      };

      const extractedData = {
        name: 'JOHN DOE',
        fatherName: 'RICHARD DOE',
        dateOfBirth: '15/06/1985'
      };

      const result = await identityValidator.validateIdentity(identityDocument, extractedData);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.confidence).toBeGreaterThan(60);
    });

    test('should handle invalid document type', async () => {
      const identityDocument = {
        documentType: 'INVALID_TYPE',
        documentNumber: '123456789',
        issuingAuthority: 'Unknown',
        expiryDate: null
      };

      const extractedData = { name: 'Test User' };

      const result = await identityValidator.validateIdentity(identityDocument, extractedData);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(VerificationStatus.FAILED);
      expect(result.confidence).toBe(0);
      expect(result.issues).toContain('Unsupported document type: INVALID_TYPE');
    });

    test('should handle validation errors gracefully', async () => {
      const identityDocument = {
        documentType: DocumentType.AADHAAR,
        documentNumber: 'invalid',
        issuingAuthority: 'UIDAI',
        expiryDate: null
      };

      const extractedData = { name: 'Test User' };

      const result = await identityValidator.validateIdentity(identityDocument, extractedData);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(VerificationStatus.FAILED);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Document Validation', () => {
    test('should validate multiple documents concurrently', async () => {
      const documents = [
        {
          identityDocument: {
            documentType: DocumentType.AADHAAR,
            documentNumber: '123456789012',
            issuingAuthority: 'UIDAI'
          },
          extractedData: { name: 'JOHN DOE', dateOfBirth: '15/06/1985' }
        },
        {
          identityDocument: {
            documentType: DocumentType.PAN,
            documentNumber: 'ABCDE1234F',
            issuingAuthority: 'Income Tax Department'
          },
          extractedData: { name: 'JOHN DOE', fatherName: 'RICHARD DOE' }
        }
      ];

      const results = await identityValidator.validateMultipleDocuments(documents);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
    });
  });

  describe('Integration Interfaces', () => {
    test('should provide integration interface for database types', () => {
      const aadhaarInterface = identityValidator.getIntegrationInterface('aadhaar');
      expect(aadhaarInterface).toBeDefined();
      
      const panInterface = identityValidator.getIntegrationInterface('pan');
      expect(panInterface).toBeDefined();
    });

    test('should test connectivity to government databases', async () => {
      const connectivityResults = await identityValidator.testConnectivity();
      
      expect(connectivityResults).toBeDefined();
      expect(connectivityResults.aadhaar).toBeDefined();
      expect(connectivityResults.pan).toBeDefined();
      expect(connectivityResults.passport).toBeDefined();
      expect(connectivityResults.driversLicense).toBeDefined();
    });
  });

  describe('Statistics and Metrics', () => {
    test('should return validation statistics', () => {
      const stats = identityValidator.getValidationStats();
      
      expect(stats.totalValidations).toBe(0);
      expect(stats.successfulValidations).toBe(0);
      expect(stats.failedValidations).toBe(0);
      expect(stats.cacheSize).toBe(0);
      expect(stats.supportedDocuments).toContain('aadhaar');
      expect(stats.supportedDocuments).toContain('pan');
    });

    test('should clear validation cache', () => {
      identityValidator.clearCache();
      const stats = identityValidator.getValidationStats();
      expect(stats.cacheSize).toBe(0);
    });
  });
});