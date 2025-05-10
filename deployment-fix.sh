#!/bin/bash

# This script helps troubleshoot deployment issues on Render

echo "========== Environment Information =========="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"

echo "========== Checking for Critical Files =========="
if [ -f "server.js" ]; then
  echo "✅ server.js exists"
else
  echo "❌ server.js is missing!"
fi

if [ -f "package.json" ]; then
  echo "✅ package.json exists"
else
  echo "❌ package.json is missing!"
fi

if [ -f ".env" ]; then
  echo "✅ .env exists"
else
  echo "⚠️ .env is missing - this might be expected in production with environment variables"
fi

echo "========== Checking Database Configuration =========="
if [ -f "src/config/database.js" ]; then
  echo "✅ database.js exists"
else
  echo "❌ database.js is missing!"
fi

echo "========== Checking Routes =========="
if [ -d "src/routes" ]; then
  echo "✅ routes directory exists"
  echo "Routes found: $(ls -la src/routes)"
else
  echo "❌ routes directory is missing!"
fi

echo "========== Testing Health Endpoint =========="
node -e "
const http = require('http');
const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('Health endpoint status code:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Health endpoint response:', data);
  });
});

req.on('error', (error) => {
  console.error('Health endpoint error:', error.message);
});

req.end();
"

echo "========== End of Diagnostic Information =========="