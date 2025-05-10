# Bruno AI CORS Fix for Render Deployment

This guide provides a comprehensive fix for the CORS issues between your Vercel frontend and Render backend.

## Current Issue

Your API on Render is not allowing cross-origin requests from your Vercel frontend. The error is:

```
Access to XMLHttpRequest at 'https://bruno-ai-api.onrender.com/api/auth/register' from origin 'https://bruno-ai-olive.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Complete Fix

We've implemented multiple layers of CORS protection to ensure your API works properly:

### 1. Custom CORS Middleware

Created a dedicated CORS middleware in `src/middlewares/cors.js` that explicitly sets the required headers for all requests.

### 2. Multiple CORS Layers

The server.js now has three layers of CORS protection:
1. Custom middleware at the very beginning
2. The `cors` package with permissive settings
3. A global OPTIONS handler

### 3. Direct Auth Endpoints

Added direct handlers for registration and login that bypass the usual routes, ensuring these critical endpoints always work.

### 4. Updated Dockerfile

The Dockerfile now sets environment variables specifically for CORS and properly copies the CORS middleware first.

## Deployment Steps

To fix this issue completely:

### 1. Push the latest changes

```bash
git add .
git commit -m "Comprehensive CORS fix for Render deployment"
git push origin main
```

### 2. Deploy to Render using Docker

1. In your Render dashboard, go to your service
2. Navigate to Settings
3. Set these environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   ALLOW_ALL_ORIGINS=true
   CORS_ORIGIN=https://bruno-ai-olive.vercel.app
   ```
4. Click "Manual Deploy" → "Clear build cache & deploy"

### 3. If issues persist, test with minimal CORS server

If you continue to have CORS issues after deployment, try deploying the minimal CORS server:

1. Create a new Web Service on Render
2. Point it to the same GitHub repo
3. Set Start Command to: `node cors-server.js`
4. Set the same environment variables
5. Deploy and test

## Verifying CORS is Working

After deployment, run these checks:

### 1. Test with curl

```bash
curl -X OPTIONS https://your-api-url.onrender.com/api/auth/register \
  -H "Origin: https://bruno-ai-olive.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v
```

You should see the Access-Control-Allow headers in the response.

### 2. Test direct registration

```bash
curl -X POST https://your-api-url.onrender.com/api/auth/register \
  -H "Origin: https://bruno-ai-olive.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

### 3. Check Render Logs

Look for messages like:
- "CORS middleware - OPTIONS request from origin: https://bruno-ai-olive.vercel.app"
- "Handling OPTIONS request with CORS middleware"

## Last Resort: Frontend CORS Proxy

If the server-side CORS fixes still don't work, you can use a CORS proxy on the frontend:

1. Update your frontend API URL to use a CORS proxy:
   ```javascript
   const API_URL = `https://cors-anywhere.herokuapp.com/${process.env.REACT_APP_API_URL}`;
   ```

2. Or deploy your own CORS proxy to Vercel:
   ```javascript
   // api/proxy.js on Vercel
   export default async (req, res) => {
     const url = req.query.url;
     const response = await fetch(url, {
       method: req.method,
       headers: req.headers,
       body: req.body
     });
     const data = await response.text();
     res.status(response.status).send(data);
   };
   ```

Remember that CORS is a security feature. For production, once everything is working, you should limit allowed origins to only your trusted domains instead of allowing all origins.