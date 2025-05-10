// Test script for your API endpoints
const axios = require('axios');

// The API URL to test
const API_URL = process.argv[2] || 'https://bruno-ai-api.onrender.com';

// Test functions
async function testRootEndpoint() {
  try {
    console.log(`Testing root endpoint: ${API_URL}/`);
    const response = await axios.get(`${API_URL}/`);
    console.log('✅ Root endpoint success:', response.status);
    console.log(response.data);
    return true;
  } catch (error) {
    console.error('❌ Root endpoint error:', error.message);
    return false;
  }
}

async function testHealthEndpoint() {
  try {
    console.log(`\nTesting health endpoint: ${API_URL}/api/health`);
    const response = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health endpoint success:', response.status);
    console.log(response.data);
    return true;
  } catch (error) {
    console.error('❌ Health endpoint error:', error.message);
    return false;
  }
}

async function testRegisterEndpoint() {
  try {
    console.log(`\nTesting register endpoint: ${API_URL}/api/auth/register`);
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Register endpoint success:', response.status);
    console.log(response.data);
    return true;
  } catch (error) {
    console.error('❌ Register endpoint error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testLoginEndpoint() {
  try {
    console.log(`\nTesting login endpoint: ${API_URL}/api/auth/login`);
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login endpoint success:', response.status);
    console.log(response.data);
    return true;
  } catch (error) {
    console.error('❌ Login endpoint error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log(`Testing API at: ${API_URL}`);
  console.log('========================================');
  
  let passCount = 0;
  let totalTests = 4;
  
  if (await testRootEndpoint()) passCount++;
  if (await testHealthEndpoint()) passCount++;
  if (await testRegisterEndpoint()) passCount++;
  if (await testLoginEndpoint()) passCount++;
  
  console.log('\n========================================');
  console.log(`Tests passed: ${passCount}/${totalTests}`);
  
  if (passCount === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed.');
  }
}

// Run the tests
runTests();