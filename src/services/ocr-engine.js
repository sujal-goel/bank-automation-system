// OCR Engine Service for Document Processing

const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');

class OCREngine {
  constructor(options = {}) {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.pdf'];
    this.initialized = false;
    this.mockMode = options.mockMode || process.env.NODE_ENV === 'test';
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Initialize Tesseract worker with updated API
      this.worker = await Tesseract.createWorker('eng');
      this.initialized = true;
    } catch (error) {
      console.error('OCR initialization failed:', error);
      // Fallback: create worker without language parameter
      try {
        this.worker = await Tesseract.createWorker();
        await this.worker.load();
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng');
        this.initialized = true;
      } catch (fallbackError) {
        console.error('OCR fallback initialization failed:', fallbackError);
        throw new Error(`OCR initialization failed: ${fallbackError.message}`);
      }
    }
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.initialized = false;
    }
  }

  /**
   * Extract text from document using OCR
   * @param {string|Buffer} input - File path or buffer
   * @param {string} documentType - Type of document for specialized extraction
   * @returns {Promise<Object>} Extracted data with confidence scores
   */
  async extractText(input, documentType = 'GENERAL') {
    if (!this.initialized && !this.mockMode) {
      await this.initialize();
    }

    try {
      let textContent = '';
      let confidence = 0;
      
      // Handle mock mode for testing
      if (this.mockMode && typeof input === 'string' && input.startsWith('mock-')) {
        return this.generateMockExtraction(input, documentType);
      }
      
      if (typeof input === 'string') {
        // File path provided
        const ext = path.extname(input).toLowerCase();
        
        if (ext === '.pdf') {
          textContent = await this.extractFromPDF(input);
          confidence = 95; // PDF text extraction is usually very accurate
        } else if (this.supportedFormats.includes(ext)) {
          const result = await this.extractFromImage(input);
          textContent = result.text;
          confidence = result.confidence;
        } else {
          throw new Error(`Unsupported file format: ${ext}`);
        }
      } else if (Buffer.isBuffer(input)) {
        // Buffer provided (assume image)
        const result = await this.extractFromImageBuffer(input);
        textContent = result.text;
        confidence = result.confidence;
      } else {
        throw new Error('Invalid input type. Expected file path or buffer.');
      }

      // Apply document-specific extraction rules
      const extractedData = this.parseDocumentData(textContent, documentType);
      
      return {
        rawText: textContent,
        extractedData,
        confidence,
        documentType,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF document
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<string>} Extracted text
   */
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image file
   * @param {string} filePath - Path to image file
   * @returns {Promise<Object>} Extracted text and confidence
   */
  async extractFromImage(filePath) {
    try {
      const { data: { text, confidence } } = await this.worker.recognize(filePath);
      return { text: text.trim(), confidence };
    } catch (error) {
      throw new Error(`Image OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image buffer
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<Object>} Extracted text and confidence
   */
  async extractFromImageBuffer(buffer) {
    try {
      const { data: { text, confidence } } = await this.worker.recognize(buffer);
      return { text: text.trim(), confidence };
    } catch (error) {
      throw new Error(`Image buffer OCR failed: ${error.message}`);
    }
  }

  /**
   * Parse document-specific data from raw text
   * @param {string} text - Raw extracted text
   * @param {string} documentType - Type of document
   * @returns {Object} Structured data extracted from document
   */
  parseDocumentData(text, documentType) {
    const extractedData = {};
    
    switch (documentType) {
      case 'PASSPORT':
        return this.parsePassport(text);
      case 'DRIVERS_LICENSE':
        return this.parseDriversLicense(text);
      case 'NATIONAL_ID':
        return this.parseNationalID(text);
      case 'AADHAAR':
        return this.parseAadhaar(text);
      case 'PAN':
        return this.parsePAN(text);
      case 'BANK_STATEMENT':
        return this.parseBankStatement(text);
      case 'INCOME_PROOF':
        return this.parseIncomeProof(text);
      default:
        return this.parseGeneral(text);
    }
  }

  /**
   * Parse passport document
   * @param {string} text - Raw text from passport
   * @returns {Object} Structured passport data
   */
  parsePassport(text) {
    const data = {};
    
    // Extract passport number (typically 8-9 characters)
    const passportMatch = text.match(/(?:Passport\s*No\.?|No\.?)\s*:?\s*([A-Z0-9]{8,10})/i);
    if (passportMatch) data.passportNumber = passportMatch[1];
    
    // Extract name (look for Given Names or Surname patterns)
    const nameMatch = text.match(/(?:Given Names?|Surname)\s*:?\s*([A-Z\s]+?)(?=\s*(?:Surname|Nationality|Date|$))/i);
    if (nameMatch) data.name = nameMatch[1].trim();
    
    // Extract date of birth
    const dobMatch = text.match(/(?:Date of Birth|DOB)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (dobMatch) data.dateOfBirth = dobMatch[1];
    
    // Extract nationality
    const nationalityMatch = text.match(/(?:Nationality)\s*:?\s*([A-Z\s]+)/i);
    if (nationalityMatch) data.nationality = nationalityMatch[1].trim();
    
    // Extract expiry date
    const expiryMatch = text.match(/(?:Date of Expiry|Expires?)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (expiryMatch) data.expiryDate = expiryMatch[1];
    
    return data;
  }

  /**
   * Parse driver's license
   * @param {string} text - Raw text from driver's license
   * @returns {Object} Structured license data
   */
  parseDriversLicense(text) {
    const data = {};
    
    // Extract license number
    const licenseMatch = text.match(/(?:License|DL)\s*(?:No\.?|#)\s*:?\s*([A-Z0-9]+)/i);
    if (licenseMatch) data.licenseNumber = licenseMatch[1];
    
    // Extract name
    const nameMatch = text.match(/(?:Name)\s*:?\s*([A-Z\s]+)/i);
    if (nameMatch) data.name = nameMatch[1].trim();
    
    // Extract date of birth
    const dobMatch = text.match(/(?:DOB|Date of Birth)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (dobMatch) data.dateOfBirth = dobMatch[1];
    
    // Extract address
    const addressMatch = text.match(/(?:Address)\s*:?\s*([A-Z0-9\s,.-]+)/i);
    if (addressMatch) data.address = addressMatch[1].trim();
    
    return data;
  }

  /**
   * Parse Aadhaar card
   * @param {string} text - Raw text from Aadhaar card
   * @returns {Object} Structured Aadhaar data
   */
  parseAadhaar(text) {
    const data = {};
    
    // Extract Aadhaar number (12 digits)
    const aadhaarMatch = text.match(/(\d{4}\s?\d{4}\s?\d{4})/);
    if (aadhaarMatch) data.aadhaarNumber = aadhaarMatch[1].replace(/\s/g, '');
    
    // Extract name (look for name after Aadhaar number or before DOB)
    const nameMatch = text.match(/(?:\d{4}\s?\d{4}\s?\d{4})\s*([A-Z\s]+?)(?=\s*(?:DOB|Date of Birth|$))/i);
    if (nameMatch) data.name = nameMatch[1].trim();
    
    // Extract date of birth
    const dobMatch = text.match(/(?:DOB|Date of Birth)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (dobMatch) data.dateOfBirth = dobMatch[1];
    
    return data;
  }

  /**
   * Parse PAN card
   * @param {string} text - Raw text from PAN card
   * @returns {Object} Structured PAN data
   */
  parsePAN(text) {
    const data = {};
    
    // Extract PAN number (10 characters: 5 letters, 4 digits, 1 letter)
    const panMatch = text.match(/([A-Z]{5}\d{4}[A-Z])/);
    if (panMatch) data.panNumber = panMatch[1];
    
    // Extract name (look for Name field, stop at Father's Name)
    const nameMatch = text.match(/(?:Name)\s*:?\s*([A-Z\s]+?)(?=\s*(?:Father|DOB|Date|$))/i);
    if (nameMatch) data.name = nameMatch[1].trim();
    
    // Extract father's name
    const fatherMatch = text.match(/(?:Father's Name)\s*:?\s*([A-Z\s]+?)(?=\s*(?:DOB|Date|$))/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    
    // Extract date of birth
    const dobMatch = text.match(/(?:DOB|Date of Birth)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (dobMatch) data.dateOfBirth = dobMatch[1];
    
    return data;
  }

  /**
   * Parse bank statement
   * @param {string} text - Raw text from bank statement
   * @returns {Object} Structured bank statement data
   */
  parseBankStatement(text) {
    const data = {};
    
    // Extract account number
    const accountMatch = text.match(/(?:Account|A\/C)\s*(?:No\.?|#)\s*:?\s*([0-9]+)/i);
    if (accountMatch) data.accountNumber = accountMatch[1];
    
    // Extract account holder name
    const nameMatch = text.match(/(?:Account Holder)\s*:?\s*([A-Z\s]+?)(?=\s*(?:Account|Statement|$))/i);
    if (nameMatch) data.accountHolderName = nameMatch[1].trim();
    
    // Extract statement period
    const periodMatch = text.match(/(?:Statement Period|From)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s*(?:to|To)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    if (periodMatch) {
      data.statementPeriod = {
        from: periodMatch[1],
        to: periodMatch[2]
      };
    }
    
    // Extract balance information
    const balanceMatch = text.match(/(?:Balance|Closing Balance)\s*:?\s*([0-9,]+\.?\d*)/i);
    if (balanceMatch) data.closingBalance = balanceMatch[1].replace(/,/g, '');
    
    return data;
  }

  /**
   * Parse income proof document
   * @param {string} text - Raw text from income proof
   * @returns {Object} Structured income data
   */
  parseIncomeProof(text) {
    const data = {};
    
    // Extract employee name
    const nameMatch = text.match(/(?:Employee Name)\s*:?\s*([A-Z\s]+?)(?=\s*(?:Company|Designation|$))/i);
    if (nameMatch) data.employeeName = nameMatch[1].trim();
    
    // Extract salary amount
    const salaryMatch = text.match(/(?:Salary|Monthly Income|Gross)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([0-9,]+\.?\d*)/i);
    if (salaryMatch) data.monthlySalary = salaryMatch[1].replace(/,/g, '');
    
    // Extract company name
    const companyMatch = text.match(/(?:Company)\s*:?\s*([A-Z\s&.]+?)(?=\s*(?:Designation|Monthly|$))/i);
    if (companyMatch) data.companyName = companyMatch[1].trim();
    
    // Extract designation
    const designationMatch = text.match(/(?:Designation)\s*:?\s*([A-Z\s]+?)(?=\s*(?:Monthly|Salary|$))/i);
    if (designationMatch) data.designation = designationMatch[1].trim();
    
    return data;
  }

  /**
   * Generate mock extraction for testing
   * @param {string} mockInput - Mock input string
   * @param {string} documentType - Document type
   * @returns {Object} Mock extraction result
   */
  generateMockExtraction(mockInput, documentType) {
    const mockData = {
      'mock-income-doc': {
        rawText: 'INCOME CERTIFICATE\nEmployee Name: John Doe\nCompany: Tech Corp\nMonthly Salary: Rs. 50000\nDesignation: Software Engineer',
        extractedData: {
          employeeName: 'John Doe',
          companyName: 'Tech Corp',
          monthlySalary: '50000',
          designation: 'Software Engineer'
        },
        confidence: 85
      },
      'mock-bank-statement': {
        rawText: 'BANK STATEMENT\nAccount No: 1234567890\nAccount Holder: John Doe\nClosing Balance: Rs. 100000',
        extractedData: {
          accountNumber: '1234567890',
          accountHolderName: 'John Doe',
          closingBalance: '100000'
        },
        confidence: 90
      },
      'mock-passport': {
        rawText: 'PASSPORT\nPassport No: A1234567\nName: John Doe\nDate of Birth: 01/01/1990\nNationality: INDIAN',
        extractedData: {
          passportNumber: 'A1234567',
          name: 'John Doe',
          dateOfBirth: '01/01/1990',
          nationality: 'INDIAN'
        },
        confidence: 95
      }
    };

    const mock = mockData[mockInput] || {
      rawText: 'Mock document text',
      extractedData: { mockField: 'mockValue' },
      confidence: 80
    };

    return {
      rawText: mock.rawText,
      extractedData: mock.extractedData,
      confidence: mock.confidence,
      documentType,
      timestamp: new Date()
    };
  }

  /**
   * Parse general document (extract common fields)
   * @param {string} text - Raw text
   * @returns {Object} General extracted data
   */
  parseGeneral(text) {
    const data = {};
    
    // Extract any dates
    const dates = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g);
    if (dates) data.dates = dates;
    
    // Extract any numbers that might be IDs
    const numbers = text.match(/\b\d{8,}\b/g);
    if (numbers) data.identificationNumbers = numbers;
    
    // Extract email addresses
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emails) data.emails = emails;
    
    // Extract phone numbers (including international format)
    const phones = text.match(/(?:\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g);
    if (phones) data.phoneNumbers = phones;
    
    return data;
  }

  /**
   * Validate extracted data quality
   * @param {Object} extractionResult - Result from extractText
   * @returns {Object} Validation result with quality score
   */
  validateExtraction(extractionResult) {
    const { rawText, extractedData, confidence, documentType } = extractionResult;
    
    let qualityScore = confidence;
    const issues = [];
    
    // Check if text was extracted
    if (!rawText || rawText.trim().length === 0) {
      qualityScore = 0;
      issues.push('No text extracted from document');
      return { qualityScore, issues, isValid: false };
    }
    
    // Check if structured data was extracted
    if (!extractedData || Object.keys(extractedData).length === 0) {
      qualityScore *= 0.5;
      issues.push('No structured data extracted');
    }
    
    // Document-specific validation
    switch (documentType) {
      case 'PASSPORT':
        if (!extractedData.passportNumber) {
          qualityScore *= 0.7;
          issues.push('Passport number not found');
        }
        break;
      case 'AADHAAR':
        if (!extractedData.aadhaarNumber || extractedData.aadhaarNumber.length !== 12) {
          qualityScore *= 0.7;
          issues.push('Valid Aadhaar number not found');
        }
        break;
      case 'PAN':
        if (!extractedData.panNumber || extractedData.panNumber.length !== 10) {
          qualityScore *= 0.7;
          issues.push('Valid PAN number not found');
        }
        break;
    }
    
    return {
      qualityScore: Math.round(qualityScore),
      issues,
      isValid: qualityScore >= 50 // Consider valid if quality score >= 50%
    };
  }
}

module.exports = OCREngine;