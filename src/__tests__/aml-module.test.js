// Unit tests for AML Module
// Requirements: 3.2, 3.3, 3.4, 6.4

const { v4: uuidv4 } = require('uuid');
const { 
  AMLModule,
  TransactionMonitor,
  PatternDetector,
  SanctionScreener,
  SARGenerator
} = require('../modules/aml');
const { Transaction, Customer } = require('../shared/interfaces');
const { TransactionType, Currency } = require('../shared/types');

describe('AML Module', () => {
  describe('AMLModule', () => {
    let amlModule;

    beforeEach(() => {
      amlModule = new AMLModule({
        suspiciousAmountThreshold: 10000,
        rapidTransactionThreshold: 5,
        rapidTransactionWindow: 3600000,
        highRiskCountries: ['KP', 'IR', 'SY']
      });
    });

    test('should screen transaction successfully', async () => {
      const transaction = new Transaction(
        uuidv4(),
        5000,
        Currency.USD,
        TransactionType.TRANSFER,
        'Test transfer'
      );

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
          email: 'john.doe@example.com',
          phone: '+1234567890'
        }
      });

      const result = await amlModule.screenTransaction(transaction, customer);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(transaction.transactionId);
      expect(result.screened).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    test('should flag large amount transactions', async () => {
      const transaction = new Transaction(
        uuidv4(),
        15000, // Above threshold
        Currency.USD,
        TransactionType.WITHDRAWAL,
        'Large withdrawal'
      );

      const customer = new Customer({
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1985-05-15'),
        nationality: 'US',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          country: 'US'
        },
        contactInfo: {
          email: 'jane.smith@example.com',
          phone: '+1987654321'
        }
      });

      const result = await amlModule.screenTransaction(transaction, customer);

      expect(result.success).toBe(true);
      expect(result.suspicious).toBe(true);
      expect(result.flags).toContain('LARGE_AMOUNT');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    test('should flag high-risk country transactions', async () => {
      const transaction = new Transaction(
        uuidv4(),
        5000,
        Currency.USD,
        TransactionType.TRANSFER,
        'International transfer'
      );

      const customer = new Customer({
        firstName: 'Ahmad',
        lastName: 'Hassan',
        dateOfBirth: new Date('1980-03-20'),
        nationality: 'IR', // High-risk country
        address: {
          street: '789 Desert Rd',
          city: 'Tehran',
          country: 'IR'
        },
        contactInfo: {
          email: 'ahmad.hassan@example.com',
          phone: '+98123456789'
        }
      });

      const result = await amlModule.screenTransaction(transaction, customer);

      expect(result.success).toBe(true);
      expect(result.suspicious).toBe(true);
      expect(result.flags).toContain('HIGH_RISK_COUNTRY');
      expect(result.riskScore).toBeGreaterThan(50);
    });

    test('should return statistics', () => {
      const stats = amlModule.getStatistics();

      expect(stats).toHaveProperty('totalTransactionsScreened');
      expect(stats).toHaveProperty('flaggedTransactions');
      expect(stats).toHaveProperty('sarsGenerated');
      expect(stats).toHaveProperty('sanctionHits');
      expect(stats).toHaveProperty('flagRate');
    });
  });

  describe('TransactionMonitor', () => {
    let monitor;

    beforeEach(() => {
      monitor = new TransactionMonitor({
        suspiciousAmountThreshold: 10000,
        rapidTransactionThreshold: 3,
        rapidTransactionWindow: 3600000 // 1 hour
      });
    });

    test('should detect large amounts', async () => {
      const transaction = new Transaction(
        uuidv4(),
        12000,
        Currency.USD,
        TransactionType.WITHDRAWAL,
        'Large withdrawal'
      );

      const customer = { customerId: uuidv4() };

      const result = await monitor.monitor(transaction, customer);

      expect(result.suspicious).toBe(true);
      expect(result.flags).toContain('LARGE_AMOUNT');
    });

    test('should track transaction history', async () => {
      const customerId = uuidv4();
      const customer = { customerId };

      // Add multiple transactions
      for (let i = 0; i < 4; i++) {
        const transaction = new Transaction(
          uuidv4(),
          1000,
          Currency.USD,
          TransactionType.TRANSFER,
          `Transfer ${i}`
        );
        await monitor.monitor(transaction, customer);
      }

      // After monitoring 4 transactions, they should be in history
      const recentTransactions = monitor.getRecentTransactions(customerId);
      expect(recentTransactions.length).toBe(4);
    });
  });

  describe('PatternDetector', () => {
    let detector;

    beforeEach(() => {
      detector = new PatternDetector({
        suspiciousAmountThreshold: 10000
      });
    });

    test('should detect structuring patterns', async () => {
      const transaction = new Transaction(
        uuidv4(),
        9500, // Just below $10,000 threshold
        Currency.USD,
        TransactionType.DEPOSIT,
        'Cash deposit'
      );

      const customer = { customerId: uuidv4() };

      const result = await detector.detect(transaction, customer);

      expect(result.suspicious).toBe(true);
      expect(result.flags).toContain('STRUCTURING');
    });

    test('should detect unusual patterns', async () => {
      const transaction = new Transaction(
        uuidv4(),
        10000, // Round amount
        Currency.USD,
        TransactionType.WITHDRAWAL,
        'Cash withdrawal'
      );

      const customer = { customerId: uuidv4() };

      const result = await detector.detect(transaction, customer);

      expect(result.suspicious).toBe(true);
      expect(result.flags).toContain('UNUSUAL_PATTERN');
    });
  });

  describe('SanctionScreener', () => {
    let screener;

    beforeEach(() => {
      screener = new SanctionScreener({
        highRiskCountries: ['KP', 'IR', 'SY']
      });
    });

    test('should screen against sanction lists', async () => {
      const transaction = new Transaction(
        uuidv4(),
        5000,
        Currency.USD,
        TransactionType.TRANSFER,
        'Transfer to sanctioned entity',
        { name: 'SANCTIONED_PERSON_1' }
      );

      const customer = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          nationality: 'US'
        }
      };

      const result = await screener.screen(transaction, customer);

      expect(result.hit).toBe(true);
      expect(result.flags).toContain('SANCTION_HIT');
    });

    test('should flag high-risk countries', async () => {
      const transaction = new Transaction(
        uuidv4(),
        5000,
        Currency.USD,
        TransactionType.TRANSFER,
        'International transfer'
      );

      const customer = {
        personalInfo: {
          firstName: 'Ahmad',
          lastName: 'Hassan',
          nationality: 'IR'
        }
      };

      const result = await screener.screen(transaction, customer);

      expect(result.hit).toBe(true);
      expect(result.flags).toContain('HIGH_RISK_COUNTRY');
    });
  });

  describe('SARGenerator', () => {
    let generator;

    beforeEach(() => {
      generator = new SARGenerator();
    });

    test('should generate SAR for suspicious transaction', async () => {
      const transaction = new Transaction(
        uuidv4(),
        15000,
        Currency.USD,
        TransactionType.WITHDRAWAL,
        'Large cash withdrawal'
      );

      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const flags = ['LARGE_AMOUNT', 'STRUCTURING'];

      const sar = await generator.generate(transaction, customer, flags);

      expect(sar).toHaveProperty('sarId');
      expect(sar).toHaveProperty('transactionId', transaction.transactionId);
      expect(sar).toHaveProperty('customerId', customer.customerId);
      expect(sar.flags).toEqual(flags);
      expect(sar.status).toBe('FILED');
      expect(sar.description).toContain('Suspicious activity detected');
    });

    test('should store and retrieve SARs', async () => {
      const transaction = new Transaction(
        uuidv4(),
        12000,
        Currency.USD,
        TransactionType.TRANSFER,
        'Suspicious transfer'
      );

      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'Jane',
          lastName: 'Smith'
        }
      };

      const flags = ['LARGE_AMOUNT'];

      const sar = await generator.generate(transaction, customer, flags);
      const retrievedSAR = generator.getSAR(sar.sarId);

      expect(retrievedSAR).toEqual(sar);
    });

    test('should get all SARs', async () => {
      const initialCount = generator.getAllSARs().length;

      // Generate a SAR
      const transaction = new Transaction(
        uuidv4(),
        11000,
        Currency.USD,
        TransactionType.WITHDRAWAL,
        'Test transaction'
      );

      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'Test',
          lastName: 'User'
        }
      };

      await generator.generate(transaction, customer, ['LARGE_AMOUNT']);

      const allSARs = generator.getAllSARs();
      expect(allSARs.length).toBe(initialCount + 1);
    });
  });
});