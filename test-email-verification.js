const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/auth';

// Test data for customer
const testCustomer = {
  email: 'Kg3464@gmail.com',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  firstName: 'Jane',
  lastName: 'Customer',
  phoneNumber: '+1234567892',
  dateOfBirth: '1992-05-20',
  address: {
    street: '456 Test Avenue',
    city: 'Test City',
    state: 'TS',
    zipCode: '54321',
    country: 'USA'
  },
  occupation: 'Designer',
  annualIncome: 65000,
  identificationNumber: '987-65-4321',
  identificationType: 'ssn'
};

const res = fetch(`${BASE_URL}/`)