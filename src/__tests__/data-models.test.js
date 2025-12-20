// Data Models Validation Tests

const { v4: uuidv4 } = require('uuid');
const { Customer, Account, Transaction, LoanApplication, AuditLog, PersonalInformation, IdentityDocument } = require('../shared/interfaces');
const { AccountType, Currency, TransactionType, LoanType, DocumentType } = require('../shared/types');
const { validators } = require('../shared/validation');

describe('Banking Data Models', () => {
  
  describe('Customer Model', () => {
    const validPersonalInfo = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'US',
      address: {
        street: '123 Main St',
        city: 'New York',
        country: 'US'
      },
      contactInfo: {
        email: 'john.doe@example.com',
        phone: '+1234567890'
      }
    };

    test('should create valid customer', () => {
      const customer = new Customer(validPersonalInfo);
      
      expect(customer.customerId).toBeDefined();
      expect(customer.personalInfo.firstName).toBe('John');
      expect(customer.personalInfo.lastName).toBe('Doe');
      expect(customer.identityDocuments).toEqual([]);
      expect(customer.accounts).toEqual([]);
      expect(customer.validate()).toBe(true);
    });

    test('should reject invalid personal info', () => {
      const invalidPersonalInfo = {
        firstName: '', // Invalid: empty string
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'invalid-email', // Invalid email
          phone: '+1234567890'
        }
      };

      expect(() => new Customer(invalidPersonalInfo)).toThrow();
    });

    test('should add identity document', () => {
      const customer = new Customer(validPersonalInfo);
      const document = customer.addIdentityDocument({
        documentType: DocumentType.PASSPORT,
        documentNumber: 'P123456789',
        issuingAuthority: 'US State Department',
        expiryDate: new Date('2030-01-01')
      });

      expect(customer.identityDocuments).toHaveLength(1);
      expect(document.documentType).toBe(DocumentType.PASSPORT);
    });
  });

  describe('Account Model', () => {
    test('should create valid account', () => {
      const customerId = uuidv4();
      const account = new Account(customerId, AccountType.SAVINGS, Currency.USD);
      
      expect(account.accountId).toBeDefined();
      expect(account.customerId).toBe(customerId);
      expect(account.accountType).toBe(AccountType.SAVINGS);
      expect(account.accountNumber).toMatch(/^1000\d{9}$/);
      expect(account.balance).toBe(0.0);
      expect(account.currency).toBe(Currency.USD);
      expect(account.validate()).toBe(true);
    });

    test('should update balance correctly', () => {
      const account = new Account(uuidv4(), AccountType.CHECKING);
      
      account.updateBalance(100.50);
      expect(account.balance).toBe(100.50);
      
      account.updateBalance(-25.25);
      expect(account.balance).toBe(75.25);
    });

    test('should close account', () => {
      const account = new Account(uuidv4(), AccountType.SAVINGS);
      account.close();
      
      expect(account.status).toBe('CLOSED');
      expect(account.closingDate).toBeDefined();
    });

    test('should reject invalid balance update', () => {
      const account = new Account(uuidv4(), AccountType.SAVINGS);
      
      expect(() => account.updateBalance('invalid')).toThrow('Amount must be a number');
    });
  });

  describe('Transaction Model', () => {
    test('should create valid transaction', () => {
      const transaction = new Transaction(
        uuidv4(),
        1000.00,
        Currency.USD,
        TransactionType.DEPOSIT,
        'Initial deposit'
      );
      
      expect(transaction.transactionId).toBeDefined();
      expect(transaction.accountId).toBeDefined();
      expect(transaction.amount).toBe(1000.00);
      expect(transaction.status).toBe('PENDING');
      expect(transaction.validate()).toBe(true);
    });

    test('should process transaction', () => {
      const transaction = new Transaction(
        uuidv4(),
        500.00,
        Currency.USD,
        TransactionType.WITHDRAWAL,
        'ATM withdrawal'
      );
      
      transaction.process();
      expect(transaction.status).toBe('COMPLETED');
      expect(transaction.processedAt).toBeDefined();
    });

    test('should fail transaction', () => {
      const transaction = new Transaction(
        uuidv4(),
        1000.00,
        Currency.USD,
        TransactionType.TRANSFER,
        'Transfer to savings'
      );
      
      transaction.fail('Insufficient funds');
      expect(transaction.status).toBe('FAILED');
      expect(transaction.description).toContain('Failed: Insufficient funds');
    });

    test('should add AML flags', () => {
      const transaction = new Transaction(
        uuidv4(),
        10000.00,
        Currency.USD,
        TransactionType.DEPOSIT,
        'Large cash deposit'
      );
      
      transaction.addAMLFlag('LARGE_CASH_TRANSACTION');
      transaction.addAMLFlag('SUSPICIOUS_PATTERN');
      
      expect(transaction.amlFlags).toContain('LARGE_CASH_TRANSACTION');
      expect(transaction.amlFlags).toContain('SUSPICIOUS_PATTERN');
      expect(transaction.amlFlags).toHaveLength(2);
      
      // Should not add duplicate flags
      transaction.addAMLFlag('LARGE_CASH_TRANSACTION');
      expect(transaction.amlFlags).toHaveLength(2);
    });

    test('should reject invalid transaction amount', () => {
      expect(() => new Transaction(
        uuidv4(),
        -100.00, // Negative amount
        Currency.USD,
        TransactionType.DEPOSIT,
        'Invalid deposit'
      )).toThrow();
    });
  });

  describe('Loan Application Model', () => {
    test('should create valid loan application', () => {
      const loanApp = new LoanApplication(
        uuidv4(),
        LoanType.PERSONAL,
        50000.00,
        'Home renovation'
      );
      
      expect(loanApp.applicationId).toBeDefined();
      expect(loanApp.customerId).toBeDefined();
      expect(loanApp.loanType).toBe(LoanType.PERSONAL);
      expect(loanApp.requestedAmount).toBe(50000.00);
      expect(loanApp.status).toBe('SUBMITTED');
      expect(loanApp.validate()).toBe(true);
    });

    test('should add documents', () => {
      const loanApp = new LoanApplication(
        uuidv4(),
        LoanType.HOME,
        200000.00,
        'Purchase primary residence'
      );
      
      const doc = loanApp.addDocument('INCOME_PROOF', 'salary_certificate.pdf');
      
      expect(loanApp.documents).toHaveLength(1);
      expect(doc.documentType).toBe('INCOME_PROOF');
      expect(doc.fileName).toBe('salary_certificate.pdf');
      expect(doc.verified).toBe(false);
    });

    test('should set credit score', () => {
      const loanApp = new LoanApplication(
        uuidv4(),
        LoanType.AUTO,
        25000.00,
        'Vehicle purchase'
      );
      
      loanApp.setCreditScore(750);
      expect(loanApp.creditScore).toBe(750);
    });

    test('should reject invalid credit score', () => {
      const loanApp = new LoanApplication(
        uuidv4(),
        LoanType.PERSONAL,
        10000.00,
        'Personal expenses'
      );
      
      expect(() => loanApp.setCreditScore(200)).toThrow('Credit score must be between 300 and 850');
      expect(() => loanApp.setCreditScore(900)).toThrow('Credit score must be between 300 and 850');
    });

    test('should make loan decision', () => {
      const loanApp = new LoanApplication(
        uuidv4(),
        LoanType.BUSINESS,
        100000.00,
        'Business expansion'
      );
      
      loanApp.makeDecision(true, 80000.00, 5.5, '5 years', 'Good credit history');
      
      expect(loanApp.decision.approved).toBe(true);
      expect(loanApp.decision.approvedAmount).toBe(80000.00);
      expect(loanApp.decision.interestRate).toBe(5.5);
      expect(loanApp.status).toBe('APPROVED');
    });
  });

  describe('Audit Log Model', () => {
    test('should create valid audit log', () => {
      const auditLog = new AuditLog(
        'Account',
        uuidv4(),
        'CREATE',
        uuidv4(),
        null,
        { accountNumber: '1000123456789', balance: 0 },
        { source: 'web_portal' }
      );
      
      expect(auditLog.logId).toBeDefined();
      expect(auditLog.entityType).toBe('Account');
      expect(auditLog.action).toBe('CREATE');
      expect(auditLog.timestamp).toBeDefined();
      expect(auditLog.validate()).toBe(true);
    });
  });

  describe('Validation Edge Cases', () => {
    test('should handle enum validation', () => {
      expect(() => new Account(uuidv4(), 'INVALID_TYPE')).toThrow();
      expect(() => new Transaction(
        uuidv4(),
        100,
        'INVALID_CURRENCY',
        TransactionType.DEPOSIT,
        'Test'
      )).toThrow();
    });

    test('should validate required fields', () => {
      expect(() => new LoanApplication(
        uuidv4(),
        LoanType.PERSONAL,
        0, // Invalid: zero amount
        'Test purpose'
      )).toThrow();
    });

    test('should reject empty string fields', () => {
      expect(() => new Customer({
        firstName: '',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      })).toThrow();
    });

    test('should reject invalid email formats', () => {
      expect(() => new Customer({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'not-an-email',
          phone: '+1234567890'
        }
      })).toThrow();
    });

    test('should reject invalid phone formats', () => {
      expect(() => new Customer({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: 'invalid-phone'
        }
      })).toThrow();
    });

    test('should reject future date of birth', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      expect(() => new Customer({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: futureDate,
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      })).toThrow();
    });

    test('should reject invalid nationality code length', () => {
      expect(() => new Customer({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'USA', // Should be 2 characters
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      })).toThrow();
    });

    test('should reject invalid country code in address', () => {
      expect(() => new Customer({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA' // Should be 2 characters
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      })).toThrow();
    });

    test('should reject transaction with zero amount', () => {
      expect(() => new Transaction(
        uuidv4(),
        0,
        Currency.USD,
        TransactionType.DEPOSIT,
        'Test'
      )).toThrow();
    });

    test('should reject transaction with negative amount', () => {
      expect(() => new Transaction(
        uuidv4(),
        -100,
        Currency.USD,
        TransactionType.DEPOSIT,
        'Test'
      )).toThrow();
    });

    test('should reject transaction with empty description', () => {
      expect(() => new Transaction(
        uuidv4(),
        100,
        Currency.USD,
        TransactionType.DEPOSIT,
        ''
      )).toThrow();
    });

    test('should reject loan application with negative amount', () => {
      expect(() => new LoanApplication(
        uuidv4(),
        LoanType.PERSONAL,
        -5000,
        'Test purpose'
      )).toThrow();
    });

    test('should reject loan application with empty purpose', () => {
      expect(() => new LoanApplication(
        uuidv4(),
        LoanType.PERSONAL,
        5000,
        ''
      )).toThrow();
    });

    test('should reject account closing date before opening date', () => {
      const account = new Account(uuidv4(), AccountType.SAVINGS);
      const pastDate = new Date(account.openingDate.getTime() - 1000);
      
      account.status = 'CLOSED';
      account.closingDate = pastDate;
      
      expect(() => account.validate()).toThrow();
    });

    test('should handle boundary values for credit score', () => {
      const loanApp = new LoanApplication(
        uuidv4(),
        LoanType.PERSONAL,
        10000,
        'Test'
      );
      
      // Valid boundary values
      loanApp.setCreditScore(300);
      expect(loanApp.creditScore).toBe(300);
      
      loanApp.setCreditScore(850);
      expect(loanApp.creditScore).toBe(850);
      
      // Invalid boundary values
      expect(() => loanApp.setCreditScore(299)).toThrow();
      expect(() => loanApp.setCreditScore(851)).toThrow();
    });

    test('should handle very long strings within limits', () => {
      const longName = 'A'.repeat(50);
      const customer = new Customer({
        firstName: longName,
        lastName: longName,
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: 'B'.repeat(100),
          city: 'C'.repeat(50),
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      });
      
      expect(customer.personalInfo.firstName).toBe(longName);
    });

    test('should reject strings exceeding maximum length', () => {
      const tooLongName = 'A'.repeat(51);
      
      expect(() => new Customer({
        firstName: tooLongName,
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      })).toThrow();
    });

    test('should handle floating point precision in balances', () => {
      const account = new Account(uuidv4(), AccountType.SAVINGS);
      
      account.updateBalance(0.1);
      account.updateBalance(0.2);
      
      // Should handle floating point precision correctly
      expect(account.balance).toBeCloseTo(0.3, 2);
    });

    test('should validate all AccountType enum values', () => {
      const customerId = uuidv4();
      
      expect(() => new Account(customerId, AccountType.SAVINGS)).not.toThrow();
      expect(() => new Account(customerId, AccountType.CHECKING)).not.toThrow();
      expect(() => new Account(customerId, AccountType.BUSINESS)).not.toThrow();
      expect(() => new Account(customerId, AccountType.INVESTMENT)).not.toThrow();
    });

    test('should validate all Currency enum values', () => {
      const accountId = uuidv4();
      
      expect(() => new Transaction(accountId, 100, Currency.USD, TransactionType.DEPOSIT, 'Test')).not.toThrow();
      expect(() => new Transaction(accountId, 100, Currency.EUR, TransactionType.DEPOSIT, 'Test')).not.toThrow();
      expect(() => new Transaction(accountId, 100, Currency.INR, TransactionType.DEPOSIT, 'Test')).not.toThrow();
      expect(() => new Transaction(accountId, 100, Currency.GBP, TransactionType.DEPOSIT, 'Test')).not.toThrow();
    });

    test('should validate all TransactionType enum values', () => {
      const accountId = uuidv4();
      
      expect(() => new Transaction(accountId, 100, Currency.USD, TransactionType.DEPOSIT, 'Test')).not.toThrow();
      expect(() => new Transaction(accountId, 100, Currency.USD, TransactionType.WITHDRAWAL, 'Test')).not.toThrow();
      expect(() => new Transaction(accountId, 100, Currency.USD, TransactionType.TRANSFER, 'Test')).not.toThrow();
      expect(() => new Transaction(accountId, 100, Currency.USD, TransactionType.PAYMENT, 'Test')).not.toThrow();
      expect(() => new Transaction(accountId, 100, Currency.USD, TransactionType.FEE, 'Test')).not.toThrow();
    });

    test('should validate all LoanType enum values', () => {
      const customerId = uuidv4();
      
      expect(() => new LoanApplication(customerId, LoanType.PERSONAL, 10000, 'Test')).not.toThrow();
      expect(() => new LoanApplication(customerId, LoanType.HOME, 10000, 'Test')).not.toThrow();
      expect(() => new LoanApplication(customerId, LoanType.AUTO, 10000, 'Test')).not.toThrow();
      expect(() => new LoanApplication(customerId, LoanType.BUSINESS, 10000, 'Test')).not.toThrow();
      expect(() => new LoanApplication(customerId, LoanType.EDUCATION, 10000, 'Test')).not.toThrow();
    });

    test('should validate all DocumentType enum values', () => {
      const customer = new Customer({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      });
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      
      expect(() => customer.addIdentityDocument({
        documentType: DocumentType.PASSPORT,
        documentNumber: 'P123',
        issuingAuthority: 'Test',
        expiryDate: futureDate
      })).not.toThrow();
      
      expect(() => customer.addIdentityDocument({
        documentType: DocumentType.DRIVERS_LICENSE,
        documentNumber: 'D123',
        issuingAuthority: 'Test',
        expiryDate: futureDate
      })).not.toThrow();
      
      expect(() => customer.addIdentityDocument({
        documentType: DocumentType.NATIONAL_ID,
        documentNumber: 'N123',
        issuingAuthority: 'Test',
        expiryDate: futureDate
      })).not.toThrow();
    });

    test('should reject missing required address fields', () => {
      expect(() => new Customer({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          // Missing city
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      })).toThrow();
    });

    test('should reject missing required contact info fields', () => {
      expect(() => new Customer({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'US'
        },
        contactInfo: {
          email: 'test@example.com'
          // Missing phone
        }
      })).toThrow();
    });

    test('should handle null values appropriately', () => {
      const account = new Account(uuidv4(), AccountType.SAVINGS);
      expect(account.closingDate).toBeNull();
      
      const transaction = new Transaction(
        uuidv4(),
        100,
        Currency.USD,
        TransactionType.DEPOSIT,
        'Test',
        null
      );
      expect(transaction.counterparty).toBeNull();
      expect(transaction.processedAt).toBeNull();
    });

    test('should validate audit log with minimal data', () => {
      const auditLog = new AuditLog(
        'Account',
        uuidv4(),
        'CREATE',
        uuidv4()
      );
      
      expect(auditLog.beforeState).toBeNull();
      expect(auditLog.afterState).toBeNull();
      expect(auditLog.metadata).toEqual({});
      expect(auditLog.validate()).toBe(true);
    });

    test('should reject audit log with empty entity type', () => {
      expect(() => new AuditLog(
        '',
        uuidv4(),
        'CREATE',
        uuidv4()
      )).toThrow();
    });

    test('should reject audit log with empty action', () => {
      expect(() => new AuditLog(
        'Account',
        uuidv4(),
        '',
        uuidv4()
      )).toThrow();
    });
  });
});