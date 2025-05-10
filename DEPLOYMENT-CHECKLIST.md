# Bruno AI Deployment Checklist

This checklist outlines the key steps and fixes to get your Bruno AI application working properly with a Vercel frontend and Render backend.

## Backend Deployment (Render)

### 1. Backend Code Fixes

- [x] Simplified server.js with better error handling
- [x] Added root endpoint for health checks
- [x] Enabled CORS for all origins in testing
- [x] Added explicit OPTIONS request handler
- [x] Improved logging for better debugging
- [x] Added fallback routes when database isn't available

### 2. Docker Configuration

- [x] Updated Dockerfile to use node:18-slim
- [x] Changed from npm ci to npm install for better compatibility
- [x] Added health check at root path
- [x] Exposed port 10000 properly

### 3. Render Configuration

- [x] Updated render.yaml for simpler configuration
- [x] Added test-api.sh script to verify API functionality
- [x] Set health check path to root endpoint

### 4. Render Deployment Steps

1. Push the updated code to GitHub
2. In Render dashboard, create a new Web Service:
   - Select your GitHub repository
   - Choose Docker runtime
   - Set environment variables:
     ```
     NODE_ENV=production
     PORT=10000
     JWT_SECRET=eyJzdWIiOiIxOSY3ZjBmMzNkYWYxODM4OTY0YzUiLCJuYW1lIjoiQnJ1bm9BSSIsImFkdQI2Z0NyMDMifQ
     ```
3. Deploy the service
4. Test the API is working:
   - Visit the root URL (e.g. https://bruno-ai-api.onrender.com)
   - Test the health endpoint (e.g. https://bruno-ai-api.onrender.com/api/health)

## Frontend Deployment (Vercel)

### 1. Frontend Code Fixes

- [x] Updated apiService.js with better error handling
- [x] Fixed AuthContext.js to use updated apiService
- [x] Removed withCredentials option to avoid CORS preflight issues
- [x] Added additional logging for debugging

### 2. Vercel Configuration

- [x] Set REACT_APP_API_URL in Vercel environment variables
- [x] Updated .env.production file with Render API URL

### 3. Vercel Deployment Steps

1. Push the updated code to GitHub
2. In Vercel dashboard:
   - Connect to your GitHub repository (if not already connected)
   - Set environment variables:
     ```
     REACT_APP_API_URL=https://bruno-ai-api.onrender.com/api
     ```
3. Deploy the application
4. Test registration and login functionality

## Testing and Verification

### 1. API Functionality Tests

Run the test-api.sh script to verify key API endpoints:

```bash
./test-api.sh https://bruno-ai-api.onrender.com
```

### 2. Frontend Integration Tests

1. Navigate to the registration page
2. Fill out the form and submit
3. Check for successful registration
4. Try logging in with the new account

## Common Issues and Solutions

### 1. CORS Issues

If you still encounter CORS errors:
- Check the Render logs to see if the OPTIONS request is being handled
- Temporarily enable CORS for all origins by setting `ALLOW_ALL_ORIGINS=true` in Render
- Make sure the browser isn't caching an old CORS error

### 2. API Connection Issues

If the frontend can't connect to the API:
- Make sure the API URL is correctly set in the environment variables
- Check that the API is actually running on Render
- Try accessing the API directly from a browser or Postman

### 3. Docker Build Issues

If Docker builds fail on Render:
- Check the build logs for specific error messages
- Make sure package.json is compatible with npm install
- Consider using a more specific Node.js version if needed

## Final Verification Checklist

- [ ] Backend API is running on Render
- [ ] Health endpoint returns 200 OK
- [ ] Frontend is deployed on Vercel
- [ ] Frontend can connect to the backend
- [ ] Registration works without CORS errors
- [ ] Login works without CORS errors

Once all items on this checklist are completed, your Bruno AI application should be properly deployed and functional.