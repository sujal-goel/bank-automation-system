// Integration test for AML Module with Banking System
// Requirements: 3.2, 3.3, 3.4, 6.4

const { v4: uuidv4 } = require('uuid');
const { AMLModule } = require('../modules/aml');
const { Transaction, Customer } = require('../shared/interfaces');
const { TransactionType, Currency } = require('../shared/types');

describe('AML Integration Tests', () => {
  let amlModule;

  beforeEach(() => {
    amlModule = new AMLModule({
      suspiciousAmountThreshold: 10000,
      rapidTransactionThreshold: 3,
      rapidTransactionWindow: 3600000,
      highRiskCountries: ['KP', 'IR', 'SY'],
      notificationConfig: {
        enableEmail: true,
        enableSMS: false,
        enablePush: false
      }
    });
  });

  test('should integrate with transaction processing workflow', async () => {
    // Create a customer
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

    // Create a normal transaction (avoid round amounts that trigger unusual pattern detection)
    const normalTransaction = new Transaction(
      uuidv4(),
      4567, // Non-round amount
      Currency.USD,
      TransactionType.DEPOSIT, // Use deposit instead of withdrawal to avoid unusual pattern
      'Regular deposit'
    );

    // Screen the normal transaction
    const normalResult = await amlModule.screenTransaction(normalTransaction, customer);

    expect(normalResult.success).toBe(true);
    expect(normalResult.suspicious).toBe(false);
    expect(normalResult.flags).toHaveLength(0);
    expect(normalResult.riskScore).toBe(0);

    // Create a suspicious transaction (large amount)
    const suspiciousTransaction = new Transaction(
      uuidv4(),
      15000, // Above threshold
      Currency.USD,
      TransactionType.WITHDRAWAL,
      'Large cash withdrawal'
    );

    // Screen the suspicious transaction
    const suspiciousResult = await amlModule.screenTransaction(suspiciousTransaction, customer);

    expect(suspiciousResult.success).toBe(true);
    expect(suspiciousResult.suspicious).toBe(true);
    expect(suspiciousResult.flags).toContain('LARGE_AMOUNT');
    expect(suspiciousResult.riskScore).toBeGreaterThan(0);
    expect(suspiciousResult.requiresReview).toBe(true);

    // Verify AML flags were added to transaction
    expect(suspiciousTransaction.amlFlags).toContain('LARGE_AMOUNT');
  });

  test('should handle high-risk customer scenario', async () => {
    // Create a high-risk customer (from sanctioned country)
    const highRiskCustomer = new Customer({
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

    // Even a small transaction should be flagged
    const transaction = new Transaction(
      uuidv4(),
      2000,
      Currency.USD,
      TransactionType.TRANSFER,
      'International transfer'
    );

    const result = await amlModule.screenTransaction(transaction, highRiskCustomer);

    expect(result.success).toBe(true);
    expect(result.suspicious).toBe(true);
    expect(result.flags).toContain('HIGH_RISK_COUNTRY');
    expect(result.riskScore).toBeGreaterThan(50);
    expect(result.requiresReview).toBe(true);
  });

  test('should detect structuring patterns', async () => {
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

    // Create a transaction just below the reporting threshold (structuring)
    const structuringTransaction = new Transaction(
      uuidv4(),
      9500, // Just below $10,000 threshold
      Currency.USD,
      TransactionType.DEPOSIT,
      'Cash deposit'
    );

    const result = await amlModule.screenTransaction(structuringTransaction, customer);

    expect(result.success).toBe(true);
    expect(result.suspicious).toBe(true);
    expect(result.flags).toContain('STRUCTURING');
    expect(result.riskScore).toBeGreaterThan(50);
  });

  test('should track AML statistics across multiple transactions', async () => {
    const customer = new Customer({
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'US',
      address: {
        street: '123 Test St',
        city: 'Test City',
        country: 'US'
      },
      contactInfo: {
        email: 'test@example.com',
        phone: '+1234567890'
      }
    });

    const initialStats = amlModule.getStatistics();

    // Process multiple transactions
    const transactions = [
      { amount: 5000, suspicious: false },
      { amount: 15000, suspicious: true }, // Large amount
      { amount: 3000, suspicious: false },
      { amount: 9500, suspicious: true }   // Structuring
    ];

    for (const txData of transactions) {
      const transaction = new Transaction(
        uuidv4(),
        txData.amount,
        Currency.USD,
        TransactionType.TRANSFER,
        'Test transaction'
      );

      await amlModule.screenTransaction(transaction, customer);
    }

    const finalStats = amlModule.getStatistics();

    expect(finalStats.totalTransactionsScreened).toBe(initialStats.totalTransactionsScreened + 4);
    expect(finalStats.flaggedTransactions).toBeGreaterThan(initialStats.flaggedTransactions);
    expect(parseFloat(finalStats.flagRate)).toBeGreaterThan(0);
  });

  test('should handle transaction with sanctioned counterparty', async () => {
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

    // Transaction to sanctioned entity
    const sanctionedTransaction = new Transaction(
      uuidv4(),
      5000,
      Currency.USD,
      TransactionType.TRANSFER,
      'Transfer to sanctioned entity',
      { name: 'SANCTIONED_PERSON_1' } // Counterparty on sanctions list
    );

    const result = await amlModule.screenTransaction(sanctionedTransaction, customer);

    expect(result.success).toBe(true);
    expect(result.suspicious).toBe(true);
    expect(result.sanctionHit).toBe(true);
    expect(result.flags).toContain('SANCTION_HIT');
    expect(result.riskScore).toBe(100); // Maximum risk score for sanction hit
    expect(result.requiresReview).toBe(true);
  });
});