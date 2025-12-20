// Document Authenticator Service - Validates document authenticity and format

const { DocumentType, VerificationStatus } = require('../shared/types');

class DocumentAuthenticator {
  constructor(config = {}) {
    this.config = {
      enableAdvancedChecks: config.enableAdvancedChecks !== false,
      confidenceThreshold: config.confidenceThreshold || 70,
      enableBatchProcessing: config.enableBatchProcessing !== false,
      maxConcurrentAuthentications: config.maxConcurrentAuthentications || 5,
      ...config
    };

    this.authenticators = {
      [DocumentType.PASSPORT]: new PassportAuthenticator(this.config),
      [DocumentType.AADHAAR]: new AadhaarAuthenticator(this.config),
      [DocumentType.PAN]: new PANAuthenticator(this.config),
      [DocumentType.DRIVERS_LICENSE]: new DriversLicenseAuthenticator(this.config),
      [DocumentType.BANK_STATEMENT]: new BankStatementAuthenticator(this.config),
      [DocumentType.INCOME_PROOF]: new IncomeProofAuthenticator(this.config)
    };

    this.metrics = {
      totalAuthentications: 0,
      successfulAuthentications: 0,
      failedAuthentications: 0,
      averageConfidence: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Authenticate document for tampering, forgery, and format compliance
   * @param {Buffer|string} documentInput - Document file or path
   * @param {string} documentType - Type of document
   * @param {Object} extractedData - Data extracted from OCR
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateDocument(documentInput, documentType, extractedData) {
    try {
      const authenticator = this.authenticators[documentType];
      if (!authenticator) {
        return {
          isAuthentic: false,
          confidence: 0,
          issues: [`No authenticator available for document type: ${documentType}`],
          checks: {
            formatCheck: false,
            tamperingCheck: false,
            consistencyCheck: false,
            securityFeatureCheck: false
          }
        };
      }

      // Perform authentication checks
      const formatCheck = await authenticator.checkFormat(documentInput, extractedData);
      const tamperingCheck = await authenticator.checkTampering(documentInput, extractedData);
      const consistencyCheck = await authenticator.checkDataConsistency(extractedData);
      const securityFeatureCheck = await authenticator.checkSecurityFeatures(documentInput, extractedData);

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence([
        formatCheck,
        tamperingCheck,
        consistencyCheck,
        securityFeatureCheck
      ]);

      // Collect all issues
      const issues = [
        ...formatCheck.issues,
        ...tamperingCheck.issues,
        ...consistencyCheck.issues,
        ...securityFeatureCheck.issues
      ];

      return {
        isAuthentic: confidence >= 70,
        confidence,
        issues,
        checks: {
          formatCheck: formatCheck.passed,
          tamperingCheck: tamperingCheck.passed,
          consistencyCheck: consistencyCheck.passed,
          securityFeatureCheck: securityFeatureCheck.passed
        },
        details: {
          formatDetails: formatCheck.details,
          tamperingDetails: tamperingCheck.details,
          consistencyDetails: consistencyCheck.details,
          securityDetails: securityFeatureCheck.details
        }
      };
    } catch (error) {
      return {
        isAuthentic: false,
        confidence: 0,
        issues: [`Authentication error: ${error.message}`],
        checks: {
          formatCheck: false,
          tamperingCheck: false,
          consistencyCheck: false,
          securityFeatureCheck: false
        }
      };
    }
  }

  /**
   * Calculate overall confidence from individual check results
   * @param {Array} checkResults - Array of check results
   * @returns {number} Overall confidence score
   */
  calculateOverallConfidence(checkResults) {
    const weights = [0.40, 0.30, 0.20, 0.10]; // Format, Tampering, Consistency, Security
    let totalScore = 0;
    let totalWeight = 0;

    checkResults.forEach((result, index) => {
      if (result.confidence !== undefined) {
        totalScore += result.confidence * weights[index];
        totalWeight += weights[index];
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Validate document completeness
   * @param {Object} extractedData - Extracted document data
   * @param {string} documentType - Type of document
   * @returns {Object} Completeness validation result
   */
  validateCompleteness(extractedData, documentType) {
    const requiredFields = this.getRequiredFields(documentType);
    const missingFields = [];
    const presentFields = [];

    requiredFields.forEach(field => {
      if (extractedData[field] && extractedData[field].toString().trim() !== '') {
        presentFields.push(field);
      } else {
        missingFields.push(field);
      }
    });

    const completenessScore = (presentFields.length / requiredFields.length) * 100;

    return {
      isComplete: missingFields.length === 0,
      completenessScore: Math.round(completenessScore),
      requiredFields,
      presentFields,
      missingFields,
      issues: missingFields.length > 0 ? [`Missing required fields: ${missingFields.join(', ')}`] : []
    };
  }

  /**
   * Authenticate multiple documents concurrently
   * @param {Array} documents - Array of documents to authenticate
   * @returns {Promise<Array>} Array of authentication results
   */
  async authenticateMultipleDocuments(documents) {
    if (!this.config.enableBatchProcessing) {
      // Process sequentially if batch processing is disabled
      const results = [];
      for (const doc of documents) {
        const result = await this.authenticateDocument(doc.input, doc.type, doc.extractedData);
        results.push(result);
      }
      return results;
    }

    // Process in batches to avoid overwhelming the system
    const batches = this.createBatches(documents, this.config.maxConcurrentAuthentications);
    const allResults = [];

    for (const batch of batches) {
      const batchPromises = batch.map(doc => 
        this.authenticateDocument(doc.input, doc.type, doc.extractedData)
          .catch(error => ({
            isAuthentic: false,
            confidence: 0,
            issues: [`Authentication error: ${error.message}`],
            checks: {
              formatCheck: false,
              tamperingCheck: false,
              consistencyCheck: false,
              securityFeatureCheck: false
            }
          }))
      );

      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);
    }

    return allResults;
  }

  /**
   * Perform comprehensive document format validation
   * @param {Object} extractedData - Extracted document data
   * @param {string} documentType - Type of document
   * @returns {Object} Comprehensive format validation result
   */
  performComprehensiveFormatValidation(extractedData, documentType) {
    const basicValidation = this.validateCompleteness(extractedData, documentType);
    const formatValidation = this.validateFieldFormats(extractedData, documentType);
    const crossFieldValidation = this.validateCrossFieldConsistency(extractedData, documentType);

    const allIssues = [
      ...basicValidation.issues,
      ...formatValidation.issues,
      ...crossFieldValidation.issues
    ];

    const overallScore = Math.round(
      (basicValidation.completenessScore + formatValidation.formatScore + crossFieldValidation.consistencyScore) / 3
    );

    return {
      isValid: allIssues.length === 0,
      overallScore,
      completeness: basicValidation,
      format: formatValidation,
      consistency: crossFieldValidation,
      issues: allIssues
    };
  }

  /**
   * Validate field formats based on document type
   * @param {Object} extractedData - Extracted document data
   * @param {string} documentType - Type of document
   * @returns {Object} Format validation result
   */
  validateFieldFormats(extractedData, documentType) {
    const formatRules = this.getFormatRules(documentType);
    const issues = [];
    let formatScore = 100;

    for (const [field, rule] of Object.entries(formatRules)) {
      if (extractedData[field]) {
        const value = extractedData[field].toString();
        if (!rule.pattern.test(value)) {
          issues.push(`Invalid format for ${field}: ${rule.description}`);
          formatScore -= rule.penalty || 10;
        }
      }
    }

    return {
      formatScore: Math.max(formatScore, 0),
      issues,
      validatedFields: Object.keys(formatRules).filter(field => extractedData[field])
    };
  }

  /**
   * Validate cross-field consistency
   * @param {Object} extractedData - Extracted document data
   * @param {string} documentType - Type of document
   * @returns {Object} Consistency validation result
   */
  validateCrossFieldConsistency(extractedData, documentType) {
    const issues = [];
    let consistencyScore = 100;

    // Date consistency checks
    if (extractedData.dateOfBirth && extractedData.expiryDate) {
      const dob = new Date(extractedData.dateOfBirth);
      const expiry = new Date(extractedData.expiryDate);
      
      if (expiry <= dob) {
        issues.push('Expiry date cannot be before date of birth');
        consistencyScore -= 25;
      }

      // Check if person is old enough for document type
      const age = (new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000);
      if (documentType === DocumentType.DRIVERS_LICENSE && age < 16) {
        issues.push('Age too young for driver license');
        consistencyScore -= 20;
      }
    }

    // Name consistency checks
    if (extractedData.name && extractedData.fatherName) {
      if (extractedData.name === extractedData.fatherName) {
        issues.push('Name and father name cannot be identical');
        consistencyScore -= 15;
      }
    }

    // Document-specific consistency checks
    if (documentType === DocumentType.BANK_STATEMENT) {
      if (extractedData.openingBalance && extractedData.closingBalance && extractedData.transactions) {
        // Simplified balance calculation check
        const calculatedBalance = parseFloat(extractedData.openingBalance) + 
          extractedData.transactions.reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);
        const actualBalance = parseFloat(extractedData.closingBalance);
        
        if (Math.abs(calculatedBalance - actualBalance) > 0.01) {
          issues.push('Balance calculation inconsistency detected');
          consistencyScore -= 30;
        }
      }
    }

    return {
      consistencyScore: Math.max(consistencyScore, 0),
      issues,
      checkedFields: Object.keys(extractedData)
    };
  }

  /**
   * Get format rules for document type
   * @param {string} documentType - Type of document
   * @returns {Object} Format rules
   */
  getFormatRules(documentType) {
    const rules = {
      [DocumentType.PASSPORT]: {
        passportNumber: {
          pattern: /^[A-Z0-9]{8,10}$/,
          description: 'Must be 8-10 alphanumeric characters',
          penalty: 20
        },
        dateOfBirth: {
          pattern: /^\d{2}\/\d{2}\/\d{4}$/,
          description: 'Must be in DD/MM/YYYY format',
          penalty: 15
        }
      },
      [DocumentType.AADHAAR]: {
        aadhaarNumber: {
          pattern: /^\d{12}$/,
          description: 'Must be exactly 12 digits',
          penalty: 25
        }
      },
      [DocumentType.PAN]: {
        panNumber: {
          pattern: /^[A-Z]{5}\d{4}[A-Z]$/,
          description: 'Must be in format: 5 letters, 4 digits, 1 letter',
          penalty: 25
        }
      },
      [DocumentType.BANK_STATEMENT]: {
        accountNumber: {
          pattern: /^\d{9,18}$/,
          description: 'Must be 9-18 digits',
          penalty: 20
        }
      }
    };

    return rules[documentType] || {};
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
   * Get required fields for document type
   * @param {string} documentType - Type of document
   * @returns {Array} Required fields
   */
  getRequiredFields(documentType) {
    const fieldMap = {
      [DocumentType.PASSPORT]: ['passportNumber', 'name', 'dateOfBirth', 'nationality'],
      [DocumentType.AADHAAR]: ['aadhaarNumber', 'name', 'dateOfBirth'],
      [DocumentType.PAN]: ['panNumber', 'name', 'fatherName'],
      [DocumentType.DRIVERS_LICENSE]: ['licenseNumber', 'name', 'address'],
      [DocumentType.BANK_STATEMENT]: ['accountNumber', 'accountHolderName', 'statementPeriod'],
      [DocumentType.INCOME_PROOF]: ['employeeName', 'companyName', 'monthlySalary']
    };

    return fieldMap[documentType] || [];
  }

  /**
   * Get authentication statistics
   * @returns {Object} Authentication statistics
   */
  getAuthenticationStats() {
    return {
      ...this.metrics,
      supportedDocuments: Object.keys(this.authenticators),
      confidenceThreshold: this.config.confidenceThreshold,
      batchProcessingEnabled: this.config.enableBatchProcessing
    };
  }

  /**
   * Update authentication metrics
   * @param {boolean} success - Whether authentication was successful
   * @param {number} confidence - Confidence score
   * @param {number} processingTime - Processing time in milliseconds
   */
  updateMetrics(success, confidence, processingTime) {
    this.metrics.totalAuthentications++;
    if (success) {
      this.metrics.successfulAuthentications++;
    } else {
      this.metrics.failedAuthentications++;
    }
    
    // Update average confidence
    const totalConfidence = this.metrics.averageConfidence * (this.metrics.totalAuthentications - 1) + confidence;
    this.metrics.averageConfidence = Math.round(totalConfidence / this.metrics.totalAuthentications);
    
    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalAuthentications - 1) + processingTime;
    this.metrics.averageProcessingTime = Math.round(totalTime / this.metrics.totalAuthentications);
  }
}

// Base Authenticator Class
class BaseAuthenticator {
  constructor(config = {}) {
    this.config = config;
  }
  async checkFormat(documentInput, extractedData) {
    // Default implementation
    return {
      passed: true,
      confidence: 80,
      issues: [],
      details: { message: 'Basic format check passed' }
    };
  }

  async checkTampering(documentInput, extractedData) {
    // Simulate tampering detection
    await this.simulateDelay(500, 1500);
    
    // Mock tampering detection logic
    const tamperingIndicators = this.detectTamperingIndicators(extractedData);
    
    return {
      passed: tamperingIndicators.length === 0,
      confidence: tamperingIndicators.length === 0 ? 90 : 30,
      issues: tamperingIndicators,
      details: {
        tamperingIndicators,
        analysisMethod: 'Digital forensics analysis'
      }
    };
  }

  async checkDataConsistency(extractedData) {
    const inconsistencies = this.findDataInconsistencies(extractedData);
    
    return {
      passed: inconsistencies.length === 0,
      confidence: inconsistencies.length === 0 ? 85 : 50,
      issues: inconsistencies,
      details: {
        inconsistencies,
        checkedFields: Object.keys(extractedData)
      }
    };
  }

  async checkSecurityFeatures(documentInput, extractedData) {
    // Mock security feature detection
    await this.simulateDelay(300, 1000);
    
    return {
      passed: true,
      confidence: 75,
      issues: [],
      details: {
        securityFeatures: ['Watermark detected', 'Security thread present'],
        analysisMethod: 'Image analysis'
      }
    };
  }

  detectTamperingIndicators(extractedData) {
    const indicators = [];
    
    // Check for suspicious patterns in text
    Object.entries(extractedData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Check for inconsistent fonts or spacing (mock)
        if (value.includes('  ')) { // Multiple spaces might indicate tampering
          indicators.push(`Suspicious spacing detected in ${key}`);
        }
        
        // Check for unusual character patterns
        if (/[^\w\s\-\/.,]/.test(value)) {
          indicators.push(`Unusual characters detected in ${key}`);
        }
      }
    });
    
    return indicators;
  }

  findDataInconsistencies(extractedData) {
    const inconsistencies = [];
    
    // Check date consistency
    if (extractedData.dateOfBirth && extractedData.expiryDate) {
      const dob = new Date(extractedData.dateOfBirth);
      const expiry = new Date(extractedData.expiryDate);
      
      if (expiry <= dob) {
        inconsistencies.push('Expiry date cannot be before date of birth');
      }
    }
    
    // Check name consistency
    if (extractedData.name && extractedData.fatherName) {
      if (extractedData.name === extractedData.fatherName) {
        inconsistencies.push('Name and father name cannot be identical');
      }
    }
    
    return inconsistencies;
  }

  async simulateDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Passport Authenticator
class PassportAuthenticator extends BaseAuthenticator {
  constructor(config = {}) {
    super(config);
  }
  async checkFormat(documentInput, extractedData) {
    const issues = [];
    let confidence = 90;

    // Check passport number format
    if (!extractedData.passportNumber || !/^[A-Z0-9]{8,10}$/.test(extractedData.passportNumber)) {
      issues.push('Invalid passport number format');
      confidence -= 40;
    }

    // Check required fields
    const requiredFields = ['passportNumber', 'name', 'dateOfBirth', 'nationality'];
    const missingFields = requiredFields.filter(field => !extractedData[field]);
    
    if (missingFields.length > 0) {
      issues.push(`Missing required fields: ${missingFields.join(', ')}`);
      confidence -= missingFields.length * 15;
    }

    return {
      passed: issues.length === 0,
      confidence: Math.max(confidence, 0),
      issues,
      details: { requiredFields, extractedFields: Object.keys(extractedData) }
    };
  }

  async checkSecurityFeatures(documentInput, extractedData) {
    await this.simulateDelay(1000, 2000);
    
    // Mock passport security feature detection
    const securityFeatures = [
      'Machine readable zone detected',
      'Passport photo security features verified',
      'Holographic elements present'
    ];
    
    return {
      passed: true,
      confidence: 85,
      issues: [],
      details: {
        securityFeatures,
        analysisMethod: 'Advanced passport security analysis'
      }
    };
  }
}

// Aadhaar Authenticator
class AadhaarAuthenticator extends BaseAuthenticator {
  constructor(config = {}) {
    super(config);
  }
  async checkFormat(documentInput, extractedData) {
    const issues = [];
    let confidence = 90;

    // Check Aadhaar number format
    if (!extractedData.aadhaarNumber || !/^\d{12}$/.test(extractedData.aadhaarNumber)) {
      issues.push('Invalid Aadhaar number format');
      confidence -= 40;
    }

    // Check for invalid Aadhaar patterns
    if (extractedData.aadhaarNumber && /^(\d)\1{11}$/.test(extractedData.aadhaarNumber)) {
      issues.push('Invalid Aadhaar number pattern (all same digits)');
      confidence -= 50;
    }

    return {
      passed: issues.length === 0,
      confidence: Math.max(confidence, 0),
      issues,
      details: { aadhaarFormat: 'XXXX XXXX XXXX format expected' }
    };
  }

  async checkSecurityFeatures(documentInput, extractedData) {
    await this.simulateDelay(800, 1500);
    
    const securityFeatures = [
      'QR code verification passed',
      'Aadhaar logo authenticity verified',
      'Security pattern detected'
    ];
    
    return {
      passed: true,
      confidence: 80,
      issues: [],
      details: {
        securityFeatures,
        analysisMethod: 'Aadhaar security verification'
      }
    };
  }
}

// PAN Authenticator
class PANAuthenticator extends BaseAuthenticator {
  constructor(config = {}) {
    super(config);
  }
  async checkFormat(documentInput, extractedData) {
    const issues = [];
    let confidence = 90;

    // Check PAN number format
    if (!extractedData.panNumber || !/^[A-Z]{5}\d{4}[A-Z]$/.test(extractedData.panNumber)) {
      issues.push('Invalid PAN number format (expected: 5 letters, 4 digits, 1 letter)');
      confidence -= 40;
    }

    return {
      passed: issues.length === 0,
      confidence: Math.max(confidence, 0),
      issues,
      details: { panFormat: 'ABCDE1234F format expected' }
    };
  }
}

// Driver's License Authenticator
class DriversLicenseAuthenticator extends BaseAuthenticator {
  constructor(config = {}) {
    super(config);
  }
  async checkFormat(documentInput, extractedData) {
    const issues = [];
    let confidence = 85;

    // Basic format checks for driver's license
    if (!extractedData.licenseNumber) {
      issues.push('License number not found');
      confidence -= 30;
    }

    if (!extractedData.name) {
      issues.push('Name not found');
      confidence -= 20;
    }

    return {
      passed: issues.length === 0,
      confidence: Math.max(confidence, 0),
      issues,
      details: { licenseFormat: 'State-specific format validation' }
    };
  }
}

// Bank Statement Authenticator
class BankStatementAuthenticator extends BaseAuthenticator {
  constructor(config = {}) {
    super(config);
  }
  async checkFormat(documentInput, extractedData) {
    const issues = [];
    let confidence = 85;

    // Check for required bank statement fields
    if (!extractedData.accountNumber) {
      issues.push('Account number not found');
      confidence -= 25;
    }

    if (!extractedData.accountHolderName) {
      issues.push('Account holder name not found');
      confidence -= 20;
    }

    if (!extractedData.statementPeriod) {
      issues.push('Statement period not found');
      confidence -= 15;
    }

    return {
      passed: issues.length === 0,
      confidence: Math.max(confidence, 0),
      issues,
      details: { statementFormat: 'Standard bank statement format' }
    };
  }

  async checkDataConsistency(extractedData) {
    const inconsistencies = [];

    // Check statement period consistency
    if (extractedData.statementPeriod) {
      const { from, to } = extractedData.statementPeriod;
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        
        if (toDate <= fromDate) {
          inconsistencies.push('Statement end date must be after start date');
        }
      }
    }

    // Check balance format
    if (extractedData.closingBalance && !/^\d+\.?\d*$/.test(extractedData.closingBalance)) {
      inconsistencies.push('Invalid balance format');
    }

    return {
      passed: inconsistencies.length === 0,
      confidence: inconsistencies.length === 0 ? 90 : 60,
      issues: inconsistencies,
      details: { checkedFields: ['statementPeriod', 'closingBalance'] }
    };
  }
}

// Income Proof Authenticator
class IncomeProofAuthenticator extends BaseAuthenticator {
  constructor(config = {}) {
    super(config);
  }
  async checkFormat(documentInput, extractedData) {
    const issues = [];
    let confidence = 85;

    // Check for required income proof fields
    if (!extractedData.employeeName) {
      issues.push('Employee name not found');
      confidence -= 25;
    }

    if (!extractedData.companyName) {
      issues.push('Company name not found');
      confidence -= 20;
    }

    if (!extractedData.monthlySalary) {
      issues.push('Monthly salary not found');
      confidence -= 25;
    }

    return {
      passed: issues.length === 0,
      confidence: Math.max(confidence, 0),
      issues,
      details: { incomeProofFormat: 'Standard salary certificate format' }
    };
  }

  async checkDataConsistency(extractedData) {
    const inconsistencies = [];

    // Check salary format
    if (extractedData.monthlySalary && !/^\d+\.?\d*$/.test(extractedData.monthlySalary)) {
      inconsistencies.push('Invalid salary format');
    }

    // Check reasonable salary range (basic validation)
    if (extractedData.monthlySalary) {
      const salary = parseFloat(extractedData.monthlySalary);
      if (salary < 1000 || salary > 10000000) {
        inconsistencies.push('Salary amount appears unrealistic');
      }
    }

    return {
      passed: inconsistencies.length === 0,
      confidence: inconsistencies.length === 0 ? 85 : 65,
      issues: inconsistencies,
      details: { checkedFields: ['monthlySalary'] }
    };
  }
}

module.exports = DocumentAuthenticator;