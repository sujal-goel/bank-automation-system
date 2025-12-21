const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/auth';

async function testLoginFlow() {
  console.log('='.repeat(70));
  console.log('BANKING SYSTEM LOGIN FLOW TEST');
  console.log('='.repeat(70));

  // Test 1: Login with valid admin credentials
  console.log('\n1. TESTING ADMIN LOGIN');
  console.log('-'.repeat(50));
  
  const adminLoginResult = await makeRequest('/login', 'POST', {
    email: 'admin@bank.com',
    password: 'Admin@123'
  });
  
  let adminToken = null;
  if (adminLoginResult.result && adminLoginResult.result.success) {
    adminToken = adminLoginResult.result.token;
    console.log('✅ Admin login successful');
    console.log('👤 User:', adminLoginResult.result.user.firstName, adminLoginResult.result.user.lastName);
    console.log('🔑 Role:', adminLoginResult.result.user.role);
    console.log('🎫 Token expires in:', adminLoginResult.result.expiresIn);
  }

  // Test 2: Login with invalid credentials
  console.log('\n2. TESTING INVALID CREDENTIALS');
  console.log('-'.repeat(50));
  
  await makeRequest('/login', 'POST', {
    email: 'admin@bank.com',
    password: 'WrongPassword123!'
  });

  // Test 3: Login with non-existent user
  console.log('\n3. TESTING NON-EXISTENT USER');
  console.log('-'.repeat(50));
  
  await makeRequest('/login', 'POST', {
    email: 'nonexistent@example.com',
    password: 'SomePassword123!'
  });

  // Test 4: Test token validation by accessing protected endpoint
  if (adminToken) {
    console.log('\n4. TESTING TOKEN VALIDATION');
    console.log('-'.repeat(50));
    
    const usersResult = await makeRequest('/users', 'GET', null, adminToken);
    
    if (usersResult.result && Array.isArray(usersResult.result)) {
      console.log('✅ Token validation successful');
      console.log('📊 Retrieved', usersResult.result.length, 'users');
    }
  }

  // Test 5: Test different user types (if they exist)
  console.log('\n5. TESTING DIFFERENT USER TYPES');
  console.log('-'.repeat(50));
  
  const testUsers = [
    { email: 'customer@example.com', password: 'Customer@123', expectedRole: 'customer' },
    { email: 'employee@bank.com', password: 'Employee@123', expectedRole: 'employee' }
  ];

  for (const testUser of testUsers) {
    console.log(`\nTesting ${testUser.expectedRole} login:`);
    const result = await makeRequest('/login', 'POST', {
      email: testUser.email,
      password: testUser.password
    });
    
    if (result.result && result.result.success) {
      console.log(`✅ ${testUser.expectedRole} login successful`);
      console.log('👤 User:', result.result.user.firstName, result.result.user.lastName);
      console.log('🔑 Role:', result.result.user.role);
    } else {
      console.log(`ℹ️  ${testUser.expectedRole} account may not exist or be active`);
    }
  }

  // Test 6: Test missing fields
  console.log('\n6. TESTING MISSING FIELDS');
  console.log('-'.repeat(50));
  
  console.log('\nTesting missing email:');
  await makeRequest('/login', 'POST', {
    password: 'SomePassword123!'
  });
  
  console.log('\nTesting missing password:');
  await makeRequest('/login', 'POST', {
    email: 'admin@bank.com'
  });

  console.log('\n' + '='.repeat(70));
  console.log('LOGIN FLOW TEST COMPLETED');
  console.log('='.repeat(70));
  
  console.log('\n🌐 LOGIN INTERFACE:');
  console.log('- Visit http://localhost:3000/login to test the UI');
  console.log('- The interface provides user type tabs (Customer/Employee/Admin)');
  console.log('- Demo accounts are pre-filled for easy testing');
  console.log('- Password visibility toggle available');
  console.log('- Remember me functionality for persistent sessions');
  console.log('- Automatic redirect based on user role');
  
  console.log('\n🔐 AUTHENTICATION FEATURES:');
  console.log('1. JWT token-based authentication');
  console.log('2. Role-based access control');
  console.log('3. Session management (localStorage/sessionStorage)');
  console.log('4. Account status validation (active/pending/suspended)');
  console.log('5. Password reset integration');
  console.log('6. User-friendly error messages');
  
  console.log('\n📱 USER EXPERIENCE:');
  console.log('- Professional design matching password reset interface');
  console.log('- Responsive layout for all devices');
  console.log('- Loading states and visual feedback');
  console.log('- Demo account quick-fill for development');
  console.log('- Contextual error messages for different scenarios');
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
  testLoginFlow().catch(console.error);
}

module.exports = { testLoginFlow };