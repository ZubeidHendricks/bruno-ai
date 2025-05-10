# Deploying Bruno AI Backend to Render

This guide contains updated instructions for deploying the Bruno AI backend to Render.com after addressing previous deployment failures.

## Prerequisites

1. A [Render.com](https://render.com/) account
2. Your code pushed to GitHub

## Deployment Steps

### 1. Manual Web Service Setup on Render

1. Log in to your Render account
2. Click on "New +" in the top right and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `bruno-ai-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `bash start.sh`
   - **Plan**: Select the appropriate plan (Free or Starter tier for development)

### 2. Configure Environment Variables

Add the following environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=10000
DB_USERNAME=postgres
DB_PASSWORD=RqNtxWvpcw6DiKzf
DB_NAME=postgres
DB_HOST=db.vatitwmdtipuemrvxpne.supabase.co
DB_PORT=5432
DB_URL=postgres://postgres.vatitwmdtipuemrvxpne:RqNtxWvpcw6DiKzf@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
DB_SSL=true

SUPABASE_URL=https://vatitwmdtipuemrvxpne.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdGl0d21kdGlwdWVtcnZ4cG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NDY1MzksImV4cCI6MjA2MjMyMjUzOX0.dWx-M_em0bZ4s0mkB3j2v9zuK5MaxYV-8QYrswm0ReM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdGl0d21kdGlwdWVtcnZ4cG5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc0NjUzOSwiZXhwIjoyMDYyMzIyNTM5fQ.4XYJUn5DcOHmClIgLr-oCEC5pirhjpxS4nyOitfJJns
SUPABASE_JWT_SECRET=Z4OhBwluNGK13muSNc8pE579zXtKey0t7/oJIW+YDIDdLrEQH8sNVae+BuVw+mKy152uV4BySFMDMeG4kd7FRw==

JWT_SECRET=create-a-secure-random-string-here

CORS_ORIGIN=https://bruno-ai-olive.vercel.app
```

### 3. Alternative: Blueprint Deployment

Alternatively, use our ready-made blueprint by clicking the "Deploy to Render" button below:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ZubeidHendricks/bruno-ai)

### 4. Update Frontend Configuration

Once your Render API is deployed, update your frontend deployed on Vercel:

1. Go to your project on Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add or update the `REACT_APP_API_URL` variable:
   ```
   REACT_APP_API_URL=https://bruno-ai-api.onrender.com/api
   ```
4. Trigger a redeployment of your frontend

## Troubleshooting Deployment Issues

If your deployment fails, here are some common issues and solutions:

### Database Connection Issues

1. **Check SSL Settings**: 
   - Make sure `DB_SSL=true` is set for Supabase
   - The database.js file has been updated to handle SSL properly

2. **Verify Connection URL**:
   - Try using the connection URL instead of individual parameters
   - Ensure your Supabase database allows connections from Render IPs

### Startup Failures

1. **Run the diagnostic script**:
   ```
   bash deployment-fix.sh
   ```

2. **Check Render logs for detailed errors**:
   - Review build logs
   - Check runtime logs

3. **Common startup error fixes**:
   - Check if all required environment variables are set
   - Ensure the app is binding to the PORT environment variable
   - Verify that start.sh has proper permissions (chmod +x start.sh)

### Testing the API

After deployment:

1. Test the health endpoint: 
   ```
   curl https://bruno-ai-api.onrender.com/api/health
   ```

2. Test the auth endpoint:
   ```
   curl -X POST https://bruno-ai-api.onrender.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}'
   ```

## Security Notes

Remember to rotate your database credentials and API keys after successful deployment.

## Automated Redeployment

Enable automatic deployments from GitHub in your Render dashboard settings to keep your API in sync with your code repository.