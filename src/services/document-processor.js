// Document Processor Service - High-level interface for document processing

const OCREngine = require('./ocr-engine');
const { IdentityDocument } = require('../shared/interfaces');
const { DocumentType, VerificationStatus } = require('../shared/types');

class DocumentProcessor {
  constructor() {
    this.ocrEngine = new OCREngine();
    this.processingQueue = [];
    this.maxConcurrentProcessing = 3;
  }

  async initialize() {
    await this.ocrEngine.initialize();
  }

  async cleanup() {
    await this.ocrEngine.cleanup();
  }

  /**
   * Process a document and extract structured data
   * @param {string|Buffer} documentInput - File path or buffer
   * @param {string} documentType - Type of document (from DocumentType enum)
   * @param {Object} metadata - Additional metadata about the document
   * @returns {Promise<Object>} Processing result with extracted data
   */
  async processDocument(documentInput, documentType, metadata = {}) {
    try {
      // Validate document type
      if (!Object.values(DocumentType).includes(documentType)) {
        throw new Error(`Invalid document type: ${documentType}`);
      }

      // Extract text and data using OCR
      const extractionResult = await this.ocrEngine.extractText(documentInput, documentType);
      
      // Validate extraction quality
      const validation = this.ocrEngine.validateExtraction(extractionResult);
      
      // Create processing result
      const result = {
        documentType,
        extractionResult,
        validation,
        metadata: {
          ...metadata,
          processedAt: new Date(),
          processingTime: Date.now() - (metadata.startTime || Date.now())
        },
        success: validation.isValid
      };

      // Log processing result
      this.logProcessingResult(result);

      return result;
    } catch (error) {
      const errorResult = {
        documentType,
        extractionResult: null,
        validation: { qualityScore: 0, issues: [error.message], isValid: false },
        metadata: {
          ...metadata,
          processedAt: new Date(),
          error: error.message
        },
        success: false
      };

      this.logProcessingResult(errorResult);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Process multiple documents concurrently
   * @param {Array} documents - Array of document objects with input, type, and metadata
   * @returns {Promise<Array>} Array of processing results
   */
  async processDocuments(documents) {
    const results = [];
    const batches = this.createBatches(documents, this.maxConcurrentProcessing);

    for (const batch of batches) {
      const batchPromises = batch.map(doc => 
        this.processDocument(doc.input, doc.type, doc.metadata)
          .catch(error => ({
            documentType: doc.type,
            success: false,
            error: error.message,
            metadata: doc.metadata
          }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Extract customer data from identity documents
   * @param {string|Buffer} documentInput - Document input
   * @param {string} documentType - Type of identity document
   * @returns {Promise<Object>} Extracted customer information
   */
  async extractCustomerData(documentInput, documentType) {
    const result = await this.processDocument(documentInput, documentType);
    
    if (!result.success) {
      throw new Error(`Failed to extract customer data: ${result.validation.issues.join(', ')}`);
    }

    const extractedData = result.extractionResult.extractedData;
    
    // Map extracted data to customer information structure
    const customerData = {
      personalInfo: this.mapToPersonalInfo(extractedData, documentType),
      identityDocument: this.createIdentityDocument(extractedData, documentType, result),
      extractionMetadata: {
        confidence: result.extractionResult.confidence,
        qualityScore: result.validation.qualityScore,
        processedAt: result.metadata.processedAt
      }
    };

    return customerData;
  }

  /**
   * Map extracted data to personal information structure
   * @param {Object} extractedData - Data extracted from document
   * @param {string} documentType - Type of document
   * @returns {Object} Personal information object
   */
  mapToPersonalInfo(extractedData, documentType) {
    const personalInfo = {};

    // Extract name (handle different name formats)
    if (extractedData.name) {
      const nameParts = extractedData.name.trim().split(/\s+/);
      personalInfo.firstName = nameParts[0] || '';
      personalInfo.lastName = nameParts.slice(1).join(' ') || '';
    }

    // Extract date of birth
    if (extractedData.dateOfBirth) {
      personalInfo.dateOfBirth = this.parseDate(extractedData.dateOfBirth);
    }

    // Extract nationality (for passport)
    if (extractedData.nationality) {
      personalInfo.nationality = this.mapNationality(extractedData.nationality);
    }

    // Extract address (for driver's license)
    if (extractedData.address) {
      personalInfo.address = this.parseAddress(extractedData.address);
    }

    return personalInfo;
  }

  /**
   * Create identity document object from extracted data
   * @param {Object} extractedData - Extracted document data
   * @param {string} documentType - Type of document
   * @param {Object} processingResult - Full processing result
   * @returns {IdentityDocument} Identity document object
   */
  createIdentityDocument(extractedData, documentType, processingResult) {
    let documentNumber = '';
    let issuingAuthority = '';
    let expiryDate = null;

    // Extract document-specific information
    switch (documentType) {
      case DocumentType.PASSPORT:
        documentNumber = extractedData.passportNumber || '';
        issuingAuthority = 'Passport Office';
        if (extractedData.expiryDate) {
          expiryDate = this.parseDate(extractedData.expiryDate);
        }
        break;
      case DocumentType.DRIVERS_LICENSE:
        documentNumber = extractedData.licenseNumber || '';
        issuingAuthority = 'Department of Motor Vehicles';
        break;
      case DocumentType.AADHAAR:
        documentNumber = extractedData.aadhaarNumber || '';
        issuingAuthority = 'Unique Identification Authority of India';
        break;
      case DocumentType.PAN:
        documentNumber = extractedData.panNumber || '';
        issuingAuthority = 'Income Tax Department';
        break;
      default:
        documentNumber = extractedData.identificationNumbers?.[0] || '';
        issuingAuthority = 'Unknown';
    }

    const identityDoc = new IdentityDocument(
      documentType,
      documentNumber,
      issuingAuthority,
      expiryDate || new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // Default 10 years
    );

    // Set verification status based on processing quality
    if (processingResult.validation.qualityScore >= 80) {
      identityDoc.verificationStatus = VerificationStatus.VERIFIED;
    } else if (processingResult.validation.qualityScore >= 50) {
      identityDoc.verificationStatus = VerificationStatus.PENDING;
    } else {
      identityDoc.verificationStatus = VerificationStatus.FAILED;
    }

    // Store extracted data
    identityDoc.extractedData = new Map(Object.entries(extractedData));

    return identityDoc;
  }

  /**
   * Parse date string to Date object
   * @param {string} dateString - Date in various formats
   * @returns {Date} Parsed date
   */
  parseDate(dateString) {
    // Handle different date formats: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, etc.
    const cleanDate = dateString.replace(/[^\d\/\-]/g, '');
    const parts = cleanDate.split(/[\/\-]/);
    
    if (parts.length === 3) {
      // Assume DD/MM/YYYY format for most documents
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
      const year = parseInt(parts[2]);
      
      return new Date(year, month, day);
    }
    
    // Fallback to JavaScript's date parsing
    return new Date(dateString);
  }

  /**
   * Map nationality string to country code
   * @param {string} nationality - Nationality string
   * @returns {string} Country code
   */
  mapNationality(nationality) {
    const nationalityMap = {
      'INDIAN': 'IN',
      'AMERICAN': 'US',
      'BRITISH': 'GB',
      'CANADIAN': 'CA',
      'AUSTRALIAN': 'AU'
    };
    
    return nationalityMap[nationality.toUpperCase()] || nationality.substring(0, 2).toUpperCase();
  }

  /**
   * Parse address string into structured format
   * @param {string} addressString - Raw address string
   * @returns {Object} Structured address
   */
  parseAddress(addressString) {
    // Simple address parsing - in production, use more sophisticated parsing
    const parts = addressString.split(',').map(part => part.trim());
    
    return {
      street: parts[0] || '',
      city: parts[parts.length - 2] || '',
      state: parts[parts.length - 1] || '',
      country: 'Unknown' // Would need more sophisticated parsing
    };
  }

  /**
   * Create batches for concurrent processing
   * @param {Array} items - Items to batch
   * @param {number} batchSize - Size of each batch
   * @returns {Array} Array of batches
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Log processing result for monitoring and debugging
   * @param {Object} result - Processing result
   */
  logProcessingResult(result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      documentType: result.documentType,
      success: result.success,
      qualityScore: result.validation?.qualityScore || 0,
      processingTime: result.metadata?.processingTime || 0,
      issues: result.validation?.issues || []
    };

    // In production, this would go to a proper logging system
    console.log('Document Processing Result:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Get processing statistics
   * @returns {Object} Processing statistics
   */
  getProcessingStats() {
    return {
      ocrEngineInitialized: this.ocrEngine.initialized,
      maxConcurrentProcessing: this.maxConcurrentProcessing,
      queueLength: this.processingQueue.length,
      supportedFormats: this.ocrEngine.supportedFormats
    };
  }
}

module.exports = DocumentProcessor;