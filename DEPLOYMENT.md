# Bruno AI Deployment Guide

This document outlines the steps taken to fix deployment issues and successfully deploy Bruno AI to Vercel.

## Fixed Issues

1. **Missing Assets**
   - Created missing `logo.svg` and `favicon.ico` files in the public directory
   - Added placeholder images for `logo192.png` and `logo512.png`

2. **Code Errors**
   - Fixed missing `Sequelize` import in `authController.js`

3. **Environment Configuration**
   - Created `.env.production` file with production settings
   - Updated API URL to use relative path `/api` for same-domain requests

4. **CORS Configuration**
   - Updated CORS settings to accept requests from the Vercel domain
   - Added `https://bruno-ai-olive.vercel.app` to allowed origins

5. **Vercel Configuration**
   - Updated `vercel.json` to correctly handle API routes
   - Configured proper builds for both frontend and backend

## Deployment Instructions

### 1. Push changes to GitHub

```bash
git add .
git commit -m "Fix deployment issues for Vercel"
git push origin main
```

### 2. Set up Vercel Environment Variables

Add the following environment variables in the Vercel dashboard (Settings → Environment Variables):

```
DB_USERNAME=postgres
DB_PASSWORD=RqNtxWvpcw6DiKzf
DB_NAME=postgres
DB_HOST=db.vatitwmdtipuemrvxpne.supabase.co
DB_PORT=5432
DB_URL=postgres://postgres.vatitwmdtipuemrvxpne:RqNtxWvpcw6DiKzf@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

SUPABASE_URL=https://vatitwmdtipuemrvxpne.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdGl0d21kdGlwdWVtcnZ4cG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NDY1MzksImV4cCI6MjA2MjMyMjUzOX0.dWx-M_em0bZ4s0mkB3j2v9zuK5MaxYV-8QYrswm0ReM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdGl0d21kdGlwdWVtcnZ4cG5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc0NjUzOSwiZXhwIjoyMDYyMzIyNTM5fQ.4XYJUn5DcOHmClIgLr-oCEC5pirhjpxS4nyOitfJJns
SUPABASE_JWT_SECRET=Z4OhBwluNGK13muSNc8pE579zXtKey0t7/oJIW+YDIDdLrEQH8sNVae+BuVw+mKy152uV4BySFMDMeG4kd7FRw==

JWT_SECRET=generate-a-secure-random-string-here

CORS_ORIGIN=https://bruno-ai-olive.vercel.app
NODE_ENV=production
```

### 3. Deploy to Vercel

If you haven't connected your GitHub repository to Vercel yet:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select your "bruno-ai" GitHub repository
4. Keep default settings and click "Deploy"

If your repository is already connected:

1. The changes will deploy automatically when you push to GitHub
2. Or manually trigger a new deployment in the Vercel dashboard

### 4. Verify Deployment

After deployment, verify these items:

1. Check that logo and favicon appear correctly
2. Test user registration and login
3. Verify API routes are working correctly
4. Check database connectivity

### 5. Troubleshooting

If you encounter issues:

1. Check Vercel deployment logs for errors
2. Verify environment variables are correctly set
3. Check CORS settings if API requests fail
4. Ensure database is accessible from Vercel

## Security Note

Remember to rotate your database credentials and API keys since they have been exposed. This is critical for production security.

## Next Steps

After successful deployment:

1. Set up a proper CI/CD pipeline for automated testing
2. Implement monitoring and logging solutions
3. Consider separating frontend and backend into different repositories
4. Set up proper staging and production environments