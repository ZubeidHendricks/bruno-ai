#!/bin/bash

# Print environment info
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"

# Run the server
node server.js