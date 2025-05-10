// Diagnostic script to check server configuration
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const apiUrl = process.argv[2] || 'https://bruno-ai-api.onrender.com';

console.log(`====== Bruno AI API Diagnostics ======`);
console.log(`Testing API URL: ${apiUrl}`);
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Node version: ${process.version}`);
console.log(`===================================`);

// Check if essential files exist
console.log('\n1. Checking essential files...');
const essentialFiles = [
  'server.js',
  'src/config/database.js',
  'src/routes/authRoutes.js',
  'src/middlewares/errorHandler.js'
];

for (const file of essentialFiles) {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is missing!`);
  }
}

// Check route files
console.log('\n2. Checking route files...');
const routeFiles = [
  'src/routes/authRoutes.js',
  'src/routes/datasetRoutes.js',
  'src/routes/transformationRoutes.js',
  'src/routes/dashboardRoutes.js',
  'src/routes/searchRoutes.js'
];

for (const file of routeFiles) {
  if (fs.existsSync(path.join(__dirname, file))) {
    try {
      // Try to require the file to check for errors
      require(path.join(__dirname, file));
      console.log(`✅ ${file} can be loaded`);
    } catch (error) {
      console.log(`❌ ${file} exists but can't be loaded: ${error.message}`);
    }
  } else {
    console.log(`❌ ${file} is missing!`);
  }
}

// Check database configuration
console.log('\n3. Checking database configuration...');
try {
  const dbConfig = require('./src/config/database');
  console.log('✅ Database configuration loaded');
  console.log('Database configuration:', {
    host: process.env.DB_HOST || 'Not set',
    database: process.env.DB_NAME || 'Not set',
    sslEnabled: process.env.DB_SSL || 'Not set'
  });
} catch (error) {
  console.log(`❌ Database configuration can't be loaded: ${error.message}`);
}

// Check environment variables
console.log('\n4. Checking environment variables...');
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_URL',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} is set`);
  } else {
    console.log(`❌ ${envVar} is not set!`);
  }
}

// Test API endpoints
console.log('\n5. Testing API endpoints...');

async function testEndpoint(url, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${apiUrl}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://bruno-ai-olive.vercel.app'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${method} ${url} - Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ${method} ${url} - Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runTests() {
  // Test basic endpoints
  await testEndpoint('/');
  await testEndpoint('/api/health');

  // Test auth endpoints
  await testEndpoint('/api/auth/register', 'POST', {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });

  await testEndpoint('/api/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123'
  });

  console.log('\n6. Testing OPTIONS requests for CORS...');

  // Test OPTIONS request
  try {
    const response = await axios({
      method: 'OPTIONS',
      url: `${apiUrl}/api/auth/register`,
      headers: {
        'Origin': 'https://bruno-ai-olive.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log(`✅ OPTIONS /api/auth/register - Status: ${response.status}`);
    console.log('CORS Headers:');
    console.log(`  Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || 'Not set'}`);
    console.log(`  Access-Control-Allow-Methods: ${response.headers['access-control-allow-methods'] || 'Not set'}`);
    console.log(`  Access-Control-Allow-Headers: ${response.headers['access-control-allow-headers'] || 'Not set'}`);
  } catch (error) {
    console.log(`❌ OPTIONS /api/auth/register - Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Headers: ${JSON.stringify(error.response.headers)}`);
    }
  }

  console.log('\n===================================');
  console.log('Diagnostics complete!');
}

runTests();