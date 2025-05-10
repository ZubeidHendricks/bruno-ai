# Split Deployment Guide for Bruno AI

This guide explains how to set up a split deployment for Bruno AI with:
- Frontend deployed on Vercel
- Backend API deployed on Render.com

## Why Split Deployment?

Based on the errors encountered in the initial deployment attempt, we discovered that:

1. The full-stack deployment on Vercel was encountering 500 Internal Server Error issues
2. The API endpoints were not properly connecting to the database
3. Vercel's serverless architecture is better suited for frontend applications than Node.js backends with database connections

By separating the frontend and backend, we can:
- Optimize each platform for what it does best
- Avoid connection timeouts on serverless functions
- Maintain more stable database connections

## Changes Made for Split Deployment

### Frontend (Vercel) Changes

1. **Updated .env.production**
   - Set API URL to point to Render backend: `REACT_APP_API_URL=https://bruno-ai-api.onrender.com/api`

2. **Fixed Asset Issues**
   - Added missing logo.svg and favicon.ico files
   - Created placeholder logo192.png and logo512.png files

3. **Updated vercel.json**
   - Simplified to only handle frontend static files
   - Removed backend API routes configuration

### Backend (Render) Changes

1. **Added Health Check Endpoint**
   - Created health check route for Render monitoring
   - Added to server.js configuration

2. **Updated CORS Configuration**
   - Configured to explicitly allow requests from Vercel domain
   - Made CORS handling more robust

3. **Created render.yaml**
   - Added configuration file for Render deployment
   - Defined necessary environment variables

4. **Enhanced Server.js Robustness**
   - Improved error handling for database connection issues
   - Added better separation of concerns for frontend/backend modes

5. **Added Render-specific Scripts**
   - Added render-build and api scripts to package.json
   - Specified Node.js engine requirements

## Deployment Steps

### 1. Frontend (Vercel)

1. Push all changes to GitHub
2. Connect your repository to Vercel if not already connected
3. Configure Vercel environment variables:
   - Set `REACT_APP_API_URL=https://bruno-ai-api.onrender.com/api` (or your actual Render API URL)
4. Deploy frontend to Vercel

### 2. Backend (Render)

1. Sign up for a Render.com account if you don't have one
2. Create a new Web Service pointing to your GitHub repository
3. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Set up environment variables in Render dashboard (see README-RENDER.md for complete list)
5. Deploy the backend service

### 3. Test Integration

After both deployments are complete:
1. Visit your Vercel frontend
2. Test authentication (register/login)
3. Verify API communication is working

## Troubleshooting

If you encounter issues:

1. **API Connection Errors**: Check Render logs to ensure the API is running properly
2. **CORS Issues**: Verify the correct domain is allowed in CORS settings on the backend
3. **Database Connection**: Make sure Render can connect to your Supabase database

## Security Notes

1. **Rotate Credentials**: Update database and API credentials since they've been exposed
2. **Secure JWT Secret**: Generate a strong JWT_SECRET for production use
3. **Restrict Database Access**: Configure database firewall to only allow connections from your Render instance

## Next Steps

After successful deployment:
1. Set up monitoring for both frontend and backend
2. Configure automated CI/CD pipelines
3. Implement proper logging and error tracking