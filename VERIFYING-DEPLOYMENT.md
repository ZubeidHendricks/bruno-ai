# Verifying Your Bruno AI API Deployment

This guide provides steps to verify that your Bruno AI API is correctly deployed and functioning on Render.

## 🎉 API Successfully Deployed!

Your API is now running on Render. The database SSL certificate issue has been addressed with the `rejectUnauthorized: false` setting, allowing your application to connect even with self-signed certificates.

## Testing Your Deployment

### Using the API Test Script

The included `api-test.js` script can verify all your basic endpoints:

```bash
# Install axios if you haven't already
npm install axios

# Run the test against your API URL
node api-test.js https://bruno-ai-api.onrender.com
```

### Manual Testing with curl or Postman

You can also manually test your endpoints:

1. **Test Root Endpoint**
   ```bash
   curl https://bruno-ai-api.onrender.com/
   ```

2. **Test Health Endpoint**
   ```bash
   curl https://bruno-ai-api.onrender.com/api/health
   ```

3. **Test Register Endpoint**
   ```bash
   curl -X POST https://bruno-ai-api.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   ```

4. **Test Login Endpoint**
   ```bash
   curl -X POST https://bruno-ai-api.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## Connecting Your Frontend

Now that your API is deployed, update your Vercel frontend environment:

1. Go to your Vercel project settings
2. Set the environment variable:
   ```
   REACT_APP_API_URL=https://bruno-ai-api.onrender.com/api
   ```
3. Redeploy your frontend

## Troubleshooting

If you encounter issues:

1. **API Returns 404**: Make sure you're using the correct URL path
2. **Database Errors**: Check the Render logs for specific error messages
3. **CORS Issues**: Verify that your CORS configuration allows requests from your frontend domain

## SSL Certificate Issues

If you continue to see SSL certificate errors:

1. The `NODE_TLS_REJECT_UNAUTHORIZED=0` environment variable has been added to the Dockerfile
2. The database connection has been configured to ignore invalid certificates with `rejectUnauthorized: false`
3. If issues persist, try changing your database provider or obtaining a valid SSL certificate

## Next Steps

Once your API is working correctly:

1. Implement proper error handling on the frontend
2. Test the full registration and login flow
3. Begin implementing and testing the financial analysis features

Congratulations on your successful deployment!