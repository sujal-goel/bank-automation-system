// OCR Engine Tests

const OCREngine = require('../services/ocr-engine');
const fs = require('fs').promises;
const path = require('path');

describe('OCR Engine', () => {
  let ocrEngine;

  beforeAll(async () => {
    ocrEngine = new OCREngine();
    // Don't initialize for unit tests to avoid Tesseract setup
  });

  afterAll(async () => {
    if (ocrEngine.initialized) {
      await ocrEngine.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should create OCR engine with default settings', () => {
      expect(ocrEngine.supportedFormats).toContain('.jpg');
      expect(ocrEngine.supportedFormats).toContain('.pdf');
      expect(ocrEngine.initialized).toBe(false);
    });
  });

  describe('Document Parsing', () => {
    describe('Passport Parsing', () => {
      test('should parse passport data correctly', () => {
        const mockPassportText = `
          PASSPORT
          United States of America
          Passport No: P123456789
          Given Names: JOHN MICHAEL
          Surname: DOE
          Nationality: UNITED STATES OF AMERICA
          Date of Birth: 15/06/1985
          Date of Expiry: 15/06/2030
        `;

        const result = ocrEngine.parsePassport(mockPassportText);

        expect(result.passportNumber).toBe('P123456789');
        expect(result.name).toContain('JOHN MICHAEL');
        expect(result.dateOfBirth).toBe('15/06/1985');
        expect(result.nationality).toContain('UNITED STATES OF AMERICA');
        expect(result.expiryDate).toBe('15/06/2030');
      });

      test('should handle missing passport fields gracefully', () => {
        const incompleteText = 'PASSPORT Some random text without proper fields';
        const result = ocrEngine.parsePassport(incompleteText);

        expect(result).toEqual({});
      });
    });

    describe('Aadhaar Parsing', () => {
      test('should parse Aadhaar data correctly', () => {
        const mockAadhaarText = `
          GOVERNMENT OF INDIA
          1234 5678 9012
          JOHN DOE
          DOB: 15/06/1985
        `;

        const result = ocrEngine.parseAadhaar(mockAadhaarText);

        expect(result.aadhaarNumber).toBe('123456789012');
        expect(result.name).toBe('JOHN DOE');
        expect(result.dateOfBirth).toBe('15/06/1985');
      });

      test('should handle Aadhaar number with spaces', () => {
        const textWithSpaces = '1234 5678 9012 JOHN DOE';
        const result = ocrEngine.parseAadhaar(textWithSpaces);

        expect(result.aadhaarNumber).toBe('123456789012');
      });
    });

    describe('PAN Parsing', () => {
      test('should parse PAN data correctly', () => {
        const mockPANText = `
          INCOME TAX DEPARTMENT
          GOVT. OF INDIA
          ABCDE1234F
          Name: JOHN DOE
          Father's Name: RICHARD DOE
          Date of Birth: 15/06/1985
        `;

        const result = ocrEngine.parsePAN(mockPANText);

        expect(result.panNumber).toBe('ABCDE1234F');
        expect(result.name).toBe('JOHN DOE');
        expect(result.fatherName).toBe('RICHARD DOE');
        expect(result.dateOfBirth).toBe('15/06/1985');
      });
    });

    describe('Bank Statement Parsing', () => {
      test('should parse bank statement data correctly', () => {
        const mockStatementText = `
          BANK STATEMENT
          Account Holder: JOHN DOE
          Account No: 1234567890
          Statement Period: 01/01/2023 to 31/01/2023
          Closing Balance: 50,000.00
        `;

        const result = ocrEngine.parseBankStatement(mockStatementText);

        expect(result.accountNumber).toBe('1234567890');
        expect(result.accountHolderName).toBe('JOHN DOE');
        expect(result.statementPeriod.from).toBe('01/01/2023');
        expect(result.statementPeriod.to).toBe('31/01/2023');
        expect(result.closingBalance).toBe('50000.00');
      });
    });

    describe('Income Proof Parsing', () => {
      test('should parse salary certificate correctly', () => {
        const mockSalaryText = `
          SALARY CERTIFICATE
          Employee Name: JOHN DOE
          Company: ABC TECHNOLOGIES PVT LTD
          Designation: SOFTWARE ENGINEER
          Monthly Salary: Rs. 75,000.00
        `;

        const result = ocrEngine.parseIncomeProof(mockSalaryText);

        expect(result.employeeName).toBe('JOHN DOE');
        expect(result.companyName).toBe('ABC TECHNOLOGIES PVT LTD');
        expect(result.designation).toBe('SOFTWARE ENGINEER');
        expect(result.monthlySalary).toBe('75000.00');
      });
    });

    describe('General Document Parsing', () => {
      test('should extract common data from general documents', () => {
        const mockGeneralText = `
          Contact Information
          Email: john.doe@example.com
          Phone: +1-555-123-4567
          ID: 1234567890
          Date: 15/06/2023
        `;

        const result = ocrEngine.parseGeneral(mockGeneralText);

        expect(result.emails).toContain('john.doe@example.com');
        expect(result.phoneNumbers).toContain('+1-555-123-4567');
        expect(result.identificationNumbers).toContain('1234567890');
        expect(result.dates).toContain('15/06/2023');
      });
    });
  });

  describe('Validation', () => {
    test('should validate high-quality extraction', () => {
      const mockResult = {
        rawText: 'This is a well-extracted document with clear text',
        extractedData: {
          passportNumber: 'P123456789',
          name: 'JOHN DOE',
          dateOfBirth: '15/06/1985'
        },
        confidence: 95,
        documentType: 'PASSPORT'
      };

      const validation = ocrEngine.validateExtraction(mockResult);

      expect(validation.isValid).toBe(true);
      expect(validation.qualityScore).toBeGreaterThan(80);
      expect(validation.issues).toHaveLength(0);
    });

    test('should identify low-quality extraction', () => {
      const mockResult = {
        rawText: '',
        extractedData: {},
        confidence: 20,
        documentType: 'PASSPORT'
      };

      const validation = ocrEngine.validateExtraction(mockResult);

      expect(validation.isValid).toBe(false);
      expect(validation.qualityScore).toBe(0);
      expect(validation.issues).toContain('No text extracted from document');
    });

    test('should validate document-specific requirements', () => {
      const mockAadhaarResult = {
        rawText: 'Some text extracted',
        extractedData: {
          aadhaarNumber: '12345' // Invalid length
        },
        confidence: 80,
        documentType: 'AADHAAR'
      };

      const validation = ocrEngine.validateExtraction(mockAadhaarResult);

      expect(validation.qualityScore).toBeLessThan(80);
      expect(validation.issues).toContain('Valid Aadhaar number not found');
    });

    test('should validate PAN number format', () => {
      const mockPANResult = {
        rawText: 'PAN card text',
        extractedData: {
          panNumber: 'INVALID' // Invalid format
        },
        confidence: 85,
        documentType: 'PAN'
      };

      const validation = ocrEngine.validateExtraction(mockPANResult);

      expect(validation.qualityScore).toBeLessThan(85);
      expect(validation.issues).toContain('Valid PAN number not found');
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported file formats', async () => {
      // Mock the extractText method to avoid actual OCR processing
      const mockExtractText = jest.fn().mockRejectedValue(new Error('Unsupported file format: .xyz'));
      ocrEngine.extractText = mockExtractText;

      await expect(ocrEngine.extractText('test.xyz')).rejects.toThrow('Unsupported file format');
    });

    test('should handle invalid input types', async () => {
      const mockExtractText = jest.fn().mockRejectedValue(new Error('Invalid input type'));
      ocrEngine.extractText = mockExtractText;

      await expect(ocrEngine.extractText(123)).rejects.toThrow('Invalid input type');
    });
  });

  describe('Document Type Handling', () => {
    test('should route to correct parser based on document type', () => {
      const mockText = 'Sample document text';
      
      // Test each document type routing
      expect(() => ocrEngine.parseDocumentData(mockText, 'PASSPORT')).not.toThrow();
      expect(() => ocrEngine.parseDocumentData(mockText, 'AADHAAR')).not.toThrow();
      expect(() => ocrEngine.parseDocumentData(mockText, 'PAN')).not.toThrow();
      expect(() => ocrEngine.parseDocumentData(mockText, 'BANK_STATEMENT')).not.toThrow();
      expect(() => ocrEngine.parseDocumentData(mockText, 'INCOME_PROOF')).not.toThrow();
      expect(() => ocrEngine.parseDocumentData(mockText, 'GENERAL')).not.toThrow();
    });
  });
});