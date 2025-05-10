#!/bin/bash

# This script sets up the Bruno AI API for deployment on Render
# It removes frontend dependencies to create a lightweight backend-only deployment

echo "Setting up Bruno AI API for Render deployment..."

# Print environment info
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Check for essential files
if [ ! -f "server.js" ]; then
  echo "❌ Error: server.js is missing!"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json is missing!"
  exit 1
fi

# Use server-specific package.json if available
if [ -f "server-package.json" ]; then
  echo "✅ Using server-specific package.json"
  cp server-package.json package.json
fi

# Install only production dependencies
echo "Installing production dependencies..."
npm install --omit=dev --no-optional

echo "Setup complete!"
echo "You can start the server with: node server.js"