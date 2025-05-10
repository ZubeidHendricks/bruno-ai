// Test script to verify CORS configuration
const axios = require('axios');

// The API URL to test
const API_URL = process.argv[2] || 'https://bruno-ai-api.onrender.com';
const FRONTEND_URL = process.argv[3] || 'https://bruno-ai-olive.vercel.app';

console.log(`Testing CORS configuration for API: ${API_URL}`);
console.log(`Using frontend origin: ${FRONTEND_URL}`);
console.log('========================================');

// Test OPTIONS request (preflight)
async function testPreflightRequest() {
  try {
    console.log('Testing OPTIONS preflight request...');
    
    const response = await axios({
      method: 'OPTIONS',
      url: `${API_URL}/api/auth/register`,
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ Preflight response status:', response.status);
    console.log('CORS Headers received:');
    console.log('- Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('- Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    console.log('- Access-Control-Allow-Headers:', response.headers['access-control-allow-headers']);
    
    if (
      response.headers['access-control-allow-origin'] && 
      response.headers['access-control-allow-methods'] && 
      response.headers['access-control-allow-headers']
    ) {
      console.log('✅ CORS headers are properly configured');
    } else {
      console.log('❌ CORS headers are missing or incomplete');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Preflight request failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    return false;
  }
}

// Test actual POST request
async function testPostRequest() {
  try {
    console.log('\nTesting actual POST request with Origin header...');
    
    const response = await axios({
      method: 'POST',
      url: `${API_URL}/api/auth/register`,
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json'
      },
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
    });
    
    console.log('✅ POST request successful with status:', response.status);
    console.log('Response data:', response.data);
    return true;
  } catch (error) {
    console.error('❌ POST request failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  let passCount = 0;
  let totalTests = 2;
  
  if (await testPreflightRequest()) passCount++;
  if (await testPostRequest()) passCount++;
  
  console.log('\n========================================');
  console.log(`Tests passed: ${passCount}/${totalTests}`);
  
  if (passCount === totalTests) {
    console.log('🎉 All CORS tests passed! Your API should work with your frontend.');
  } else {
    console.log('⚠️ Some CORS tests failed. See errors above for details.');
  }
}

// Run the tests
runTests();