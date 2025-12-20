// KYC Module Tests

const { KYCModule, IdentityVerifier, RiskScorer, ComplianceReporter } = require('../modules/kyc');
const { KYCStatus, VerificationStatus, DocumentType } = require('../shared/types');

describe('KYC Module', () => {
  let kycModule;

  beforeEach(() => {
    kycModule = new KYCModule();
  });

  describe('KYCModule', () => {
    test('should process KYC successfully for valid customer', async () => {
      const customerId = 'CUST_001';
      const customerData = {
        name: 'JOHN DOE',
        dateOfBirth: '15/06/1985',
        nationality: 'INDIAN',
        addresses: [{ street: '123 Main St', city: 'Mumbai' }]
      };

      const documents = [
        {
          documentType: DocumentType.AADHAAR,
          documentNumber: '123456789012',
          issuingAuthority: 'UIDAI',
          expiryDate: null,
          documentInput: Buffer.from('mock-document'),
          extractedData: {
            name: 'JOHN DOE',
            dateOfBirth: '15/06/1985',
            aadhaarNumber: '123456789012'
          }
        }
      ];

      const result = await kycModule.processKYC(customerId, customerData, documents);

      expect(result.success).toBe(true);
      expect(result.customerId).toBe(customerId);
      expect(result.kycStatus).toBeDefined();
      expect(result.verificationResults).toBeDefined();
      expect(result.riskAssessment).toBeDefined();
      expect(result.finalDecision).toBeDefined();
    });

    test('should get KYC status for customer', async () => {
      const customerId = 'CUST_002';
      const customerData = {
        name: 'JANE DOE',
        dateOfBirth: '20/03/1990',
        nationality: 'INDIAN'
      };

      const documents = [
        {
          documentType: DocumentType.PAN,
          documentNumber: 'ABCDE1234F',
          issuingAuthority: 'Income Tax Department',
          expiryDate: null,
          documentInput: Buffer.from('mock-document'),
          extractedData: {
            name: 'JANE DOE',
            panNumber: 'ABCDE1234F'
          }
        }
      ];

      await kycModule.processKYC(customerId, customerData, documents);
      const status = kycModule.getKYCStatus(customerId);

      expect(status).toBeDefined();
      expect(status.customerId).toBe(customerId);
      expect(status.status).toBeDefined();
    });

    test('should generate KYC report', async () => {
      const customerId = 'CUST_003';
      const customerData = {
        name: 'BOB SMITH',
        dateOfBirth: '10/01/1988',
        nationality: 'INDIAN'
      };

      const documents = [
        {
          documentType: DocumentType.PASSPORT,
          documentNumber: 'P123456789',
          issuingAuthority: 'Passport Seva',
          expiryDate: '15/06/2030',
          documentInput: Buffer.from('mock-document'),
          extractedData: {
            name: 'BOB SMITH',
            passportNumber: 'P123456789'
          }
        }
      ];

      await kycModule.processKYC(customerId, customerData, documents);
      const report = kycModule.generateKYCReport(customerId);

      expect(report).toBeDefined();
      expect(report.reportType).toBe('KYC_STATUS');
      expect(report.customerId).toBe(customerId);
      expect(report.reportId).toBeDefined();
    });

    test('should generate regulatory report', () => {
      const report = kycModule.generateRegulatoryReport({
        reportPeriod: 'MONTHLY',
        includeStatistics: true
      });

      expect(report).toBeDefined();
      expect(report.reportType).toBe('REGULATORY_COMPLIANCE');
      expect(report.reportPeriod).toBe('MONTHLY');
      expect(report.summary).toBeDefined();
      expect(report.statistics).toBeDefined();
    });

    test('should get KYC metrics', () => {
      const metrics = kycModule.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalKYCProcesses).toBeDefined();
      expect(metrics.completedKYC).toBeDefined();
      expect(metrics.failedKYC).toBeDefined();
    });
  });

  describe('IdentityVerifier', () => {
    test('should verify identity with multiple documents', async () => {
      const verifier = new IdentityVerifier();
      const customerId = 'CUST_004';
      const customerData = {
        name: 'ALICE JOHNSON',
        dateOfBirth: '25/12/1992'
      };

      const documents = [
        {
          documentType: DocumentType.AADHAAR,
          documentNumber: '123456789012',
          issuingAuthority: 'UIDAI',
          expiryDate: null,
          documentInput: Buffer.from('mock-document'),
          extractedData: {
            name: 'ALICE JOHNSON',
            aadhaarNumber: '123456789012'
          }
        }
      ];

      const results = await verifier.verifyIdentity(customerId, customerData, documents);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      expect(results[0].documentType).toBe(DocumentType.AADHAAR);
      expect(results[0].verificationStatus).toBeDefined();
    });
  });

  describe('RiskScorer', () => {
    test('should assess risk for customer', async () => {
      const riskScorer = new RiskScorer();
      const customerId = 'CUST_005';
      const customerData = {
        name: 'CHARLIE BROWN',
        dateOfBirth: '05/08/1985',
        nationality: 'INDIAN',
        addresses: [{ street: '456 Oak St', city: 'Delhi' }]
      };

      const verificationResults = [
        {
          documentType: DocumentType.PAN,
          verificationStatus: VerificationStatus.VERIFIED,
          validationResult: {
            isValid: true,
            confidence: 90
          }
        }
      ];

      const riskAssessment = await riskScorer.assessRisk(customerId, customerData, verificationResults);

      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.customerId).toBe(customerId);
      expect(riskAssessment.riskScore).toBeDefined();
      expect(riskAssessment.riskLevel).toBeDefined();
      expect(riskAssessment.riskFlags).toBeDefined();
      expect(Array.isArray(riskAssessment.riskFlags)).toBe(true);
    });

    test('should identify high risk for politically exposed person', async () => {
      const riskScorer = new RiskScorer();
      const customerId = 'CUST_006';
      const customerData = {
        name: 'DAVID MILLER',
        dateOfBirth: '15/03/1980',
        nationality: 'INDIAN',
        isPoliticallyExposed: true
      };

      const verificationResults = [
        {
          documentType: DocumentType.PASSPORT,
          verificationStatus: VerificationStatus.VERIFIED,
          validationResult: {
            isValid: true,
            confidence: 85
          }
        }
      ];

      const riskAssessment = await riskScorer.assessRisk(customerId, customerData, verificationResults);

      expect(riskAssessment.riskScore).toBeGreaterThan(40);
      expect(riskAssessment.riskFlags).toContain('Politically exposed person');
    });
  });

  describe('ComplianceReporter', () => {
    test('should generate KYC status report', () => {
      const reporter = new ComplianceReporter();
      const customerId = 'CUST_007';
      const kycRecord = {
        customerId,
        status: KYCStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        verificationResults: [
          {
            documentType: DocumentType.AADHAAR,
            verificationStatus: VerificationStatus.VERIFIED
          }
        ],
        riskAssessment: {
          riskScore: 25,
          riskLevel: 'LOW',
          riskFlags: []
        },
        finalDecision: {
          approved: true,
          recommendation: 'APPROVE'
        },
        documents: [
          {
            documentType: DocumentType.AADHAAR,
            documentNumber: '123456789012'
          }
        ]
      };

      const report = reporter.generateKYCStatusReport(customerId, kycRecord);

      expect(report).toBeDefined();
      expect(report.reportType).toBe('KYC_STATUS');
      expect(report.customerId).toBe(customerId);
      expect(report.verificationSummary).toBeDefined();
      expect(report.riskAssessment).toBeDefined();
    });

    test('should generate regulatory report', () => {
      const reporter = new ComplianceReporter();
      const report = reporter.generateRegulatoryReport({
        reportPeriod: 'QUARTERLY',
        includeStatistics: true,
        includeDetails: false
      });

      expect(report).toBeDefined();
      expect(report.reportType).toBe('REGULATORY_COMPLIANCE');
      expect(report.reportPeriod).toBe('QUARTERLY');
      expect(report.summary).toBeDefined();
      expect(report.statistics).toBeDefined();
    });

    test('should submit report', async () => {
      const reporter = new ComplianceReporter();
      const customerId = 'CUST_008';
      const kycRecord = {
        customerId,
        status: KYCStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        verificationResults: [],
        riskAssessment: { riskScore: 20, riskLevel: 'LOW', riskFlags: [] },
        finalDecision: { approved: true },
        documents: []
      };

      const report = reporter.generateKYCStatusReport(customerId, kycRecord);
      const submissionResult = await reporter.submitReport(report.reportId);

      expect(submissionResult).toBeDefined();
      expect(submissionResult.status).toBe('SUBMITTED');
      expect(submissionResult.submissionId).toBeDefined();
      expect(submissionResult.acknowledgment).toBeDefined();
    });

    test('should maintain audit trail', () => {
      const reporter = new ComplianceReporter();
      const customerId = 'CUST_009';
      const kycRecord = {
        customerId,
        status: KYCStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        verificationResults: [],
        riskAssessment: { riskScore: 30, riskLevel: 'LOW', riskFlags: [] },
        finalDecision: { approved: true },
        documents: []
      };

      reporter.generateKYCStatusReport(customerId, kycRecord);
      const auditTrail = reporter.getAuditTrail({ customerId });

      expect(auditTrail).toBeDefined();
      expect(Array.isArray(auditTrail)).toBe(true);
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0].action).toBe('REPORT_GENERATED');
    });

    test('should get compliance metrics', () => {
      const reporter = new ComplianceReporter();
      const metrics = reporter.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalReports).toBeDefined();
      expect(metrics.submittedReports).toBeDefined();
      expect(metrics.pendingReports).toBeDefined();
      expect(metrics.auditTrailSize).toBeDefined();
    });
  });
});
