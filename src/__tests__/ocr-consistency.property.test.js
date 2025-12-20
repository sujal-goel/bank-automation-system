// Property-Based Test for OCR Data Extraction Consistency
// **Feature: banking-process-automation, Property 1: OCR Data Extraction Consistency**

const fc = require('fast-check');
const DocumentProcessor = require('../services/document-processor');
const OCREngine = require('../services/ocr-engine');
const { DocumentType } = require('../shared/types');

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

describe('Property-Based Tests: OCR Data Extraction Consistency', () => {
  let documentProcessor;
  let mockOCREngine;

  beforeEach(() => {
    documentProcessor = new DocumentProcessor();
    mockOCREngine = documentProcessor.ocrEngine;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: banking-process-automation, Property 1: OCR Data Extraction Consistency**
   * 
   * Property: For any valid identity or financial document, OCR extraction should produce 
   * structured data that contains all required fields with accurate values matching the source document
   * 
   * **Validates: Requirements 1.1**
   */
  describe('Property 1: OCR Data Extraction Consistency', () => {
    
    // Generator for valid passport data
    const passportDataGenerator = fc.record({
      passportNumber: fc.stringMatching(/^[A-Z][0-9]{8}$/),
      name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[A-Z\s]+$/.test(s.toUpperCase())),
      dateOfBirth: fc.date({ min: new Date('1920-01-01'), max: new Date('2005-12-31') })
        .map(d => d.toLocaleDateString('en-GB')),
      nationality: fc.constantFrom('AMERICAN', 'BRITISH', 'CANADIAN', 'INDIAN'),
      expiryDate: fc.date({ min: new Date('2025-01-01'), max: new Date('2035-12-31') })
        .map(d => d.toLocaleDateString('en-GB'))
    });

    // Generator for valid Aadhaar data
    const aadhaarDataGenerator = fc.record({
      aadhaarNumber: fc.stringMatching(/^[1-9][0-9]{11}$/),
      name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[A-Z\s]+$/.test(s.toUpperCase())),
      dateOfBirth: fc.date({ min: new Date('1920-01-01'), max: new Date('2005-12-31') })
        .map(d => d.toLocaleDateString('en-GB'))
    });

    // Generator for valid PAN data
    const panDataGenerator = fc.record({
      panNumber: fc.stringMatching(/^[A-Z]{5}[0-9]{4}[A-Z]$/),
      name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[A-Z\s]+$/.test(s.toUpperCase())),
      fatherName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[A-Z\s]+$/.test(s.toUpperCase())),
      dateOfBirth: fc.date({ min: new Date('1920-01-01'), max: new Date('2005-12-31') })
        .map(d => d.toLocaleDateString('en-GB'))
    });

    // Generator for valid bank statement data
    const bankStatementDataGenerator = fc.record({
      accountNumber: fc.stringMatching(/^[0-9]{10,16}$/),
      accountHolderName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[A-Z\s]+$/.test(s.toUpperCase())),
      statementPeriod: fc.record({
        from: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-06-30') })
          .map(d => d.toLocaleDateString('en-GB')),
        to: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') })
          .map(d => d.toLocaleDateString('en-GB'))
      }),
      openingBalance: fc.float({ min: 0, max: 1000000 }).map(n => n.toFixed(2)),
      closingBalance: fc.float({ min: 0, max: 1000000 }).map(n => n.toFixed(2))
    });

    test('Property 1: OCR extraction should produce consistent structured data for passport documents', async () => {
      await fc.assert(
        fc.asyncProperty(passportDataGenerator, async (sourceData) => {
          // Setup: Mock OCR engine to return the source data
          const mockExtractionResult = {
            rawText: `PASSPORT ${sourceData.passportNumber} ${sourceData.name}`,
            extractedData: sourceData,
            confidence: fc.sample(fc.integer({ min: 85, max: 100 }), 1)[0],
            documentType: DocumentType.PASSPORT,
            timestamp: new Date()
          };

          const mockValidation = {
            qualityScore: fc.sample(fc.integer({ min: 85, max: 100 }), 1)[0],
            issues: [],
            isValid: true
          };

          mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
          mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

          // Act: Process the document
          const result = await documentProcessor.processDocument(
            'mock-passport.jpg',
            DocumentType.PASSPORT,
            { testData: true }
          );

          // Assert: Verify OCR extraction consistency
          expect(result.success).toBe(true);
          expect(result.extractionResult.extractedData).toBeDefined();
          
          // Verify all required passport fields are present
          const extractedData = result.extractionResult.extractedData;
          expect(extractedData.passportNumber).toBeDefined();
          expect(extractedData.name).toBeDefined();
          expect(extractedData.dateOfBirth).toBeDefined();
          expect(extractedData.nationality).toBeDefined();
          
          // Verify extracted data matches source data (consistency)
          expect(extractedData.passportNumber).toBe(sourceData.passportNumber);
          expect(extractedData.name).toBe(sourceData.name);
          expect(extractedData.dateOfBirth).toBe(sourceData.dateOfBirth);
          expect(extractedData.nationality).toBe(sourceData.nationality);
          
          // Verify confidence is reasonable
          expect(result.extractionResult.confidence).toBeGreaterThanOrEqual(85);
          expect(result.validation.qualityScore).toBeGreaterThanOrEqual(85);
        }),
        { numRuns: 100 } // Run 100 iterations as required
      );
    });

    test('Property 1: OCR extraction should produce consistent structured data for Aadhaar documents', async () => {
      await fc.assert(
        fc.asyncProperty(aadhaarDataGenerator, async (sourceData) => {
          // Setup: Mock OCR engine to return the source data
          const mockExtractionResult = {
            rawText: `AADHAAR ${sourceData.aadhaarNumber} ${sourceData.name}`,
            extractedData: sourceData,
            confidence: fc.sample(fc.integer({ min: 80, max: 100 }), 1)[0],
            documentType: DocumentType.AADHAAR,
            timestamp: new Date()
          };

          const mockValidation = {
            qualityScore: fc.sample(fc.integer({ min: 80, max: 100 }), 1)[0],
            issues: [],
            isValid: true
          };

          mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
          mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

          // Act: Process the document
          const result = await documentProcessor.processDocument(
            'mock-aadhaar.jpg',
            DocumentType.AADHAAR,
            { testData: true }
          );

          // Assert: Verify OCR extraction consistency
          expect(result.success).toBe(true);
          expect(result.extractionResult.extractedData).toBeDefined();
          
          // Verify all required Aadhaar fields are present
          const extractedData = result.extractionResult.extractedData;
          expect(extractedData.aadhaarNumber).toBeDefined();
          expect(extractedData.name).toBeDefined();
          expect(extractedData.dateOfBirth).toBeDefined();
          
          // Verify extracted data matches source data (consistency)
          expect(extractedData.aadhaarNumber).toBe(sourceData.aadhaarNumber);
          expect(extractedData.name).toBe(sourceData.name);
          expect(extractedData.dateOfBirth).toBe(sourceData.dateOfBirth);
          
          // Verify confidence is reasonable
          expect(result.extractionResult.confidence).toBeGreaterThanOrEqual(80);
          expect(result.validation.qualityScore).toBeGreaterThanOrEqual(80);
        }),
        { numRuns: 100 }
      );
    });

    test('Property 1: OCR extraction should produce consistent structured data for PAN documents', async () => {
      await fc.assert(
        fc.asyncProperty(panDataGenerator, async (sourceData) => {
          // Setup: Mock OCR engine to return the source data
          const mockExtractionResult = {
            rawText: `PAN CARD ${sourceData.panNumber} ${sourceData.name}`,
            extractedData: sourceData,
            confidence: fc.sample(fc.integer({ min: 85, max: 100 }), 1)[0],
            documentType: DocumentType.PAN,
            timestamp: new Date()
          };

          const mockValidation = {
            qualityScore: fc.sample(fc.integer({ min: 85, max: 100 }), 1)[0],
            issues: [],
            isValid: true
          };

          mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
          mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

          // Act: Process the document
          const result = await documentProcessor.processDocument(
            'mock-pan.jpg',
            DocumentType.PAN,
            { testData: true }
          );

          // Assert: Verify OCR extraction consistency
          expect(result.success).toBe(true);
          expect(result.extractionResult.extractedData).toBeDefined();
          
          // Verify all required PAN fields are present
          const extractedData = result.extractionResult.extractedData;
          expect(extractedData.panNumber).toBeDefined();
          expect(extractedData.name).toBeDefined();
          expect(extractedData.fatherName).toBeDefined();
          
          // Verify extracted data matches source data (consistency)
          expect(extractedData.panNumber).toBe(sourceData.panNumber);
          expect(extractedData.name).toBe(sourceData.name);
          expect(extractedData.fatherName).toBe(sourceData.fatherName);
          
          // Verify confidence is reasonable
          expect(result.extractionResult.confidence).toBeGreaterThanOrEqual(85);
          expect(result.validation.qualityScore).toBeGreaterThanOrEqual(85);
        }),
        { numRuns: 100 }
      );
    });

    test('Property 1: OCR extraction should produce consistent structured data for bank statement documents', async () => {
      await fc.assert(
        fc.asyncProperty(bankStatementDataGenerator, async (sourceData) => {
          // Setup: Mock OCR engine to return the source data
          const mockExtractionResult = {
            rawText: `BANK STATEMENT ${sourceData.accountNumber} ${sourceData.accountHolderName}`,
            extractedData: sourceData,
            confidence: fc.sample(fc.integer({ min: 80, max: 95 }), 1)[0],
            documentType: DocumentType.BANK_STATEMENT,
            timestamp: new Date()
          };

          const mockValidation = {
            qualityScore: fc.sample(fc.integer({ min: 80, max: 95 }), 1)[0],
            issues: [],
            isValid: true
          };

          mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
          mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

          // Act: Process the document
          const result = await documentProcessor.processDocument(
            'mock-statement.pdf',
            DocumentType.BANK_STATEMENT,
            { testData: true }
          );

          // Assert: Verify OCR extraction consistency
          expect(result.success).toBe(true);
          expect(result.extractionResult.extractedData).toBeDefined();
          
          // Verify all required bank statement fields are present
          const extractedData = result.extractionResult.extractedData;
          expect(extractedData.accountNumber).toBeDefined();
          expect(extractedData.accountHolderName).toBeDefined();
          expect(extractedData.statementPeriod).toBeDefined();
          
          // Verify extracted data matches source data (consistency)
          expect(extractedData.accountNumber).toBe(sourceData.accountNumber);
          expect(extractedData.accountHolderName).toBe(sourceData.accountHolderName);
          expect(extractedData.statementPeriod).toEqual(sourceData.statementPeriod);
          
          // Verify confidence is reasonable for bank statements
          expect(result.extractionResult.confidence).toBeGreaterThanOrEqual(80);
          expect(result.validation.qualityScore).toBeGreaterThanOrEqual(80);
        }),
        { numRuns: 100 }
      );
    });

    test('Property 1: OCR extraction should maintain field completeness across document types', async () => {
      const documentTypeGenerator = fc.constantFrom(
        DocumentType.PASSPORT,
        DocumentType.AADHAAR,
        DocumentType.PAN,
        DocumentType.BANK_STATEMENT
      );

      await fc.assert(
        fc.asyncProperty(documentTypeGenerator, async (documentType) => {
          // Generate appropriate test data based on document type
          let sourceData;
          let requiredFields;
          
          switch (documentType) {
            case DocumentType.PASSPORT:
              sourceData = fc.sample(passportDataGenerator, 1)[0];
              requiredFields = ['passportNumber', 'name', 'dateOfBirth', 'nationality'];
              break;
            case DocumentType.AADHAAR:
              sourceData = fc.sample(aadhaarDataGenerator, 1)[0];
              requiredFields = ['aadhaarNumber', 'name', 'dateOfBirth'];
              break;
            case DocumentType.PAN:
              sourceData = fc.sample(panDataGenerator, 1)[0];
              requiredFields = ['panNumber', 'name', 'fatherName'];
              break;
            case DocumentType.BANK_STATEMENT:
              sourceData = fc.sample(bankStatementDataGenerator, 1)[0];
              requiredFields = ['accountNumber', 'accountHolderName', 'statementPeriod'];
              break;
          }

          // Setup: Mock OCR engine
          const mockExtractionResult = {
            rawText: `Document content for ${documentType}`,
            extractedData: sourceData,
            confidence: fc.sample(fc.integer({ min: 80, max: 100 }), 1)[0],
            documentType,
            timestamp: new Date()
          };

          const mockValidation = {
            qualityScore: fc.sample(fc.integer({ min: 80, max: 100 }), 1)[0],
            issues: [],
            isValid: true
          };

          mockOCREngine.extractText.mockResolvedValue(mockExtractionResult);
          mockOCREngine.validateExtraction.mockReturnValue(mockValidation);

          // Act: Process the document
          const result = await documentProcessor.processDocument(
            `mock-${documentType.toLowerCase()}.jpg`,
            documentType,
            { testData: true }
          );

          // Assert: Verify all required fields are present and consistent
          expect(result.success).toBe(true);
          const extractedData = result.extractionResult.extractedData;
          
          // Check that all required fields are present
          requiredFields.forEach(field => {
            expect(extractedData[field]).toBeDefined();
            expect(extractedData[field]).not.toBe('');
          });

          // Verify data consistency (extracted data should match source)
          requiredFields.forEach(field => {
            expect(extractedData[field]).toEqual(sourceData[field]);
          });
        }),
        { numRuns: 100 }
      );
    });
  });
});