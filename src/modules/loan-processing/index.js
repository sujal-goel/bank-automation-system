// Loan Processing Module
// Implements automated loan application processing workflow
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5

const { LoanApplication } = require('../../shared/interfaces');
const { ApplicationStatus, DocumentType } = require('../../shared/types');
const DocumentProcessor = require('../../services/document-processor');
const { validators } = require('../../shared/validation');

/**
 * Credit Assessor - Handles credit bureau integration and credit scoring
 */
class CreditAssessor {
  constructor(creditBureauConfig = {}) {
    this.creditBureauConfig = creditBureauConfig;
    this.bureauEndpoints = {
      CIBIL: creditBureauConfig.cibilEndpoint || 'https://api.cibil.com',
      EXPERIAN: creditBureauConfig.experianEndpoint || 'https://api.experian.com',
      EQUIFAX: creditBureauConfig.equifaxEndpoint || 'https://api.equifax.com'
    };
  }

  /**
   * Retrieve credit score from credit bureaus
   * @param {string} customerId - Customer identifier
   * @param {Object} customerInfo - Customer information for credit check
   * @returns {Promise<Object>} Credit assessment result
   */
  async retrieveCreditScore(customerId, customerInfo) {
    try {
      // Validate customer info
      if (!customerInfo || !customerInfo.personalInfo) {
        throw new Error('Customer information is required for credit assessment');
      }

      // In production, this would make actual API calls to credit bureaus
      // For now, we'll simulate the credit bureau integration
      const creditData = await this.fetchFromCreditBureaus(customerId, customerInfo);

      // Calculate composite credit score
      const creditScore = this.calculateCompositeScore(creditData);

      // Retrieve credit history
      const creditHistory = this.extractCreditHistory(creditData);

      return {
        customerId,
        creditScore,
        creditHistory,
        bureauResponses: creditData,
        assessmentDate: new Date(),
        success: true
      };
    } catch (error) {
      return {
        customerId,
        creditScore: null,
        creditHistory: null,
        bureauResponses: null,
        assessmentDate: new Date(),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch credit data from multiple credit bureaus
   * @param {string} customerId - Customer identifier
   * @param {Object} customerInfo - Customer information
   * @returns {Promise<Object>} Credit bureau responses
   */
  async fetchFromCreditBureaus(customerId, customerInfo) {
    // Simulate credit bureau API calls
    // In production, this would make actual HTTP requests to credit bureaus
    const responses = {
      CIBIL: await this.fetchFromCIBIL(customerId, customerInfo),
      EXPERIAN: await this.fetchFromExperian(customerId, customerInfo),
      EQUIFAX: await this.fetchFromEquifax(customerId, customerInfo)
    };

    return responses;
  }

  async fetchFromCIBIL(customerId, customerInfo) {
    // Simulate CIBIL API call
    return {
      bureau: 'CIBIL',
      score: this.generateSimulatedScore(),
      reportDate: new Date(),
      accounts: this.generateSimulatedAccounts(),
      inquiries: []
    };
  }

  async fetchFromExperian(customerId, customerInfo) {
    // Simulate Experian API call
    return {
      bureau: 'EXPERIAN',
      score: this.generateSimulatedScore(),
      reportDate: new Date(),
      accounts: this.generateSimulatedAccounts(),
      inquiries: []
    };
  }

  async fetchFromEquifax(customerId, customerInfo) {
    // Simulate Equifax API call
    return {
      bureau: 'EQUIFAX',
      score: this.generateSimulatedScore(),
      reportDate: new Date(),
      accounts: this.generateSimulatedAccounts(),
      inquiries: []
    };
  }

  generateSimulatedScore() {
    // Generate a realistic credit score between 300-850
    return Math.floor(Math.random() * 551) + 300;
  }

  generateSimulatedAccounts() {
    // Generate simulated credit accounts
    const numAccounts = Math.floor(Math.random() * 5) + 1;
    const accounts = [];
    
    for (let i = 0; i < numAccounts; i++) {
      accounts.push({
        accountType: ['Credit Card', 'Auto Loan', 'Mortgage', 'Personal Loan'][Math.floor(Math.random() * 4)],
        balance: Math.floor(Math.random() * 50000),
        status: 'Active'
      });
    }
    
    return accounts;
  }

  /**
   * Calculate composite credit score from multiple bureaus
   * @param {Object} creditData - Credit data from all bureaus
   * @returns {number} Composite credit score
   */
  calculateCompositeScore(creditData) {
    const scores = [];
    
    if (creditData.CIBIL && creditData.CIBIL.score) {
      scores.push(creditData.CIBIL.score);
    }
    if (creditData.EXPERIAN && creditData.EXPERIAN.score) {
      scores.push(creditData.EXPERIAN.score);
    }
    if (creditData.EQUIFAX && creditData.EQUIFAX.score) {
      scores.push(creditData.EQUIFAX.score);
    }

    if (scores.length === 0) {
      throw new Error('No credit scores available from bureaus');
    }

    // Calculate average score
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    return averageScore;
  }

  /**
   * Extract credit history from bureau responses
   * @param {Object} creditData - Credit data from bureaus
   * @returns {Object} Consolidated credit history
   */
  extractCreditHistory(creditData) {
    const allAccounts = [];
    
    Object.values(creditData).forEach(bureauData => {
      if (bureauData.accounts) {
        allAccounts.push(...bureauData.accounts);
      }
    });

    return {
      totalAccounts: allAccounts.length,
      accounts: allAccounts,
      oldestAccount: this.findOldestAccount(allAccounts),
      recentInquiries: this.countRecentInquiries(creditData)
    };
  }

  findOldestAccount(accounts) {
    if (accounts.length === 0) return null;
    // In production, would actually check account opening dates
    return accounts[0];
  }

  countRecentInquiries(creditData) {
    let count = 0;
    Object.values(creditData).forEach(bureauData => {
      if (bureauData.inquiries) {
        count += bureauData.inquiries.length;
      }
    });
    return count;
  }
}

/**
 * Underwriting Engine - Applies business rules for loan decisions
 */
class UnderwritingEngine {
  constructor(underwritingRules = {}) {
    this.rules = {
      minCreditScore: underwritingRules.minCreditScore || 650,
      maxDebtToIncomeRatio: underwritingRules.maxDebtToIncomeRatio || 0.43,
      minIncomeMultiplier: underwritingRules.minIncomeMultiplier || 3,
      maxLoanAmount: underwritingRules.maxLoanAmount || 1000000,
      ...underwritingRules
    };
  }

  /**
   * Make underwriting decision based on application and credit data
   * @param {LoanApplication} application - Loan application
   * @param {Object} creditAssessment - Credit assessment result
   * @param {Object} incomeVerification - Income verification data
   * @returns {Object} Underwriting decision
   */
  makeDecision(application, creditAssessment, incomeVerification = {}) {
    try {
      // Validate inputs
      if (!application || !creditAssessment) {
        throw new Error('Application and credit assessment are required');
      }

      // Check if credit assessment was successful
      if (!creditAssessment.success || !creditAssessment.creditScore) {
        return this.createRejectionDecision(
          application,
          'Unable to retrieve credit score',
          []
        );
      }

      // Apply underwriting rules
      const ruleResults = this.applyUnderwritingRules(
        application,
        creditAssessment,
        incomeVerification
      );

      // Determine approval based on rule results
      const approved = ruleResults.every(rule => rule.passed);

      if (approved) {
        return this.createApprovalDecision(application, creditAssessment, ruleResults);
      } else {
        const failedRules = ruleResults.filter(rule => !rule.passed);
        const rejectionReason = failedRules.map(rule => rule.reason).join('; ');
        return this.createRejectionDecision(application, rejectionReason, ruleResults);
      }
    } catch (error) {
      return {
        approved: false,
        reason: `Underwriting error: ${error.message}`,
        decisionDate: new Date(),
        ruleResults: [],
        error: error.message
      };
    }
  }

  /**
   * Apply all underwriting rules to the application
   * @param {LoanApplication} application - Loan application
   * @param {Object} creditAssessment - Credit assessment
   * @param {Object} incomeVerification - Income verification
   * @returns {Array} Array of rule results
   */
  applyUnderwritingRules(application, creditAssessment, incomeVerification) {
    const results = [];

    // Rule 1: Minimum credit score
    results.push(this.checkCreditScore(creditAssessment.creditScore));

    // Rule 2: Maximum loan amount
    results.push(this.checkLoanAmount(application.requestedAmount));

    // Rule 3: Debt-to-income ratio (if income data available)
    if (incomeVerification.monthlyIncome) {
      results.push(this.checkDebtToIncomeRatio(
        application.requestedAmount,
        incomeVerification.monthlyIncome,
        incomeVerification.monthlyDebts || 0
      ));
    }

    // Rule 4: Income multiplier (if income data available)
    if (incomeVerification.annualIncome) {
      results.push(this.checkIncomeMultiplier(
        application.requestedAmount,
        incomeVerification.annualIncome
      ));
    }

    // Rule 5: Required documents
    results.push(this.checkRequiredDocuments(application));

    return results;
  }

  checkCreditScore(creditScore) {
    const passed = creditScore >= this.rules.minCreditScore;
    return {
      ruleName: 'Minimum Credit Score',
      passed,
      reason: passed 
        ? `Credit score ${creditScore} meets minimum requirement of ${this.rules.minCreditScore}`
        : `Credit score ${creditScore} below minimum requirement of ${this.rules.minCreditScore}`,
      value: creditScore,
      threshold: this.rules.minCreditScore
    };
  }

  checkLoanAmount(requestedAmount) {
    const passed = requestedAmount <= this.rules.maxLoanAmount;
    return {
      ruleName: 'Maximum Loan Amount',
      passed,
      reason: passed
        ? `Requested amount ${requestedAmount} within maximum limit of ${this.rules.maxLoanAmount}`
        : `Requested amount ${requestedAmount} exceeds maximum limit of ${this.rules.maxLoanAmount}`,
      value: requestedAmount,
      threshold: this.rules.maxLoanAmount
    };
  }

  checkDebtToIncomeRatio(loanAmount, monthlyIncome, existingMonthlyDebts) {
    // Estimate monthly payment (simplified calculation)
    const estimatedMonthlyPayment = loanAmount / 60; // Assume 5-year term
    const totalMonthlyDebts = existingMonthlyDebts + estimatedMonthlyPayment;
    const debtToIncomeRatio = totalMonthlyDebts / monthlyIncome;
    
    const passed = debtToIncomeRatio <= this.rules.maxDebtToIncomeRatio;
    return {
      ruleName: 'Debt-to-Income Ratio',
      passed,
      reason: passed
        ? `DTI ratio ${debtToIncomeRatio.toFixed(2)} within acceptable limit of ${this.rules.maxDebtToIncomeRatio}`
        : `DTI ratio ${debtToIncomeRatio.toFixed(2)} exceeds limit of ${this.rules.maxDebtToIncomeRatio}`,
      value: debtToIncomeRatio,
      threshold: this.rules.maxDebtToIncomeRatio
    };
  }

  checkIncomeMultiplier(loanAmount, annualIncome) {
    const incomeMultiplier = loanAmount / annualIncome;
    const passed = incomeMultiplier <= this.rules.minIncomeMultiplier;
    return {
      ruleName: 'Income Multiplier',
      passed,
      reason: passed
        ? `Loan amount is ${incomeMultiplier.toFixed(1)}x annual income, within ${this.rules.minIncomeMultiplier}x limit`
        : `Loan amount is ${incomeMultiplier.toFixed(1)}x annual income, exceeds ${this.rules.minIncomeMultiplier}x limit`,
      value: incomeMultiplier,
      threshold: this.rules.minIncomeMultiplier
    };
  }

  checkRequiredDocuments(application) {
    const requiredDocs = [DocumentType.INCOME_PROOF, DocumentType.BANK_STATEMENT];
    const submittedDocTypes = application.documents.map(doc => doc.documentType);
    const hasAllRequired = requiredDocs.every(docType => submittedDocTypes.includes(docType));
    
    return {
      ruleName: 'Required Documents',
      passed: hasAllRequired,
      reason: hasAllRequired
        ? 'All required documents submitted'
        : `Missing required documents: ${requiredDocs.filter(dt => !submittedDocTypes.includes(dt)).join(', ')}`,
      value: submittedDocTypes.length,
      threshold: requiredDocs.length
    };
  }

  createApprovalDecision(application, creditAssessment, ruleResults) {
    // Calculate approved amount and terms
    const approvedAmount = application.requestedAmount;
    const interestRate = this.calculateInterestRate(creditAssessment.creditScore);
    const terms = this.calculateLoanTerms(approvedAmount, interestRate);

    return {
      approved: true,
      approvedAmount,
      interestRate,
      terms,
      reason: 'Application meets all underwriting criteria',
      decisionDate: new Date(),
      ruleResults,
      creditScore: creditAssessment.creditScore
    };
  }

  createRejectionDecision(application, reason, ruleResults) {
    return {
      approved: false,
      approvedAmount: null,
      interestRate: null,
      terms: null,
      reason,
      decisionDate: new Date(),
      ruleResults
    };
  }

  calculateInterestRate(creditScore) {
    // Simple interest rate calculation based on credit score
    if (creditScore >= 750) return 6.5;
    if (creditScore >= 700) return 8.0;
    if (creditScore >= 650) return 10.0;
    return 12.0;
  }

  calculateLoanTerms(amount, interestRate) {
    // Calculate loan terms (simplified)
    const termMonths = 60; // 5 years
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                          (Math.pow(1 + monthlyRate, termMonths) - 1);

    return {
      termMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(monthlyPayment * termMonths * 100) / 100,
      totalInterest: Math.round((monthlyPayment * termMonths - amount) * 100) / 100
    };
  }
}

/**
 * Loan Processing Module - Main orchestrator for loan application processing
 */
class LoanProcessingModule {
  constructor(config = {}) {
    this.documentProcessor = new DocumentProcessor();
    this.creditAssessor = new CreditAssessor(config.creditBureau);
    this.underwritingEngine = new UnderwritingEngine(config.underwritingRules);
    this.initialized = false;
  }

  async initialize() {
    await this.documentProcessor.initialize();
    this.initialized = true;
  }

  async cleanup() {
    await this.documentProcessor.cleanup();
    this.initialized = false;
  }

  /**
   * Process a loan application through the complete workflow
   * @param {LoanApplication} application - Loan application to process
   * @param {Object} customerInfo - Customer information
   * @param {Array} documentInputs - Array of document inputs to validate
   * @returns {Promise<Object>} Processing result
   */
  async processLoanApplication(application, customerInfo, documentInputs = []) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Step 1: Validate all required documents
      const documentValidation = await this.validateDocuments(application, documentInputs);
      
      if (!documentValidation.success) {
        return {
          success: false,
          stage: 'document_validation',
          reason: 'Document validation failed',
          details: documentValidation
        };
      }

      // Step 2: Retrieve credit score from credit bureaus
      const creditAssessment = await this.creditAssessor.retrieveCreditScore(
        application.customerId,
        customerInfo
      );

      if (!creditAssessment.success) {
        return {
          success: false,
          stage: 'credit_assessment',
          reason: 'Credit assessment failed',
          details: creditAssessment
        };
      }

      // Update application with credit score
      application.setCreditScore(creditAssessment.creditScore);

      // Step 3: Apply underwriting rules and make decision
      const incomeVerification = this.extractIncomeVerification(documentValidation);
      const decision = this.underwritingEngine.makeDecision(
        application,
        creditAssessment,
        incomeVerification
      );

      // Step 4: Update application with decision
      application.makeDecision(
        decision.approved,
        decision.approvedAmount,
        decision.interestRate,
        decision.terms,
        decision.reason
      );

      return {
        success: true,
        stage: 'completed',
        application,
        documentValidation,
        creditAssessment,
        decision,
        processedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        stage: 'error',
        reason: error.message,
        error: error.message
      };
    }
  }

  /**
   * Validate all documents in the loan application
   * @param {LoanApplication} application - Loan application
   * @param {Array} documentInputs - Document inputs to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateDocuments(application, documentInputs) {
    try {
      const validationResults = [];

      // Process each document
      for (const docInput of documentInputs) {
        const result = await this.documentProcessor.processDocument(
          docInput.input,
          docInput.type,
          { applicationId: application.applicationId }
        );
        
        validationResults.push({
          documentType: docInput.type,
          success: result.success,
          validation: result.validation,
          extractedData: result.extractionResult?.extractedData
        });

        // Add document to application if validation successful
        if (result.success) {
          application.addDocument(docInput.type, docInput.fileName || 'document');
        }
      }

      // Check if all required documents are validated
      const allSuccessful = validationResults.every(result => result.success);

      return {
        success: allSuccessful,
        validationResults,
        validatedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationResults: []
      };
    }
  }

  /**
   * Extract income verification data from validated documents
   * @param {Object} documentValidation - Document validation results
   * @returns {Object} Income verification data
   */
  extractIncomeVerification(documentValidation) {
    const incomeData = {
      monthlyIncome: null,
      annualIncome: null,
      monthlyDebts: null
    };

    // Extract income from validated documents
    documentValidation.validationResults.forEach(result => {
      if (result.documentType === DocumentType.INCOME_PROOF && result.extractedData) {
        if (result.extractedData.monthlyIncome) {
          incomeData.monthlyIncome = parseFloat(result.extractedData.monthlyIncome);
          incomeData.annualIncome = incomeData.monthlyIncome * 12;
        } else if (result.extractedData.annualIncome) {
          incomeData.annualIncome = parseFloat(result.extractedData.annualIncome);
          incomeData.monthlyIncome = incomeData.annualIncome / 12;
        }
      }

      if (result.documentType === DocumentType.BANK_STATEMENT && result.extractedData) {
        if (result.extractedData.monthlyDebts) {
          incomeData.monthlyDebts = parseFloat(result.extractedData.monthlyDebts);
        }
      }
    });

    return incomeData;
  }

  /**
   * Get processing statistics
   * @returns {Object} Processing statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      documentProcessor: this.documentProcessor.getProcessingStats(),
      underwritingRules: this.underwritingEngine.rules
    };
  }
}

/**
 * Workflow Manager - Handles task assignment and workload balancing
 */
class WorkflowManager {
  constructor() {
    this.officers = new Map(); // Map of officer ID to officer data
    this.taskQueue = [];
    this.assignedTasks = new Map(); // Map of task ID to officer ID
  }

  /**
   * Register a loan officer in the system
   * @param {string} officerId - Officer identifier
   * @param {Object} officerData - Officer information
   */
  registerOfficer(officerId, officerData = {}) {
    this.officers.set(officerId, {
      officerId,
      name: officerData.name || `Officer ${officerId}`,
      capacity: officerData.capacity || 10, // Maximum concurrent tasks
      currentLoad: 0,
      assignedTasks: [],
      specializations: officerData.specializations || [],
      performanceScore: officerData.performanceScore || 100,
      registeredAt: new Date()
    });
  }

  /**
   * Unregister a loan officer from the system
   * @param {string} officerId - Officer identifier
   */
  unregisterOfficer(officerId) {
    const officer = this.officers.get(officerId);
    if (officer && officer.currentLoad > 0) {
      throw new Error(`Cannot unregister officer ${officerId} with active tasks`);
    }
    this.officers.delete(officerId);
  }

  /**
   * Assign a loan application to an appropriate officer
   * @param {LoanApplication} application - Loan application
   * @param {Object} decision - Underwriting decision
   * @returns {Object} Assignment result
   */
  assignTask(application, decision) {
    try {
      // Determine task priority based on loan amount and decision
      const priority = this.calculateTaskPriority(application, decision);

      // Find the best available officer
      const selectedOfficer = this.selectOfficer(application, priority);

      if (!selectedOfficer) {
        // No officer available, add to queue
        const task = {
          taskId: `TASK-${application.applicationId}`,
          applicationId: application.applicationId,
          loanType: application.loanType,
          requestedAmount: application.requestedAmount,
          decision,
          priority,
          createdAt: new Date(),
          status: 'QUEUED'
        };
        
        this.taskQueue.push(task);
        
        return {
          success: true,
          assigned: false,
          queued: true,
          task,
          queuePosition: this.taskQueue.length
        };
      }

      // Create task and assign to officer
      const task = {
        taskId: `TASK-${application.applicationId}`,
        applicationId: application.applicationId,
        customerId: application.customerId,
        loanType: application.loanType,
        requestedAmount: application.requestedAmount,
        decision,
        priority,
        assignedTo: selectedOfficer.officerId,
        assignedAt: new Date(),
        status: 'ASSIGNED',
        dueDate: this.calculateDueDate(priority)
      };

      // Update officer workload
      selectedOfficer.currentLoad++;
      selectedOfficer.assignedTasks.push(task.taskId);
      this.assignedTasks.set(task.taskId, selectedOfficer.officerId);

      // Update application with assigned officer
      application.assignedOfficer = selectedOfficer.officerId;
      application.status = ApplicationStatus.UNDER_REVIEW;
      application.updatedAt = new Date();

      return {
        success: true,
        assigned: true,
        queued: false,
        task,
        officer: {
          officerId: selectedOfficer.officerId,
          name: selectedOfficer.name,
          currentLoad: selectedOfficer.currentLoad,
          capacity: selectedOfficer.capacity
        }
      };
    } catch (error) {
      return {
        success: false,
        assigned: false,
        queued: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate task priority based on application characteristics
   * @param {LoanApplication} application - Loan application
   * @param {Object} decision - Underwriting decision
   * @returns {number} Priority score (higher = more urgent)
   */
  calculateTaskPriority(application, decision) {
    let priority = 50; // Base priority

    // Increase priority for larger loan amounts
    if (application.requestedAmount > 500000) {
      priority += 20;
    } else if (application.requestedAmount > 100000) {
      priority += 10;
    }

    // Increase priority for approved applications
    if (decision.approved) {
      priority += 15;
    }

    // Increase priority for high credit scores
    if (decision.creditScore && decision.creditScore > 750) {
      priority += 10;
    }

    // Decrease priority for rejected applications
    if (!decision.approved) {
      priority -= 10;
    }

    return Math.max(0, Math.min(100, priority)); // Clamp between 0-100
  }

  /**
   * Select the best officer for a task using workload balancing
   * @param {LoanApplication} application - Loan application
   * @param {number} priority - Task priority
   * @returns {Object|null} Selected officer or null if none available
   */
  selectOfficer(application, priority) {
    const availableOfficers = Array.from(this.officers.values())
      .filter(officer => officer.currentLoad < officer.capacity);

    if (availableOfficers.length === 0) {
      return null;
    }

    // Score each officer based on multiple factors
    const scoredOfficers = availableOfficers.map(officer => {
      let score = 0;

      // Factor 1: Workload (prefer officers with lower load)
      const loadRatio = officer.currentLoad / officer.capacity;
      score += (1 - loadRatio) * 40;

      // Factor 2: Specialization match
      if (officer.specializations.includes(application.loanType)) {
        score += 30;
      }

      // Factor 3: Performance score
      score += (officer.performanceScore / 100) * 20;

      // Factor 4: Random factor for fairness
      score += Math.random() * 10;

      return {
        officer,
        score
      };
    });

    // Sort by score (descending) and select the best
    scoredOfficers.sort((a, b) => b.score - a.score);
    return scoredOfficers[0].officer;
  }

  /**
   * Calculate due date based on priority
   * @param {number} priority - Task priority
   * @returns {Date} Due date
   */
  calculateDueDate(priority) {
    // Higher priority = shorter deadline
    let daysToComplete = 7; // Default 7 days

    if (priority >= 80) {
      daysToComplete = 2;
    } else if (priority >= 60) {
      daysToComplete = 4;
    } else if (priority >= 40) {
      daysToComplete = 7;
    } else {
      daysToComplete = 10;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToComplete);
    return dueDate;
  }

  /**
   * Complete a task and update officer workload
   * @param {string} taskId - Task identifier
   * @returns {Object} Completion result
   */
  completeTask(taskId) {
    const officerId = this.assignedTasks.get(taskId);
    
    if (!officerId) {
      return {
        success: false,
        error: 'Task not found or not assigned'
      };
    }

    const officer = this.officers.get(officerId);
    
    if (!officer) {
      return {
        success: false,
        error: 'Assigned officer not found'
      };
    }

    // Update officer workload
    officer.currentLoad = Math.max(0, officer.currentLoad - 1);
    officer.assignedTasks = officer.assignedTasks.filter(id => id !== taskId);
    this.assignedTasks.delete(taskId);

    // Process next task from queue if officer has capacity
    if (officer.currentLoad < officer.capacity && this.taskQueue.length > 0) {
      this.processQueue();
    }

    return {
      success: true,
      taskId,
      officerId,
      remainingLoad: officer.currentLoad
    };
  }

  /**
   * Process queued tasks and assign to available officers
   */
  processQueue() {
    // Sort queue by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    const tasksToAssign = [];
    
    for (const queuedTask of this.taskQueue) {
      // Find available officer
      const availableOfficers = Array.from(this.officers.values())
        .filter(officer => officer.currentLoad < officer.capacity);

      if (availableOfficers.length === 0) {
        break; // No more available officers
      }

      // Select officer (simplified - just pick first available)
      const officer = availableOfficers[0];

      // Update task
      queuedTask.status = 'ASSIGNED';
      queuedTask.assignedTo = officer.officerId;
      queuedTask.assignedAt = new Date();

      // Update officer
      officer.currentLoad++;
      officer.assignedTasks.push(queuedTask.taskId);
      this.assignedTasks.set(queuedTask.taskId, officer.officerId);

      tasksToAssign.push(queuedTask);
    }

    // Remove assigned tasks from queue
    this.taskQueue = this.taskQueue.filter(task => task.status === 'QUEUED');

    return tasksToAssign;
  }

  /**
   * Get workload statistics for all officers
   * @returns {Object} Workload statistics
   */
  getWorkloadStats() {
    const officers = Array.from(this.officers.values());
    
    return {
      totalOfficers: officers.length,
      availableOfficers: officers.filter(o => o.currentLoad < o.capacity).length,
      totalCapacity: officers.reduce((sum, o) => sum + o.capacity, 0),
      currentLoad: officers.reduce((sum, o) => sum + o.currentLoad, 0),
      queuedTasks: this.taskQueue.length,
      officers: officers.map(o => ({
        officerId: o.officerId,
        name: o.name,
        currentLoad: o.currentLoad,
        capacity: o.capacity,
        utilizationRate: (o.currentLoad / o.capacity * 100).toFixed(1) + '%'
      }))
    };
  }

  /**
   * Get task details
   * @param {string} taskId - Task identifier
   * @returns {Object|null} Task details or null if not found
   */
  getTask(taskId) {
    const officerId = this.assignedTasks.get(taskId);
    if (officerId) {
      const officer = this.officers.get(officerId);
      return {
        taskId,
        assignedTo: officerId,
        officerName: officer?.name,
        status: 'ASSIGNED'
      };
    }

    const queuedTask = this.taskQueue.find(task => task.taskId === taskId);
    return queuedTask || null;
  }
}

/**
 * Loan Decision Notification System
 */
class LoanDecisionNotifier {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Send loan decision notification to applicant
   * @param {LoanApplication} application - Loan application
   * @param {Object} decision - Loan decision
   * @param {Object} customerContact - Customer contact information
   * @returns {Promise<Object>} Notification result
   */
  async notifyApplicant(application, decision, customerContact) {
    try {
      const message = this.createDecisionMessage(application, decision);
      
      // Send notification through multiple channels
      const results = await Promise.all([
        this.sendEmailNotification(customerContact.email, message),
        this.sendSMSNotification(customerContact.phone, message.sms)
      ]);

      return {
        success: true,
        applicationId: application.applicationId,
        channels: {
          email: results[0],
          sms: results[1]
        },
        sentAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        applicationId: application.applicationId,
        error: error.message
      };
    }
  }

  /**
   * Create decision message for different channels
   * @param {LoanApplication} application - Loan application
   * @param {Object} decision - Loan decision
   * @returns {Object} Messages for different channels
   */
  createDecisionMessage(application, decision) {
    if (decision.approved) {
      return {
        subject: 'Loan Application Approved',
        email: `
Dear Applicant,

We are pleased to inform you that your ${application.loanType} loan application has been approved!

Loan Details:
- Application ID: ${application.applicationId}
- Approved Amount: $${decision.approvedAmount.toLocaleString()}
- Interest Rate: ${decision.interestRate}%
- Monthly Payment: $${decision.terms.monthlyPayment.toLocaleString()}
- Term: ${decision.terms.termMonths} months

Next Steps:
Your application has been assigned to a loan officer who will contact you shortly to complete the final documentation.

Thank you for choosing our services.

Best regards,
Loan Processing Team
        `.trim(),
        sms: `Your ${application.loanType} loan application (${application.applicationId}) has been APPROVED for $${decision.approvedAmount.toLocaleString()} at ${decision.interestRate}% interest. A loan officer will contact you soon.`
      };
    } else {
      return {
        subject: 'Loan Application Decision',
        email: `
Dear Applicant,

Thank you for your ${application.loanType} loan application.

After careful review, we regret to inform you that we are unable to approve your application at this time.

Application ID: ${application.applicationId}
Reason: ${decision.reason}

We encourage you to reapply in the future. If you have questions, please contact our customer service team.

Best regards,
Loan Processing Team
        `.trim(),
        sms: `Your ${application.loanType} loan application (${application.applicationId}) could not be approved at this time. Reason: ${decision.reason}. Please contact us for more information.`
      };
    }
  }

  /**
   * Send email notification
   * @param {string} email - Email address
   * @param {Object} message - Message content
   * @returns {Promise<Object>} Send result
   */
  async sendEmailNotification(email, message) {
    if (this.notificationService) {
      return await this.notificationService.sendEmail(email, message.subject, message.email);
    }

    // Simulate email sending
    return {
      channel: 'email',
      recipient: email,
      success: true,
      sentAt: new Date()
    };
  }

  /**
   * Send SMS notification
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendSMSNotification(phone, message) {
    if (this.notificationService) {
      return await this.notificationService.sendSMS(phone, message);
    }

    // Simulate SMS sending
    return {
      channel: 'sms',
      recipient: phone,
      success: true,
      sentAt: new Date()
    };
  }

  /**
   * Notify loan officer of new task assignment
   * @param {string} officerId - Officer identifier
   * @param {Object} task - Assigned task
   * @param {Object} officerContact - Officer contact information
   * @returns {Promise<Object>} Notification result
   */
  async notifyOfficer(officerId, task, officerContact) {
    try {
      const message = {
        subject: 'New Loan Application Assigned',
        body: `
A new loan application has been assigned to you.

Task ID: ${task.taskId}
Application ID: ${task.applicationId}
Loan Type: ${task.loanType}
Requested Amount: $${task.requestedAmount.toLocaleString()}
Priority: ${task.priority}
Due Date: ${task.dueDate.toLocaleDateString()}
Decision: ${task.decision.approved ? 'APPROVED' : 'REJECTED'}

Please review the application in the system.
        `.trim()
      };

      const result = await this.sendEmailNotification(officerContact.email, message);

      return {
        success: true,
        officerId,
        taskId: task.taskId,
        notificationResult: result
      };
    } catch (error) {
      return {
        success: false,
        officerId,
        taskId: task.taskId,
        error: error.message
      };
    }
  }
}

module.exports = {
  LoanProcessingModule,
  CreditAssessor,
  UnderwritingEngine,
  WorkflowManager,
  LoanDecisionNotifier
};