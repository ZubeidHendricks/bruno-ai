#!/bin/bash

# This script sets up a server-only deployment without frontend dependencies

echo "Setting up Bruno AI API server..."

# Check if we should use the simplified package.json
if [ "$USE_SERVER_PACKAGE" = "true" ]; then
  echo "Using server-only package.json"
  cp server-package.json package.json
fi

# Install dependencies
npm install --production

echo "Dependency installation complete!"
echo "Server is ready to start"