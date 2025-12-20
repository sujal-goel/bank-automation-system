// Document Processor Tests

const DocumentProcessor = require('../services/document-processor');
const { DocumentType, VerificationStatus } = require('../shared/types');

// Mock the OCR Engine to avoid Tesseract dependency in tests
jest.mock('../services/ocr-engine', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(),
    cleanup: jest.fn().mockResolvedValue(),
    extractText: jest.fn(),
    validateExtraction: jest.fn(),
    initialized: true,
    supportedFormats: ['.jpg', '.jpeg', '.png', '.pdf']
  }));
});

describe('Document Processor', () => {
  let documentProcessor;
  let mockOCREngine;

  beforeEach(() => {
    documentProcessor = new DocumentProcessor();
    mockOCREngine = documentProcessor.ocrEngine;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize document processor', async () => {
      await documentProcessor.initialize();
      expect(mockOCREngine.initialize).toHaveBeenCalled();
    });

    test('should cleanup resources', async () => {
      await documentProcessor.cleanup();
      expect(mockOCREngine.cleanup).toHaveBeenCalled();
    });
  });

  describe('Document Processing', () => {
    test('should process document successfully', async () => {
      const mockExtractionResult = {
        rawText: 'PASSPORT P123456789 JOHN DOE',
        extractedData: {
          passportNumber: 'P123456789',
          name: 'JOHN DOE',
          dateOfBirth: '15/06/1985'
        },
        confidence: 95,
        documentType: 'PASSPORT'
      };

      const mockValidation = {
        qualityScore: 95,
        issues: [],
        isValid: true
      };

      mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
      mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

      const result = await documentProcessor.processDocument(
        'mock-passport.jpg',
        DocumentType.PASSPORT,
        { userId: 'user123' }
      );

      expect(result.success).toBe(true);
      expect(result.documentType).toBe(DocumentType.PASSPORT);
      expect(result.extractionResult).toEqual(mockExtractionResult);
      expect(result.validation).toEqual(mockValidation);
      expect(result.metadata.userId).toBe('user123');
      expect(result.metadata.processedAt).toBeDefined();
    });

    test('should handle processing failure', async () => {
      mockOCREngine.extractText.mockRejectedValue(new Error('OCR failed'));

      await expect(
        documentProcessor.processDocument('invalid-file.jpg', DocumentType.PASSPORT)
      ).rejects.toThrow('Document processing failed: OCR failed');
    });

    test('should reject invalid document type', async () => {
      await expect(
        documentProcessor.processDocument('test.jpg', 'INVALID_TYPE')
      ).rejects.toThrow('Invalid document type: INVALID_TYPE');
    });
  });

  describe('Multiple Document Processing', () => {
    test('should process multiple documents concurrently', async () => {
      const mockExtractionResult = {
        rawText: 'Document text',
        extractedData: { name: 'Test User' },
        confidence: 80,
        documentType: 'PASSPORT'
      };

      const mockValidation = {
        qualityScore: 80,
        issues: [],
        isValid: true
      };

      mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
      mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

      const documents = [
        { input: 'doc1.jpg', type: DocumentType.PASSPORT, metadata: { id: 1 } },
        { input: 'doc2.jpg', type: DocumentType.AADHAAR, metadata: { id: 2 } },
        { input: 'doc3.jpg', type: DocumentType.PAN, metadata: { id: 3 } }
      ];

      const results = await documentProcessor.processDocuments(documents);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockOCREngine.extractText).toHaveBeenCalledTimes(3);
    });

    test('should handle mixed success and failure in batch processing', async () => {
      mockOCREngine.extractText
        .mockResolvedValueOnce({
          rawText: 'Success',
          extractedData: { name: 'User1' },
          confidence: 90
        })
        .mockRejectedValueOnce(new Error('Processing failed'))
        .mockResolvedValueOnce({
          rawText: 'Success',
          extractedData: { name: 'User3' },
          confidence: 85
        });

      mockOCREngine.validateExtraction.mockReturnValue({
        qualityScore: 90,
        issues: [],
        isValid: true
      });

      const documents = [
        { input: 'doc1.jpg', type: DocumentType.PASSPORT, metadata: { id: 1 } },
        { input: 'doc2.jpg', type: DocumentType.AADHAAR, metadata: { id: 2 } },
        { input: 'doc3.jpg', type: DocumentType.PAN, metadata: { id: 3 } }
      ];

      const results = await documentProcessor.processDocuments(documents);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(results[1].error).toContain('Processing failed');
    });
  });

  describe('Customer Data Extraction', () => {
    test('should extract customer data from passport', async () => {
      const mockExtractionResult = {
        rawText: 'PASSPORT DATA',
        extractedData: {
          passportNumber: 'P123456789',
          name: 'JOHN MICHAEL DOE',
          dateOfBirth: '15/06/1985',
          nationality: 'AMERICAN',
          expiryDate: '15/06/2030'
        },
        confidence: 95,
        documentType: 'PASSPORT'
      };

      const mockValidation = {
        qualityScore: 95,
        issues: [],
        isValid: true
      };

      mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
      mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

      const customerData = await documentProcessor.extractCustomerData(
        'passport.jpg',
        DocumentType.PASSPORT
      );

      expect(customerData.personalInfo.firstName).toBe('JOHN');
      expect(customerData.personalInfo.lastName).toBe('MICHAEL DOE');
      expect(customerData.personalInfo.dateOfBirth).toBeInstanceOf(Date);
      expect(customerData.personalInfo.nationality).toBe('US');
      
      expect(customerData.identityDocument.documentType).toBe(DocumentType.PASSPORT);
      expect(customerData.identityDocument.documentNumber).toBe('P123456789');
      expect(customerData.identityDocument.verificationStatus).toBe(VerificationStatus.VERIFIED);
      
      expect(customerData.extractionMetadata.confidence).toBe(95);
      expect(customerData.extractionMetadata.qualityScore).toBe(95);
    });

    test('should extract customer data from Aadhaar', async () => {
      const mockExtractionResult = {
        rawText: 'AADHAAR DATA',
        extractedData: {
          aadhaarNumber: '123456789012',
          name: 'JOHN DOE',
          dateOfBirth: '15/06/1985'
        },
        confidence: 88,
        documentType: 'AADHAAR'
      };

      const mockValidation = {
        qualityScore: 88,
        issues: [],
        isValid: true
      };

      mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
      mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

      const customerData = await documentProcessor.extractCustomerData(
        'aadhaar.jpg',
        DocumentType.AADHAAR
      );

      expect(customerData.personalInfo.firstName).toBe('JOHN');
      expect(customerData.personalInfo.lastName).toBe('DOE');
      expect(customerData.identityDocument.documentNumber).toBe('123456789012');
      expect(customerData.identityDocument.issuingAuthority).toBe('Unique Identification Authority of India');
    });

    test('should handle low-quality extraction', async () => {
      const mockExtractionResult = {
        rawText: 'Poor quality text',
        extractedData: { name: 'UNCLEAR' },
        confidence: 40,
        documentType: 'PASSPORT'
      };

      const mockValidation = {
        qualityScore: 40,
        issues: ['Low confidence extraction'],
        isValid: false
      };

      mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
      mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

      await expect(
        documentProcessor.extractCustomerData('poor-quality.jpg', DocumentType.PASSPORT)
      ).rejects.toThrow('Failed to extract customer data');
    });
  });

  describe('Data Mapping Utilities', () => {
    test('should map nationality correctly', () => {
      expect(documentProcessor.mapNationality('INDIAN')).toBe('IN');
      expect(documentProcessor.mapNationality('AMERICAN')).toBe('US');
      expect(documentProcessor.mapNationality('BRITISH')).toBe('GB');
      expect(documentProcessor.mapNationality('UNKNOWN_COUNTRY')).toBe('UN');
    });

    test('should parse dates correctly', () => {
      const date1 = documentProcessor.parseDate('15/06/1985');
      expect(date1.getFullYear()).toBe(1985);
      expect(date1.getMonth()).toBe(5); // June (0-indexed)
      expect(date1.getDate()).toBe(15);

      const date2 = documentProcessor.parseDate('15-06-1985');
      expect(date2.getFullYear()).toBe(1985);
    });

    test('should parse address correctly', () => {
      const address = documentProcessor.parseAddress('123 Main St, New York, NY');
      expect(address.street).toBe('123 Main St');
      expect(address.city).toBe('New York');
      expect(address.state).toBe('NY');
    });
  });

  describe('Batch Processing', () => {
    test('should create correct batches', () => {
      const items = [1, 2, 3, 4, 5, 6, 7];
      const batches = documentProcessor.createBatches(items, 3);
      
      expect(batches).toHaveLength(3);
      expect(batches[0]).toEqual([1, 2, 3]);
      expect(batches[1]).toEqual([4, 5, 6]);
      expect(batches[2]).toEqual([7]);
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should return processing statistics', () => {
      const stats = documentProcessor.getProcessingStats();
      
      expect(stats.ocrEngineInitialized).toBe(true);
      expect(stats.maxConcurrentProcessing).toBe(3);
      expect(stats.queueLength).toBe(0);
      expect(stats.supportedFormats).toContain('.jpg');
    });

    test('should log processing results', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockResult = {
        documentType: 'PASSPORT',
        success: true,
        validation: { qualityScore: 95, issues: [] },
        metadata: { processingTime: 1500 }
      };

      documentProcessor.logProcessingResult(mockResult);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Document Processing Result:',
        expect.stringContaining('PASSPORT')
      );
      
      consoleSpy.mockRestore();
    });
  });
});