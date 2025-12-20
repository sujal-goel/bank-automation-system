const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/auth';

// Test data for customer
const testCustomer = {
  email: 'testcustomer@bank.com',
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

// Test data for employee
const testEmployee = {
  email: 'testemployee2@bank.com',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  firstName: 'Bob',
  lastName: 'Employee',
  phoneNumber: '+1234567893',
  dateOfBirth: '1988-08-15',
  employeeId: 'EMP998',
  department: 'Compliance',
  position: 'Compliance Officer',
  startDate: '2024-02-01'
};

async function makeRequest(endpoint, method = 'POST', data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`\n${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return { response, result };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    return { error };
  }
}

async function testEmailVerificationFlow() {
  console.log('='.repeat(70));
  console.log('BANKING SYSTEM EMAIL VERIFICATION FLOW TEST');
  console.log('='.repeat(70));

  // Test 1: Customer Signup with Email Verification
  console.log('\n1. TESTING CUSTOMER SIGNUP WITH EMAIL VERIFICATION');
  console.log('-'.repeat(50));
  const customerResult = await makeRequest('/signup/customer', 'POST', testCustomer);
  
  let customerToken = null;
  if (customerResult.result && customerResult.result.success) {
    customerToken = customerResult.result.verificationToken;
    console.log('✅ Customer signup successful');
    console.log('📧 Verification email would be sent to:', testCustomer.email);
    console.log('🔗 Verification token:', customerToken);
  }

  // Test 2: Employee Signup with Email Verification
  console.log('\n2. TESTING EMPLOYEE SIGNUP WITH EMAIL VERIFICATION');
  console.log('-'.repeat(50));
  const employeeResult = await makeRequest('/signup/employee', 'POST', testEmployee);
  
  let employeeToken = null;
  if (employeeResult.result && employeeResult.result.success) {
    employeeToken = employeeResult.result.verificationToken;
    console.log('✅ Employee signup successful');
    console.log('📧 Verification email would be sent to:', testEmployee.email);
    console.log('🔗 Verification token:', employeeToken);
  }

  // Test 3: Verify Customer Email
  if (customerToken) {
    console.log('\n3. TESTING CUSTOMER EMAIL VERIFICATION');
    console.log('-'.repeat(50));
    const verifyResult = await makeRequest('/verify-email', 'POST', {
      token: customerToken
    });
    
    if (verifyResult.result && verifyResult.result.success) {
      console.log('✅ Customer email verified successfully');
      console.log('🎉 Customer account is now active');
      console.log('📧 Welcome email would be sent');
    }
  }

  // Test 4: Verify Employee Email (but still needs admin approval)
  if (employeeToken) {
    console.log('\n4. TESTING EMPLOYEE EMAIL VERIFICATION');
    console.log('-'.repeat(50));
    const verifyResult = await makeRequest('/verify-email', 'POST', {
      token: employeeToken
    });
    
    if (verifyResult.result && verifyResult.result.success) {
      console.log('✅ Employee email verified successfully');
      console.log('⏳ Employee account still needs admin approval');
    }
  }

  // Test 5: Admin Login and Employee Approval
  console.log('\n5. TESTING ADMIN LOGIN FOR EMPLOYEE APPROVAL');
  console.log('-'.repeat(50));
  const loginResult = await makeRequest('/login', 'POST', {
    email: 'admin@bank.com',
    password: 'Admin@123'
  });

  let adminToken = null;
  if (loginResult.result && loginResult.result.success) {
    adminToken = loginResult.result.token;
    console.log('✅ Admin login successful');
  }

  // Test 6: Get Pending Approvals
  if (adminToken) {
    console.log('\n6. TESTING GET PENDING APPROVALS');
    console.log('-'.repeat(50));
    const approvalsResult = await makeRequest('/pending-approvals', 'GET', null, adminToken);
    
    if (approvalsResult.result && approvalsResult.result.success) {
      const pendingUsers = approvalsResult.result.pendingApprovals;
      console.log(`📋 Found ${pendingUsers.length} pending approvals`);
      
      // Find our test employee
      const testEmployeeUser = pendingUsers.find(u => u.email === testEmployee.email);
      if (testEmployeeUser) {
        console.log('👤 Found test employee in pending approvals');
        
        // Test 7: Approve Employee
        console.log('\n7. TESTING EMPLOYEE APPROVAL');
        console.log('-'.repeat(50));
        const approvalResult = await makeRequest(
          `/users/${testEmployeeUser.id}/approve`, 
          'POST', 
          {}, 
          adminToken
        );
        
        if (approvalResult.result && approvalResult.result.success) {
          console.log('✅ Employee approved successfully');
          console.log('📧 Approval notification email would be sent');
          console.log('🎉 Employee can now login to the system');
        }
      }
    }
  }

  // Test 8: Test Password Reset Flow
  console.log('\n8. TESTING PASSWORD RESET FLOW');
  console.log('-'.repeat(50));
  const resetResult = await makeRequest('/password-reset/request', 'POST', {
    email: testCustomer.email
  });
  
  if (resetResult.result && resetResult.result.success) {
    console.log('✅ Password reset request successful');
    console.log('📧 Password reset email would be sent');
    console.log('🔗 Reset token:', resetResult.result.resetToken);
  }

  // Test 9: Test Invalid Token Verification
  console.log('\n9. TESTING INVALID TOKEN VERIFICATION');
  console.log('-'.repeat(50));
  await makeRequest('/verify-email', 'POST', {
    token: 'invalid-token-12345'
  });

  console.log('\n' + '='.repeat(70));
  console.log('EMAIL VERIFICATION FLOW TEST COMPLETED');
  console.log('='.repeat(70));
  
  console.log('\n📧 EMAIL NOTIFICATIONS SUMMARY:');
  console.log('- Customer verification email sent');
  console.log('- Employee verification email sent');
  console.log('- Customer welcome email sent (after verification)');
  console.log('- Employee approval notification sent (after admin approval)');
  console.log('- Password reset email sent');
  
  console.log('\n🌐 WEB INTERFACE:');
  console.log('- Visit http://localhost:3000/signup-demo for signup forms');
  console.log('- Visit http://localhost:3000/verify-email?token=<TOKEN> for email verification');
  
  console.log('\n📝 NOTE:');
  console.log('In development mode, emails are logged to console instead of being sent.');
  console.log('In production, configure SMTP settings to send actual emails.');
}

// Run the test
if (require.main === module) {
  testEmailVerificationFlow().catch(console.error);
}

module.exports = { testEmailVerificationFlow };