const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/auth';

async function testPasswordResetFlow() {
  console.log('='.repeat(70));
  console.log('BANKING SYSTEM PASSWORD RESET FLOW TEST');
  console.log('='.repeat(70));

  // Test 1: Request password reset for existing user
  console.log('\n1. TESTING PASSWORD RESET REQUEST');
  console.log('-'.repeat(50));
  
  const resetRequestResult = await makeRequest('/password-reset/request', 'POST', {
    email: 'admin@bank.com'
  });
  
  let resetToken = null;
  if (resetRequestResult.result && resetRequestResult.result.success) {
    resetToken = resetRequestResult.result.resetToken;
    console.log('✅ Password reset request successful');
    console.log('📧 Reset email would be sent to: admin@bank.com');
    console.log('🔗 Reset token:', resetToken);
    console.log('🌐 Reset URL: http://localhost:3000/api/auth/reset-password?token=' + resetToken);
  }

  // Test 2: Request password reset for non-existent user
  console.log('\n2. TESTING PASSWORD RESET FOR NON-EXISTENT USER');
  console.log('-'.repeat(50));
  
  await makeRequest('/password-reset/request', 'POST', {
    email: 'nonexistent@example.com'
  });

  // Test 3: Confirm password reset with valid token
  if (resetToken) {
    console.log('\n3. TESTING PASSWORD RESET CONFIRMATION');
    console.log('-'.repeat(50));
    
    const resetConfirmResult = await makeRequest('/password-reset/confirm', 'POST', {
      token: resetToken,
      newPassword: 'NewSecurePass123!'
    });
    
    if (resetConfirmResult.result && resetConfirmResult.result.success) {
      console.log('✅ Password reset successful');
      console.log('🔐 Password has been changed');
      
      // Test 4: Try to login with new password
      console.log('\n4. TESTING LOGIN WITH NEW PASSWORD');
      console.log('-'.repeat(50));
      
      const loginResult = await makeRequest('/login', 'POST', {
        email: 'admin@bank.com',
        password: 'NewSecurePass123!'
      });
      
      if (loginResult.result && loginResult.result.success) {
        console.log('✅ Login successful with new password');
        console.log('👤 User:', loginResult.result.user.email);
        
        // Reset password back to original for future tests
        console.log('\n5. RESETTING PASSWORD BACK TO ORIGINAL');
        console.log('-'.repeat(50));
        
        const resetBackRequest = await makeRequest('/password-reset/request', 'POST', {
          email: 'admin@bank.com'
        });
        
        if (resetBackRequest.result && resetBackRequest.result.resetToken) {
          const resetBackConfirm = await makeRequest('/password-reset/confirm', 'POST', {
            token: resetBackRequest.result.resetToken,
            newPassword: 'Admin@123'
          });
          
          if (resetBackConfirm.result && resetBackConfirm.result.success) {
            console.log('✅ Password reset back to original');
          }
        }
      }
    }
  }

  // Test 5: Test invalid token
  console.log('\n6. TESTING INVALID RESET TOKEN');
  console.log('-'.repeat(50));
  
  await makeRequest('/password-reset/confirm', 'POST', {
    token: 'invalid-token-12345',
    newPassword: 'TestPass123!'
  });

  // Test 6: Test weak password
  if (resetToken) {
    console.log('\n7. TESTING WEAK PASSWORD VALIDATION');
    console.log('-'.repeat(50));
    
    await makeRequest('/password-reset/confirm', 'POST', {
      token: resetToken,
      newPassword: 'weak'
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('PASSWORD RESET FLOW TEST COMPLETED');
  console.log('='.repeat(70));
  
  console.log('\n🌐 PASSWORD RESET INTERFACE:');
  console.log('- Visit http://localhost:3000/api/auth/reset-password?token=<TOKEN> to test the UI');
  console.log('- The interface provides real-time password validation');
  console.log('- Visual feedback for password requirements');
  console.log('- Automatic redirect to login after successful reset');
  
  console.log('\n📧 EMAIL FLOW:');
  console.log('1. User requests password reset via API or form');
  console.log('2. System sends email with reset link');
  console.log('3. User clicks link and enters new password');
  console.log('4. System validates and updates password');
  console.log('5. User can login with new password');
}

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

// Run the test
if (require.main === module) {
  testPasswordResetFlow().catch(console.error);
}

module.exports = { testPasswordResetFlow };