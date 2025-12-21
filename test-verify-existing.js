const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/auth';

async function testVerification() {
  console.log('Testing Email Verification with Existing Tokens\n');
  
  // Test customer verification
  const customerToken = 'cb137267-45b9-40eb-a883-463d19b2f8bb';
  console.log('1. Verifying customer email...');
  console.log('Token:', customerToken);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customerToken })
    });
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Customer email verified successfully!');
      console.log('📧 Welcome email would be sent to:', result.user.email);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test employee verification
  const employeeToken = '70573bdd-2ce2-4351-8283-72fcfcb0ec3b';
  console.log('2. Verifying employee email...');
  console.log('Token:', employeeToken);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: employeeToken })
    });
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Employee email verified successfully!');
      console.log('⏳ Employee still needs admin approval');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Now test employee approval
  console.log('3. Admin login and employee approval...');
  
  try {
    // Login as admin
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bank.com',
        password: 'Admin@123'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (loginResult.success) {
      console.log('✅ Admin logged in successfully');
      const adminToken = loginResult.token;
      
      // Get pending approvals
      const approvalsResponse = await fetch(`${BASE_URL}/pending-approvals`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      const approvalsResult = await approvalsResponse.json();
      console.log('\nPending approvals:', JSON.stringify(approvalsResult, null, 2));
      
      if (approvalsResult.success && approvalsResult.pendingApprovals.length > 0) {
        const employeeToApprove = approvalsResult.pendingApprovals.find(
          u => u.email === 'testemployee@bank.com'
        );
        
        if (employeeToApprove) {
          console.log('\n4. Approving employee...');
          const approveResponse = await fetch(
            `${BASE_URL}/users/${employeeToApprove.id}/approve`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const approveResult = await approveResponse.json();
          console.log('Approval response:', JSON.stringify(approveResult, null, 2));
          
          if (approveResult.success) {
            console.log('✅ Employee approved successfully!');
            console.log('📧 Approval notification email would be sent');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Email Verification Test Complete!');
  console.log('='.repeat(60));
}

testVerification();