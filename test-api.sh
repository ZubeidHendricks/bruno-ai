#!/bin/bash

# This script tests various API endpoints

# Get the API URL from command line argument or use default
API_URL=${1:-"https://bruno-ai-api.onrender.com"}

echo "Testing API at $API_URL"
echo "----------------------"

# Test root endpoint
echo "Testing root endpoint..."
curl -s $API_URL
echo -e "\n"

# Test health endpoint
echo "Testing health endpoint..."
curl -s $API_URL/api/health
echo -e "\n"

# Test register endpoint
echo "Testing register endpoint..."
curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
echo -e "\n"

# Test login endpoint
echo "Testing login endpoint..."
curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
echo -e "\n"

echo "Tests completed!"