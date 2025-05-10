#!/bin/bash

# Deploy Bruno AI to Vercel
echo "Bruno AI Vercel Deployment Script"
echo "=================================="

# Check for vercel CLI
if ! command -v vercel &> /dev/null
then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Copy production environment
echo "Setting up production environment..."
cp .env.production .env

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Login to Vercel if needed
echo "Logging in to Vercel (if not already logged in)..."
vercel whoami || vercel login

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment complete! Check the Vercel dashboard for details."
