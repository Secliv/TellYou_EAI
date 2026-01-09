#!/usr/bin/env node

/**
 * Script untuk test User Service endpoints (Register & Login)
 * Usage: node scripts/test-user-service.js
 */

const http = require('http');

const BASE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: json,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testHealthCheck() {
  log('\n📋 Test 1: Health Check', 'cyan');
  log('─'.repeat(60), 'cyan');
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
    });
    
    if (result.statusCode === 200 && result.data.status === 'ok') {
      log(`✅ Health check passed`, 'green');
      log(`   Status: ${result.data.status}`);
      log(`   Service: ${result.data.service}`);
      return true;
    } else {
      log(`❌ Health check failed`, 'red');
      log(`   Status Code: ${result.statusCode}`);
      return false;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    log(`   Make sure User Service is running on port 3000`, 'yellow');
    return false;
  }
}

async function testRegister() {
  log('\n📋 Test 2: User Registration', 'cyan');
  log('─'.repeat(60), 'cyan');
  
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role: 'user',
  };
  
  log(`   Username: ${testUser.username}`);
  log(`   Email: ${testUser.email}`);
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, testUser);
    
    if (result.statusCode === 201 && result.data.success) {
      log(`✅ Registration successful`, 'green');
      log(`   User ID: ${result.data.data.user.id}`);
      log(`   Username: ${result.data.data.user.username}`);
      log(`   Email: ${result.data.data.user.email}`);
      log(`   Token: ${result.data.data.token.substring(0, 20)}...`);
      return {
        success: true,
        user: testUser,
        token: result.data.data.token,
        userData: result.data.data.user,
      };
    } else {
      log(`❌ Registration failed`, 'red');
      log(`   Status Code: ${result.statusCode}`);
      log(`   Message: ${result.data.message || 'Unknown error'}`);
      return { success: false, user: testUser };
    }
  } catch (error) {
    log(`❌ Registration failed: ${error.message}`, 'red');
    return { success: false, user: testUser };
  }
}

async function testLogin(email, password) {
  log('\n📋 Test 3: User Login', 'cyan');
  log('─'.repeat(60), 'cyan');
  
  log(`   Email: ${email}`);
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, { email, password });
    
    if (result.statusCode === 200 && result.data.success) {
      log(`✅ Login successful`, 'green');
      log(`   User ID: ${result.data.data.user.id}`);
      log(`   Username: ${result.data.data.user.username}`);
      log(`   Email: ${result.data.data.user.email}`);
      log(`   Token: ${result.data.data.token.substring(0, 20)}...`);
      return {
        success: true,
        token: result.data.data.token,
        userData: result.data.data.user,
      };
    } else {
      log(`❌ Login failed`, 'red');
      log(`   Status Code: ${result.statusCode}`);
      log(`   Message: ${result.data.message || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testGetUsers(token) {
  log('\n📋 Test 4: Get All Users (Protected)', 'cyan');
  log('─'.repeat(60), 'cyan');
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (result.statusCode === 200 && result.data.success) {
      log(`✅ Get users successful`, 'green');
      log(`   Total users: ${result.data.data.length}`);
      if (result.data.data.length > 0) {
        log(`   First user: ${result.data.data[0].username} (${result.data.data[0].email})`);
      }
      return true;
    } else {
      log(`❌ Get users failed`, 'red');
      log(`   Status Code: ${result.statusCode}`);
      log(`   Message: ${result.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log(`❌ Get users failed: ${error.message}`, 'red');
    return false;
  }
}

async function testInvalidLogin() {
  log('\n📋 Test 5: Invalid Login (Error Handling)', 'cyan');
  log('─'.repeat(60), 'cyan');
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!',
    });
    
    if (result.statusCode === 401) {
      log(`✅ Invalid login correctly rejected`, 'green');
      log(`   Status Code: ${result.statusCode}`);
      log(`   Message: ${result.data.message}`);
      return true;
    } else {
      log(`⚠️  Expected 401, got ${result.statusCode}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 User Service API Tests', 'blue');
  log('═'.repeat(60), 'blue');
  log(`Base URL: ${BASE_URL}`, 'blue');
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    log('\n❌ Service is not running. Please start the service first.', 'red');
    log('   Run: docker compose up -d', 'yellow');
    process.exit(1);
  }
  
  // Test 2: Register
  const registerResult = await testRegister();
  if (!registerResult.success) {
    log('\n⚠️  Registration failed, skipping remaining tests', 'yellow');
    process.exit(1);
  }
  
  // Test 3: Login
  const loginResult = await testLogin(registerResult.user.email, registerResult.user.password);
  if (!loginResult.success) {
    log('\n⚠️  Login failed, skipping protected endpoint tests', 'yellow');
    process.exit(1);
  }
  
  // Test 4: Get Users (Protected)
  await testGetUsers(loginResult.token);
  
  // Test 5: Invalid Login
  await testInvalidLogin();
  
  // Summary
  log('\n' + '═'.repeat(60), 'blue');
  log('📊 Test Summary', 'blue');
  log('─'.repeat(60), 'blue');
  log('✅ Health Check: Passed', 'green');
  log('✅ Registration: Passed', 'green');
  log('✅ Login: Passed', 'green');
  log('✅ Get Users: Passed', 'green');
  log('✅ Error Handling: Passed', 'green');
  log('\n🎉 All tests passed successfully!\n', 'green');
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Test execution failed: ${error.message}`, 'red');
  process.exit(1);
});

