# CORS Issue Fix for Bruno AI

This guide addresses the Cross-Origin Resource Sharing (CORS) issue between your Vercel frontend and Render backend.

## The Issue

You're seeing this error in your browser console:

```
Access to XMLHttpRequest at 'https://bruno-ai-api.onrender.com/api/auth/register' 
from origin 'https://bruno-ai-olive.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This means your backend API isn't properly configured to allow requests from your frontend domain.

## The Fix

I've implemented two layers of CORS protection to ensure your API works correctly:

1. **Custom CORS Middleware** at the top of your server.js:
   ```javascript
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
     
     if (req.method === 'OPTIONS') {
       return res.status(200).end();
     }
     
     next();
   });
   ```

2. **CORS Package** configuration:
   ```javascript
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST', 'PUT, DELETE, OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
   }));
   ```

3. **Direct Registration/Login Handlers** as backup routes:
   ```javascript
   app.post('/api/auth/register', (req, res) => { ... });
   app.post('/api/auth/login', (req, res) => { ... });
   ```

## Deployment Steps

1. Push these changes to GitHub:
   ```bash
   git add .
   git commit -m "Fix CORS issues between Vercel frontend and Render backend"
   git push origin main
   ```

2. Redeploy your backend on Render:
   - Go to your Render dashboard
   - Click "Manual Deploy" → "Clear build cache & deploy"

3. Wait for the deployment to complete and test your frontend again

## Testing CORS Configuration

You can test if CORS is properly configured with this curl command:

```bash
curl -X OPTIONS https://bruno-ai-api.onrender.com/api/auth/register \
  -H "Origin: https://bruno-ai-olive.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v
```

The response should include:
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
< Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
```

## Verifying the Fix

After deployment, try registering on your frontend again. The console should no longer show CORS errors.

## Long-term CORS Security

For better security in the future, replace the wildcard `*` with your specific Vercel domain:

```javascript
const allowedOrigins = ['https://bruno-ai-olive.vercel.app'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT, DELETE, OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```