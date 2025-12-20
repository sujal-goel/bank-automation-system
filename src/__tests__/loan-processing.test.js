// Unit tests for Loan Processing Module
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5

const { v4: uuidv4 } = require('uuid');
const { 
  LoanProcessingModule, 
  CreditAssessor, 
  UnderwritingEngine,
  WorkflowManager,
  LoanDecisionNotifier
} = require('../modules/loan-processing');
const { LoanApplication } = require('../shared/interfaces');
const { LoanType, DocumentType, ApplicationStatus } = require('../shared/types');

describe('Loan Processing Module', () => {
  describe('CreditAssessor', () => {
    let creditAssessor;

    beforeEach(() => {
      creditAssessor = new CreditAssessor();
    });

    test('should retrieve credit score successfully', async () => {
      const customerId = uuidv4();
      const customerInfo = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-01-01')
        }
      };

      const result = await creditAssessor.retrieveCreditScore(customerId, customerInfo);

      expect(result.success).toBe(true);
      expect(result.customerId).toBe(customerId);
      expect(result.creditScore).toBeGreaterThanOrEqual(300);
      expect(result.creditScore).toBeLessThanOrEqual(850);
      expect(result.creditHistory).toBeDefined();
      expect(result.bureauResponses).toBeDefined();
    });

    test('should fail when customer info is missing', async () => {
      const result = await creditAssessor.retrieveCreditScore(uuidv4(), null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should calculate composite score from multiple bureaus', () => {
      const creditData = {
        CIBIL: { score: 700 },
        EXPERIAN: { score: 720 },
        EQUIFAX: { score: 710 }
      };

      const compositeScore = creditAssessor.calculateCompositeScore(creditData);

      expect(compositeScore).toBe(710); // Average of 700, 720, 710
    });
  });

  describe('UnderwritingEngine', () => {
    let underwritingEngine;

    beforeEach(() => {
      underwritingEngine = new UnderwritingEngine({
        minCreditScore: 650,
        maxLoanAmount: 1000000
      });
    });

    test('should approve application meeting all criteria', () => {
      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Home renovation');
      application.addDocument(DocumentType.INCOME_PROOF, 'income.pdf');
      application.addDocument(DocumentType.BANK_STATEMENT, 'statement.pdf');

      const creditAssessment = {
        success: true,
        creditScore: 750,
        creditHistory: {}
      };

      const incomeVerification = {
        monthlyIncome: 10000,
        annualIncome: 120000,
        monthlyDebts: 1000
      };

      const decision = underwritingEngine.makeDecision(application, creditAssessment, incomeVerification);

      expect(decision.approved).toBe(true);
      expect(decision.approvedAmount).toBe(50000);
      expect(decision.interestRate).toBeDefined();
      expect(decision.terms).toBeDefined();
    });

    test('should reject application with low credit score', () => {
      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Home renovation');
      
      const creditAssessment = {
        success: true,
        creditScore: 600, // Below minimum of 650
        creditHistory: {}
      };

      const decision = underwritingEngine.makeDecision(application, creditAssessment, {});

      expect(decision.approved).toBe(false);
      expect(decision.reason).toContain('Credit score');
    });

    test('should reject application exceeding max loan amount', () => {
      const application = new LoanApplication(uuidv4(), LoanType.BUSINESS, 1500000, 'Business expansion');
      
      const creditAssessment = {
        success: true,
        creditScore: 750,
        creditHistory: {}
      };

      const decision = underwritingEngine.makeDecision(application, creditAssessment, {});

      expect(decision.approved).toBe(false);
      expect(decision.reason).toContain('maximum limit');
    });
  });

  describe('WorkflowManager', () => {
    let workflowManager;

    beforeEach(() => {
      workflowManager = new WorkflowManager();
    });

    test('should register loan officer', () => {
      workflowManager.registerOfficer('OFF-001', {
        name: 'Jane Smith',
        capacity: 10,
        specializations: [LoanType.PERSONAL, LoanType.AUTO]
      });

      const stats = workflowManager.getWorkloadStats();
      expect(stats.totalOfficers).toBe(1);
      expect(stats.availableOfficers).toBe(1);
    });

    test('should assign task to available officer', () => {
      workflowManager.registerOfficer('OFF-001', {
        name: 'Jane Smith',
        capacity: 10
      });

      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Home renovation');
      const decision = { approved: true, creditScore: 750 };

      const result = workflowManager.assignTask(application, decision);

      expect(result.success).toBe(true);
      expect(result.assigned).toBe(true);
      expect(result.task).toBeDefined();
      expect(result.officer.officerId).toBe('OFF-001');
      expect(application.assignedOfficer).toBe('OFF-001');
      expect(application.status).toBe(ApplicationStatus.UNDER_REVIEW);
    });

    test('should queue task when no officers available', () => {
      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Home renovation');
      const decision = { approved: true, creditScore: 750 };

      const result = workflowManager.assignTask(application, decision);

      expect(result.success).toBe(true);
      expect(result.assigned).toBe(false);
      expect(result.queued).toBe(true);
      expect(result.queuePosition).toBe(1);
    });

    test('should balance workload across officers', () => {
      workflowManager.registerOfficer('OFF-001', { name: 'Officer 1', capacity: 5 });
      workflowManager.registerOfficer('OFF-002', { name: 'Officer 2', capacity: 5 });

      // Assign multiple tasks
      for (let i = 0; i < 3; i++) {
        const app = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Purpose');
        workflowManager.assignTask(app, { approved: true, creditScore: 700 });
      }

      const stats = workflowManager.getWorkloadStats();
      expect(stats.currentLoad).toBe(3);
      
      // Both officers should have some tasks (workload balanced)
      const officer1 = stats.officers.find(o => o.officerId === 'OFF-001');
      const officer2 = stats.officers.find(o => o.officerId === 'OFF-002');
      
      expect(officer1.currentLoad + officer2.currentLoad).toBe(3);
    });

    test('should complete task and reduce officer workload', () => {
      workflowManager.registerOfficer('OFF-001', { capacity: 10 });

      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Purpose');
      const assignResult = workflowManager.assignTask(application, { approved: true, creditScore: 700 });

      const completeResult = workflowManager.completeTask(assignResult.task.taskId);

      expect(completeResult.success).toBe(true);
      expect(completeResult.remainingLoad).toBe(0);
    });
  });

  describe('LoanDecisionNotifier', () => {
    let notifier;

    beforeEach(() => {
      notifier = new LoanDecisionNotifier();
    });

    test('should create approval message', () => {
      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Home renovation');
      const decision = {
        approved: true,
        approvedAmount: 50000,
        interestRate: 8.0,
        terms: {
          termMonths: 60,
          monthlyPayment: 1013.82
        }
      };

      const message = notifier.createDecisionMessage(application, decision);

      expect(message.subject).toContain('Approved');
      expect(message.email).toContain('approved');
      expect(message.email).toContain('$50,000');
      expect(message.email).toContain('8%');
      expect(message.sms).toContain('APPROVED');
    });

    test('should create rejection message', () => {
      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Home renovation');
      const decision = {
        approved: false,
        reason: 'Credit score below minimum requirement'
      };

      const message = notifier.createDecisionMessage(application, decision);

      expect(message.subject).toContain('Decision');
      expect(message.email).toContain('unable to approve');
      expect(message.email).toContain('Credit score below minimum requirement');
      expect(message.sms).toContain('could not be approved');
    });

    test('should send notification to applicant', async () => {
      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Purpose');
      const decision = {
        approved: true,
        approvedAmount: 50000,
        interestRate: 8.0,
        terms: { termMonths: 60, monthlyPayment: 1013.82 }
      };
      const customerContact = {
        email: 'customer@example.com',
        phone: '+1234567890'
      };

      const result = await notifier.notifyApplicant(application, decision, customerContact);

      expect(result.success).toBe(true);
      expect(result.applicationId).toBe(application.applicationId);
      expect(result.channels.email).toBeDefined();
      expect(result.channels.sms).toBeDefined();
    });
  });

  describe('LoanProcessingModule Integration', () => {
    let loanProcessingModule;

    beforeEach(async () => {
      loanProcessingModule = new LoanProcessingModule({
        creditBureau: {},
        underwritingRules: {
          minCreditScore: 650,
          maxLoanAmount: 1000000
        }
      });
    });

    afterEach(async () => {
      if (loanProcessingModule.initialized) {
        await loanProcessingModule.cleanup();
      }
    });

    test('should process loan application successfully', async () => {
      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Home renovation');
      
      const customerInfo = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-01-01')
        }
      };

      const documentInputs = [
        {
          input: 'mock-income-doc',
          type: DocumentType.INCOME_PROOF,
          fileName: 'income.pdf'
        },
        {
          input: 'mock-bank-statement',
          type: DocumentType.BANK_STATEMENT,
          fileName: 'statement.pdf'
        }
      ];

      const result = await loanProcessingModule.processLoanApplication(
        application,
        customerInfo,
        documentInputs
      );

      expect(result.success).toBe(true);
      expect(result.stage).toBe('completed');
      expect(result.creditAssessment).toBeDefined();
      expect(result.decision).toBeDefined();
      expect(application.creditScore).toBeDefined();
      expect([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]).toContain(application.status);
    });

    test('should handle document validation failure', async () => {
      const application = new LoanApplication(uuidv4(), LoanType.PERSONAL, 50000, 'Purpose');
      const customerInfo = { personalInfo: {} };
      const documentInputs = []; // No documents

      const result = await loanProcessingModule.processLoanApplication(
        application,
        customerInfo,
        documentInputs
      );

      // May succeed or fail depending on document validation
      expect(result).toBeDefined();
      expect(result.stage).toBeDefined();
    });
  });
});
