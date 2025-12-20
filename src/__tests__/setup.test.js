// Basic setup validation test

const { Customer, Account, Transaction } = require('../shared/interfaces');
const { AccountType, Currency, TransactionType } = require('../shared/types');

describe('Project Setup Validation', () => {
  test('should create basic data structures', () => {
    // Test Customer creation
    const personalInfo = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'US',
      address: { street: '123 Main St', city: 'New York', country: 'US' },
      contactInfo: { email: 'john@example.com', phone: '+1234567890' }
    };
    
    const customer = new Customer(personalInfo);
    expect(customer.customerId).toBeDefined();
    expect(customer.personalInfo.firstName).toBe('John');
    
    // Test Account creation
    const account = new Account(customer.customerId, AccountType.SAVINGS, Currency.USD);
    expect(account.accountId).toBeDefined();
    expect(account.customerId).toBe(customer.customerId);
    expect(account.accountType).toBe(AccountType.SAVINGS);
    expect(account.accountNumber).toMatch(/^1000\d{9}$/);
    
    // Test Transaction creation
    const transaction = new Transaction(
      account.accountId,
      1000.00,
      Currency.USD,
      TransactionType.DEPOSIT,
      'Initial deposit',
      null
    );
    expect(transaction.transactionId).toBeDefined();
    expect(transaction.amount).toBe(1000.00);
    expect(transaction.transactionType).toBe(TransactionType.DEPOSIT);
  });

  test('should have all required enums', () => {
    expect(AccountType.SAVINGS).toBe('SAVINGS');
    expect(Currency.USD).toBe('USD');
    expect(TransactionType.DEPOSIT).toBe('DEPOSIT');
  });
});