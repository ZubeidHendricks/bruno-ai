# Bruno AI Render Deployment Fix

This guide addresses the specific issue where your Render API is giving a "Cannot GET /" error.

## Issue Identified

The root cause appears to be:
1. Your server doesn't have a root endpoint handler (`/`)
2. CORS configuration may be preventing external access
3. The Docker environment may be having port mapping issues

## Quick Fix Steps

### 1. Check Render Configuration

1. **Verify environment variables**:
   - Go to your Render dashboard → bruno-ai-api → Environment
   - Make sure these are set:
     ```
     NODE_ENV=production
     PORT=10000
     ```

2. **Update the "Start Command"**:
   - Go to Settings → Start Command
   - Change to: `node server.js`

3. **Set Health Check Path**:
   - Go to Settings → Health Check Path
   - Change to: `/api/health`

4. **Verify port configuration**:
   - Go to Settings
   - Make sure "Auto-assign port" is checked
   - Or set a specific port to 10000

### 2. Restart Your Service

1. Go to your Render dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Wait for the deployment to complete

### 3. Check Logs for Errors

After deployment, check the logs carefully for any errors:
1. Go to your service dashboard
2. Click "Logs" in the left sidebar
3. Look for any errors related to:
   - Database connection failures
   - Port binding issues
   - CORS configuration problems

## Testing After Deployment

Test the endpoints directly with these commands:

```bash
# Test root endpoint
curl https://bruno-ai-onrender.com/

# Test health endpoint
curl https://bruno-ai-onrender.com/api/health

# Test a basic auth endpoint
curl -X POST https://bruno-ai-onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## Simplified CORS Setup

If you're continuing to have CORS issues, consider using this simplified CORS configuration in your server.js:

```javascript
// At the top of your server.js file, above all other middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.status(200).end();
});
```

## Frontend Configuration

After your API is working correctly, update your Vercel frontend:

1. Go to your Vercel project settings
2. Update the environment variable:
   ```
   REACT_APP_API_URL=https://bruno-ai-onrender.com/api
   ```
3. Trigger a new deployment

The updated code now includes a root endpoint handler and improved CORS configuration, which should fix the "Cannot GET /" error.