const axios = require('axios');

// Function to test the health endpoint
async function testHealth(baseUrl) {
  try {
    console.log('Testing health endpoint...');
    const response = await axios.get(`${baseUrl}/health`);
    console.log('Health endpoint response:', response.data);
    return true;
  } catch (error) {
    console.error('Health endpoint error:', error.message);
    return false;
  }
}

// Function to test the register endpoint
async function testRegister(baseUrl) {
  try {
    console.log('Testing register endpoint...');
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    const response = await axios.post(`${baseUrl}/auth/register`, userData);
    console.log('Register endpoint response:', response.data);
    return true;
  } catch (error) {
    console.error('Register endpoint error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Function to test the login endpoint
async function testLogin(baseUrl) {
  try {
    console.log('Testing login endpoint...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    const response = await axios.post(`${baseUrl}/auth/login`, loginData);
    console.log('Login endpoint response:', response.data);
    return true;
  } catch (error) {
    console.error('Login endpoint error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  // Get the API URL from the command line or use default
  const baseUrl = process.argv[2] || 'http://localhost:5000/api';
  
  console.log(`Testing API at: ${baseUrl}`);
  
  // Run all tests
  const healthResult = await testHealth(baseUrl);
  const registerResult = await testRegister(baseUrl);
  const loginResult = await testLogin(baseUrl);
  
  // Print summary
  console.log('\nTest Summary:');
  console.log('-------------');
  console.log(`Health endpoint: ${healthResult ? 'PASS' : 'FAIL'}`);
  console.log(`Register endpoint: ${registerResult ? 'PASS' : 'FAIL'}`);
  console.log(`Login endpoint: ${loginResult ? 'PASS' : 'FAIL'}`);
  
  // Exit with appropriate code
  if (healthResult && registerResult && loginResult) {
    console.log('\nAll tests passed!');
    process.exit(0);
  } else {
    console.log('\nSome tests failed!');
    process.exit(1);
  }
}

// Run the tests
runTests();
