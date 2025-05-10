# Bruno AI Render Deployment Fix

This guide addresses issues with deploying your Bruno AI application to Render.

## Current Issue

The application is failing to start with the error:

```
OpenAIError: The OPENAI_API_KEY environment variable is missing or empty
```

## Quick Fix Steps

### 1. Add the Required Environment Variables

In the Render dashboard, add these environment variables:

1. **Open your Render service**
2. **Go to Environment → Environment Variables**
3. **Add these variables**:
   ```
   NODE_ENV=production
   PORT=10000
   OPENAI_API_KEY=your-openai-api-key  # Add your actual API key
   DB_URL=postgres://postgres.vatitwmdtipuemrvxpne:RqNtxWvpcw6DiKzf@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   DB_SSL=true
   JWT_SECRET=eyJzdWIiOiIxOSY3ZjBmMzNkYWYxODM4OTY0YzUiLCJuYW1lIjoiQnJ1bm9BSSIsImFkdQI2Z0NyMDMifQ
   ```

### 2. Make the Application More Resilient

The code has been updated to handle missing API keys gracefully:

- **OpenAI configuration**: Modified to provide a mock API when no key is present
- **Transformation controller**: Enhanced to work without OpenAI if needed

### 3. Redeploy Your Application

1. **Push the code changes to GitHub**
2. **In Render dashboard, click "Manual Deploy" → "Clear build cache & deploy"**

## Testing After Deployment

Test the basic endpoints even without OpenAI:

```bash
# Test root endpoint
curl https://bruno-ai-onrender.com/

# Test health endpoint
curl https://bruno-ai-onrender.com/api/health
```

## How to Get an OpenAI API Key

If you need an OpenAI API key:

1. Create or log in to an account at https://platform.openai.com
2. Go to API keys: https://platform.openai.com/account/api-keys
3. Click "Create new secret key"
4. Copy the generated key and add it to your Render environment variables

## Frontend Configuration

After your API is working correctly, update your Vercel frontend:

1. Go to your Vercel project settings
2. Update the environment variable:
   ```
   REACT_APP_API_URL=https://bruno-ai-onrender.com/api
   ```
3. Trigger a new deployment

The updated code allows the application to start and function even without an OpenAI API key, providing fallback functionality where possible.