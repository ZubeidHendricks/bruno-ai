# Deploying Bruno AI to Vercel

This guide explains how to deploy the Bruno AI platform to Vercel.

## Prerequisites

- A Vercel account
- A GitHub account with your Bruno AI repository
- Node.js v16+ installed locally
- Vercel CLI installed (`npm install -g vercel`)

## Deployment Steps

### 1. Prepare Your Environment Files

The repository contains multiple environment files:
- `.env` - Base environment configuration
- `.env.local` - For local development
- `.env.production` - For production deployment to Vercel

These files contain all the necessary API keys and database connections.

### 2. Install Vercel CLI and Login

```bash
npm install -g vercel
vercel login
```

### 3. Initialize Vercel Project

Navigate to your project directory and run:

```bash
cd bruno-ai
vercel
```

Follow the prompts to link to your Vercel account and project.

### 4. Configure Environment Variables

In the Vercel dashboard:
1. Go to your project settings
2. Click on the "Environment Variables" tab
3. Add all the variables from your `.env.production` file

### 5. Deploy to Vercel

Deploy the project:

```bash
vercel --prod
```

### 6. Verify Deployment

Test the API endpoints:

```
https://your-vercel-url.vercel.app/api/health
```

## API Endpoints

The following API endpoints are available:

- `GET /api/health` - Health check endpoint
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/dashboard/summary` - Dashboard summary data
- `POST /api/datasets/process` - Process dataset transformations
- `POST /api/timeseries/forecast` - Generate time series forecasts

## API Architecture

The API is built using Vercel serverless functions:

```
/api
  /auth
    login.js
    register.js
  /dashboard
    summary.js
  /datasets
    process.js
  /health
    index.js
  /timeseries
    forecast.js
```

Supporting code is organized in the `/api-vercel` directory:

```
/api-vercel
  /config
    database.js
  /middleware
    auth.js
    cors.js
    errorHandler.js
```

## Configuration Files

- `vercel.json` - Vercel deployment configuration
- `.env.production` - Production environment variables

## Troubleshooting

If you encounter CORS issues, check:
1. The CORS_ORIGIN environment variable
2. The headers in vercel.json
3. The CORS middleware in api-vercel/middleware/cors.js

For database connection issues:
1. Verify your database credentials
2. Check that your database allows connections from Vercel's IP addresses

## Frontend Deployment

The frontend is deployed separately. Update your frontend API endpoint to point to your Vercel API URL:

```
REACT_APP_API_URL=https://your-vercel-url.vercel.app/api
```
