// Account Opening Module
// Automated customer onboarding and account creation workflow

const { DocumentProcessor, IdentityValidator, DocumentAuthenticator } = require('../../services');
const { NotificationService } = require('../../services/notification-service');
const { Customer, Account, AuditLog } = require('../../shared/interfaces');
const { AccountType, AccountStatus, VerificationStatus, KYCStatus } = require('../../shared/types');
const { v4: uuidv4 } = require('uuid');

/**
 * Account Opening Module - Orchestrates the complete account opening workflow
 */
class AccountOpeningModule {
  constructor(config = {}) {
    this.config = {
      enableAutoApproval: config.enableAutoApproval !== false,
      eligibilityThreshold: config.eligibilityThreshold || 70,
      documentVerificationRequired: config.documentVerificationRequired !== false,
      maxProcessingTime: config.maxProcessingTime || 300000, // 5 minutes
      ...config
    };

    // Initialize services
    this.documentProcessor = new DocumentProcessor();
    this.identityValidator = new IdentityValidator();
    this.documentAuthenticator = new DocumentAuthenticator();
    this.eligibilityChecker = new EligibilityChecker(this.config);
    this.accountCreator = new AccountCreator(this.config);
    this.notificationService = new NotificationService(this.config);

    // Workflow state tracking
    this.activeWorkflows = new Map();
    this.metrics = {
      totalApplications: 0,
      successfulApplications: 0,
      rejectedApplications: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Initialize the account opening module
   */
  async initialize() {
    await this.documentProcessor.initialize();
    console.log('Account Opening Module initialized successfully');
  }

  /**
   * Process account opening application
   * @param {Object} applicationData - Account opening application data
   * @returns {Promise<Object>} Processing result
   */
  async processAccountOpening(applicationData) {
    const workflowId = uuidv4();
    const startTime = Date.now();

    try {
      // Initialize workflow tracking
      const workflow = {
        workflowId,
        applicationData,
        startTime,
        currentStep: 'INITIATED',
        steps: [],
        customer: null,
        account: null,
        status: 'IN_PROGRESS'
      };

      this.activeWorkflows.set(workflowId, workflow);
      this.metrics.totalApplications++;

      // Step 1: Extract customer data from documents
      const extractionResult = await this.extractCustomerData(workflow);
      if (!extractionResult.success) {
        return this.completeWorkflow(workflow, 'REJECTED', extractionResult.error);
      }

      // Step 2: Verify document authenticity
      const verificationResult = await this.verifyDocumentAuthenticity(workflow);
      if (!verificationResult.success) {
        return this.completeWorkflow(workflow, 'REJECTED', verificationResult.error);
      }

      // Step 3: Perform eligibility checks
      const eligibilityResult = await this.performEligibilityChecks(workflow);
      if (!eligibilityResult.success) {
        return this.completeWorkflow(workflow, 'REJECTED', eligibilityResult.error);
      }

      // Step 4: Create and activate account
      const accountCreationResult = await this.createAndActivateAccount(workflow);
      if (!accountCreationResult.success) {
        return this.completeWorkflow(workflow, 'FAILED', accountCreationResult.error);
      }

      // Step 5: Send account activation notification
      const notificationResult = await this.sendAccountActivationNotification(workflow);
      // Note: Notification failure doesn't fail the entire workflow, just log it
      if (!notificationResult.success) {
        console.warn(`Notification failed for workflow ${workflow.workflowId}: ${notificationResult.error}`);
      }

      // Complete workflow successfully
      return this.completeWorkflow(workflow, 'APPROVED', null, accountCreationResult.account);

    } catch (error) {
      const workflow = this.activeWorkflows.get(workflowId);
      return this.completeWorkflow(workflow, 'FAILED', error.message);
    }
  }

  /**
   * Step 1: Extract customer data from submitted documents
   * @param {Object} workflow - Workflow context
   * @returns {Promise<Object>} Extraction result
   */
  async extractCustomerData(workflow) {
    workflow.currentStep = 'DOCUMENT_EXTRACTION';
    
    try {
      const { documents } = workflow.applicationData;
      if (!documents || documents.length === 0) {
        throw new Error('No documents provided for account opening');
      }

      const extractedCustomerData = [];
      
      for (const document of documents) {
        const result = await this.documentProcessor.extractCustomerData(
          document.file,
          document.type
        );
        extractedCustomerData.push(result);
      }

      // Create customer object from extracted data
      const primaryDocument = extractedCustomerData[0];
      workflow.customer = new Customer(primaryDocument.personalInfo);
      
      // Add identity documents
      extractedCustomerData.forEach(data => {
        workflow.customer.addIdentityDocument(data.identityDocument);
      });

      workflow.steps.push({
        step: 'DOCUMENT_EXTRACTION',
        status: 'COMPLETED',
        timestamp: new Date(),
        data: { extractedDocuments: extractedCustomerData.length }
      });

      return { success: true, customer: workflow.customer };

    } catch (error) {
      workflow.steps.push({
        step: 'DOCUMENT_EXTRACTION',
        status: 'FAILED',
        timestamp: new Date(),
        error: error.message
      });

      return { success: false, error: `Document extraction failed: ${error.message}` };
    }
  }

  /**
   * Step 2: Verify document authenticity against official databases
   * @param {Object} workflow - Workflow context
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocumentAuthenticity(workflow) {
    workflow.currentStep = 'DOCUMENT_VERIFICATION';

    try {
      if (!this.config.documentVerificationRequired) {
        workflow.steps.push({
          step: 'DOCUMENT_VERIFICATION',
          status: 'SKIPPED',
          timestamp: new Date(),
          reason: 'Document verification disabled in configuration'
        });
        return { success: true };
      }

      const verificationResults = [];
      
      for (const identityDoc of workflow.customer.identityDocuments) {
        // Authenticate document
        const authResult = await this.documentAuthenticator.authenticateDocument(
          null, // No file needed for this test
          identityDoc.documentType,
          identityDoc.extractedData
        );

        // Validate identity
        const validationResult = await this.identityValidator.validateIdentity(
          identityDoc,
          identityDoc.extractedData
        );

        verificationResults.push({
          documentType: identityDoc.documentType,
          authentication: authResult,
          validation: validationResult
        });

        // Update document verification status
        if (authResult.isAuthentic && validationResult.isValid) {
          identityDoc.verificationStatus = VerificationStatus.VERIFIED;
        } else {
          identityDoc.verificationStatus = VerificationStatus.FAILED;
        }
      }

      // Check if all documents are verified
      const allVerified = workflow.customer.identityDocuments.every(
        doc => doc.verificationStatus === VerificationStatus.VERIFIED
      );

      if (!allVerified) {
        throw new Error('One or more documents failed verification');
      }

      workflow.steps.push({
        step: 'DOCUMENT_VERIFICATION',
        status: 'COMPLETED',
        timestamp: new Date(),
        data: { verifiedDocuments: verificationResults.length }
      });

      return { success: true, verificationResults };

    } catch (error) {
      workflow.steps.push({
        step: 'DOCUMENT_VERIFICATION',
        status: 'FAILED',
        timestamp: new Date(),
        error: error.message
      });

      return { success: false, error: `Document verification failed: ${error.message}` };
    }
  }

  /**
   * Step 3: Perform real-time eligibility checks
   * @param {Object} workflow - Workflow context
   * @returns {Promise<Object>} Eligibility result
   */
  async performEligibilityChecks(workflow) {
    workflow.currentStep = 'ELIGIBILITY_CHECK';

    try {
      const eligibilityResult = await this.eligibilityChecker.checkEligibility(
        workflow.customer,
        workflow.applicationData
      );

      if (eligibilityResult.score < this.config.eligibilityThreshold) {
        throw new Error(`Eligibility score ${eligibilityResult.score} below threshold ${this.config.eligibilityThreshold}`);
      }

      workflow.steps.push({
        step: 'ELIGIBILITY_CHECK',
        status: 'COMPLETED',
        timestamp: new Date(),
        data: { 
          eligibilityScore: eligibilityResult.score,
          passedRules: eligibilityResult.passedRules,
          failedRules: eligibilityResult.failedRules
        }
      });

      return { success: true, eligibilityResult };

    } catch (error) {
      workflow.steps.push({
        step: 'ELIGIBILITY_CHECK',
        status: 'FAILED',
        timestamp: new Date(),
        error: error.message
      });

      return { success: false, error: `Eligibility check failed: ${error.message}` };
    }
  }

  /**
   * Step 4: Create and activate account
   * @param {Object} workflow - Workflow context
   * @returns {Promise<Object>} Account creation result
   */
  async createAndActivateAccount(workflow) {
    workflow.currentStep = 'ACCOUNT_CREATION';

    try {
      const account = await this.accountCreator.createAccount(
        workflow.customer,
        workflow.applicationData
      );

      // Update customer with account
      workflow.customer.accounts.push(account);
      workflow.customer.kycStatus = KYCStatus.COMPLETED;
      workflow.account = account;

      workflow.steps.push({
        step: 'ACCOUNT_CREATION',
        status: 'COMPLETED',
        timestamp: new Date(),
        data: { 
          accountId: account.accountId,
          accountNumber: account.accountNumber,
          accountType: account.accountType
        }
      });

      return { success: true, account };

    } catch (error) {
      workflow.steps.push({
        step: 'ACCOUNT_CREATION',
        status: 'FAILED',
        timestamp: new Date(),
        error: error.message
      });

      return { success: false, error: `Account creation failed: ${error.message}` };
    }
  }

  /**
   * Step 5: Send account activation notification
   * @param {Object} workflow - Workflow context
   * @returns {Promise<Object>} Notification result
   */
  async sendAccountActivationNotification(workflow) {
    workflow.currentStep = 'NOTIFICATION';

    try {
      // Determine notification channels based on application data
      const channels = this.determineNotificationChannels(workflow.applicationData);

      // Send notification
      const notificationResult = await this.notificationService.sendAccountActivationNotification(
        workflow.customer,
        workflow.account,
        channels
      );

      // Extract delivered and failed channels from delivery results
      const deliveredChannels = notificationResult.deliveryResults
        ? notificationResult.deliveryResults.filter(r => r.success).map(r => r.channel)
        : [];
      
      const failedChannels = notificationResult.deliveryResults
        ? notificationResult.deliveryResults.filter(r => !r.success).map(r => r.channel)
        : [];

      workflow.steps.push({
        step: 'NOTIFICATION',
        status: 'COMPLETED',
        timestamp: new Date(),
        data: {
          notificationId: notificationResult.notificationId,
          deliveredChannels,
          failedChannels,
          deliveryTime: notificationResult.processingTime
        }
      });

      return { success: true, notificationResult };

    } catch (error) {
      workflow.steps.push({
        step: 'NOTIFICATION',
        status: 'FAILED',
        timestamp: new Date(),
        error: error.message
      });

      return { success: false, error: `Notification failed: ${error.message}` };
    }
  }

  /**
   * Send account rejection notification
   * @param {Object} workflow - Workflow context
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise<Object>} Notification result
   */
  async sendAccountRejectionNotification(workflow, rejectionReason) {
    try {
      if (!workflow.customer) {
        return { success: false, error: 'No customer data available for notification' };
      }

      const channels = this.determineNotificationChannels(workflow.applicationData);
      
      const notificationResult = await this.notificationService.sendAccountRejectionNotification(
        workflow.customer,
        rejectionReason,
        channels
      );

      return { success: true, notificationResult };

    } catch (error) {
      return { success: false, error: `Rejection notification failed: ${error.message}` };
    }
  }

  /**
   * Determine notification channels based on application data
   * @param {Object} applicationData - Application data
   * @returns {Array} Notification channels
   */
  determineNotificationChannels(applicationData) {
    const channels = [];

    // Always try email first
    channels.push('email');

    // Add SMS if phone number is provided
    if (applicationData.preferredChannels) {
      applicationData.preferredChannels.forEach(channel => {
        if (['sms', 'push'].includes(channel) && !channels.includes(channel)) {
          channels.push(channel);
        }
      });
    }

    return channels;
  }

  /**
   * Complete workflow and update metrics
   * @param {Object} workflow - Workflow context
   * @param {string} finalStatus - Final workflow status
   * @param {string} error - Error message if any
   * @param {Object} account - Created account if successful
   * @returns {Object} Final workflow result
   */
  completeWorkflow(workflow, finalStatus, error = null, account = null) {
    const endTime = Date.now();
    const processingTime = endTime - workflow.startTime;

    workflow.status = finalStatus;
    workflow.endTime = endTime;
    workflow.processingTime = processingTime;
    workflow.error = error;

    // Send rejection notification if workflow was rejected and customer data exists
    if (finalStatus === 'REJECTED' && workflow.customer && error) {
      // Send rejection notification asynchronously (don't wait for it)
      this.sendAccountRejectionNotification(workflow, error)
        .catch(notificationError => {
          console.warn(`Failed to send rejection notification for workflow ${workflow.workflowId}: ${notificationError.message}`);
        });
    }

    // Update metrics
    if (finalStatus === 'APPROVED') {
      this.metrics.successfulApplications++;
    } else {
      this.metrics.rejectedApplications++;
    }

    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalApplications - 1) + processingTime;
    this.metrics.averageProcessingTime = Math.round(totalTime / this.metrics.totalApplications);

    // Create audit log
    const auditLog = new AuditLog(
      'ACCOUNT_OPENING_WORKFLOW',
      workflow.workflowId,
      'WORKFLOW_COMPLETED',
      uuidv4(), // System user ID
      null,
      {
        status: finalStatus,
        processingTime,
        steps: workflow.steps.length,
        customerId: workflow.customer?.customerId,
        accountId: account?.accountId
      }
    );

    // Clean up active workflow
    this.activeWorkflows.delete(workflow.workflowId);

    return {
      workflowId: workflow.workflowId,
      status: finalStatus,
      processingTime,
      customer: workflow.customer,
      account,
      error,
      steps: workflow.steps,
      auditLog
    };
  }

  /**
   * Get workflow status
   * @param {string} workflowId - Workflow ID
   * @returns {Object} Workflow status
   */
  getWorkflowStatus(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      return { found: false };
    }

    return {
      found: true,
      workflowId: workflow.workflowId,
      status: workflow.status,
      currentStep: workflow.currentStep,
      startTime: workflow.startTime,
      steps: workflow.steps,
      processingTime: Date.now() - workflow.startTime
    };
  }

  /**
   * Get module statistics
   * @returns {Object} Module statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      activeWorkflows: this.activeWorkflows.size,
      config: {
        enableAutoApproval: this.config.enableAutoApproval,
        eligibilityThreshold: this.config.eligibilityThreshold,
        documentVerificationRequired: this.config.documentVerificationRequired
      }
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.documentProcessor.cleanup();
    this.activeWorkflows.clear();
  }
}

/**
 * Eligibility Checker - Configurable business rules for account eligibility
 */
class EligibilityChecker {
  constructor(config = {}) {
    this.config = config;
    this.rules = [
      new AgeEligibilityRule(),
      new DocumentVerificationRule(),
      new IdentityValidationRule(),
      new RiskAssessmentRule()
    ];
  }

  /**
   * Check customer eligibility for account opening
   * @param {Customer} customer - Customer object
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} Eligibility result
   */
  async checkEligibility(customer, applicationData) {
    const ruleResults = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const rule of this.rules) {
      const result = await rule.evaluate(customer, applicationData);
      ruleResults.push(result);
      totalScore += result.score;
      maxScore += result.maxScore;
    }

    const finalScore = Math.round((totalScore / maxScore) * 100);
    const passedRules = ruleResults.filter(r => r.passed);
    const failedRules = ruleResults.filter(r => !r.passed);

    return {
      score: finalScore,
      passed: finalScore >= (this.config.eligibilityThreshold || 70),
      ruleResults,
      passedRules: passedRules.map(r => r.ruleName),
      failedRules: failedRules.map(r => r.ruleName),
      details: {
        totalScore,
        maxScore,
        evaluatedRules: this.rules.length
      }
    };
  }

  /**
   * Add custom eligibility rule
   * @param {Object} rule - Custom rule implementation
   */
  addRule(rule) {
    this.rules.push(rule);
  }

  /**
   * Remove eligibility rule
   * @param {string} ruleName - Name of rule to remove
   */
  removeRule(ruleName) {
    this.rules = this.rules.filter(rule => rule.constructor.name !== ruleName);
  }
}

/**
 * Account Creator - Core banking system integration for account setup
 */
class AccountCreator {
  constructor(config = {}) {
    this.config = config;
    this.coreBankingInterface = new CoreBankingInterface(config);
  }

  /**
   * Create new bank account
   * @param {Customer} customer - Customer object
   * @param {Object} applicationData - Application data
   * @returns {Promise<Account>} Created account
   */
  async createAccount(customer, applicationData) {
    try {
      // Determine account type
      const accountType = this.determineAccountType(applicationData);
      
      // Create account object
      const account = new Account(
        customer.customerId,
        accountType,
        applicationData.currency || 'USD'
      );

      // Integrate with core banking system
      await this.coreBankingInterface.createAccount(account, customer);

      // Set account as active
      account.status = AccountStatus.ACTIVE;

      return account;

    } catch (error) {
      throw new Error(`Account creation failed: ${error.message}`);
    }
  }

  /**
   * Determine account type based on application data
   * @param {Object} applicationData - Application data
   * @returns {string} Account type
   */
  determineAccountType(applicationData) {
    if (applicationData.accountType) {
      return applicationData.accountType;
    }

    // Default logic for account type determination
    if (applicationData.businessInfo) {
      return AccountType.BUSINESS;
    }

    return AccountType.SAVINGS; // Default to savings account
  }
}

// Eligibility Rules

class AgeEligibilityRule {
  async evaluate(customer, applicationData) {
    const dob = customer.personalInfo.dateOfBirth;
    if (!dob) {
      return {
        ruleName: 'AgeEligibilityRule',
        passed: false,
        score: 0,
        maxScore: 25,
        reason: 'Date of birth not provided'
      };
    }

    const age = this.calculateAge(dob);
    const passed = age >= 18 && age <= 100;

    return {
      ruleName: 'AgeEligibilityRule',
      passed,
      score: passed ? 25 : 0,
      maxScore: 25,
      reason: passed ? 'Age requirement met' : `Age ${age} does not meet requirements (18-100)`
    };
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

class DocumentVerificationRule {
  async evaluate(customer, applicationData) {
    const verifiedDocs = customer.identityDocuments.filter(
      doc => doc.verificationStatus === VerificationStatus.VERIFIED
    );

    const passed = verifiedDocs.length > 0;

    return {
      ruleName: 'DocumentVerificationRule',
      passed,
      score: passed ? 25 : 0,
      maxScore: 25,
      reason: passed ? 
        `${verifiedDocs.length} document(s) verified` : 
        'No verified documents found'
    };
  }
}

class IdentityValidationRule {
  async evaluate(customer, applicationData) {
    const hasName = customer.personalInfo.firstName && customer.personalInfo.lastName;
    const hasValidDocs = customer.identityDocuments.length > 0;
    
    const passed = hasName && hasValidDocs;

    return {
      ruleName: 'IdentityValidationRule',
      passed,
      score: passed ? 25 : 0,
      maxScore: 25,
      reason: passed ? 
        'Identity validation passed' : 
        'Missing required identity information'
    };
  }
}

class RiskAssessmentRule {
  async evaluate(customer, applicationData) {
    // Simple risk assessment based on available data
    let riskScore = 100; // Start with low risk
    
    // Reduce risk score for missing information
    if (!customer.personalInfo.address) riskScore -= 10;
    if (!customer.personalInfo.nationality) riskScore -= 5;
    if (customer.identityDocuments.length < 2) riskScore -= 15;

    const passed = riskScore >= 70;

    return {
      ruleName: 'RiskAssessmentRule',
      passed,
      score: passed ? 25 : Math.max(0, Math.round(riskScore / 4)),
      maxScore: 25,
      reason: passed ? 
        `Risk assessment passed (score: ${riskScore})` : 
        `Risk score too low (${riskScore})`
    };
  }
}

/**
 * Core Banking Interface - Mock implementation for core banking system integration
 */
class CoreBankingInterface {
  constructor(config = {}) {
    this.config = config;
    this.mockDelay = config.mockDelay || 1000;
  }

  /**
   * Create account in core banking system
   * @param {Account} account - Account to create
   * @param {Customer} customer - Customer information
   * @returns {Promise<Object>} Creation result
   */
  async createAccount(account, customer) {
    // Simulate core banking system delay
    await this.delay(this.mockDelay);

    // Mock core banking system response
    return {
      success: true,
      accountId: account.accountId,
      accountNumber: account.accountNumber,
      coreBankingId: `CB_${Date.now()}`,
      timestamp: new Date()
    };
  }

  /**
   * Delay utility for simulation
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  AccountOpeningModule,
  EligibilityChecker,
  AccountCreator,
  CoreBankingInterface
};