# CORS Debugging Guide for Bruno AI

This guide helps troubleshoot Cross-Origin Resource Sharing (CORS) issues between the Vercel frontend and Render backend.

## Current Issue

Your screenshots show a CORS error when the frontend tries to access the API:

```
Access to XMLHttpRequest at 'https://bruno-ai-api.onrender.com/api/auth/register' from origin 'https://bruno-ai-olive.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Quick Fixes

### Option 1: Update Backend CORS Settings

1. Log into your Render dashboard
2. Go to your Web Service (bruno-ai-api)
3. Add/update these environment variables:
   ```
   CORS_ORIGIN=https://bruno-ai-olive.vercel.app
   ALLOW_ALL_ORIGINS=true
   ```
4. Trigger a manual deployment

### Option 2: Alternative Backend CORS Configuration

If Option 1 doesn't work, try adding this code at the very top of your server.js:

```javascript
// Add this immediately after creating the Express app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
```

### Option 3: Use a CORS Proxy (Frontend Fix)

If you can't modify the backend, update your frontend API service:

```javascript
// In src/services/apiService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

const apiService = axios.create({
  baseURL: CORS_PROXY + API_URL,
  // ...other settings
});
```

## Testing CORS Configuration

Use this curl command to test if CORS is properly configured:

```bash
curl -X OPTIONS https://bruno-ai-api.onrender.com/api/auth/register \
  -H "Origin: https://bruno-ai-olive.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v
```

The response should include:
- `Access-Control-Allow-Origin: https://bruno-ai-olive.vercel.app`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Checking API Availability

Make sure your API endpoints are actually working:

```bash
# Test health endpoint
curl https://bruno-ai-api.onrender.com/api/health

# Test register endpoint (should return JSON)
curl -X POST https://bruno-ai-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## Common CORS Issues

1. **Incorrect Origins**: Make sure the CORS_ORIGIN exactly matches your frontend URL
2. **Missing Headers**: The server must send proper Access-Control-Allow-* headers
3. **Preflight Handling**: OPTIONS requests need correct handling
4. **Credentials**: If using cookies/authentication, need proper credentials handling
5. **Server Error**: If the server responds with an error, CORS headers might not be sent

## Long-term Solution

For a proper fix:

1. Make sure the backend explicitly allows the Vercel frontend origin
2. Configure the frontend to send the proper headers
3. Use environment variables to manage the API URL across environments
4. For development, consider using a proxy in package.json