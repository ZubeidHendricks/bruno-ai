# Deploying Bruno AI Backend to Render

This guide contains updated instructions for deploying the Bruno AI backend to Render.com after addressing the Docker build issues.

## Deployment Options

Choose one of these approaches based on your requirements:

### Option 1: Docker Deployment (Recommended)

1. Log in to your Render account
2. Click on "New +" in the top right and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `bruno-ai-api`
   - **Environment**: `Docker`
   - **Build Command**: Leave empty (uses Dockerfile)
   - **Start Command**: Leave empty (uses Dockerfile)
   - **Plan**: Select the appropriate plan (Free or Starter tier for development)

### Option 2: Node.js Deployment

1. Log in to your Render account
2. Click on "New +" in the top right and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `bruno-ai-api`
   - **Environment**: `Node`
   - **Build Command**: `chmod +x setup-render.sh && ./setup-render.sh`
   - **Start Command**: `node server.js`
   - **Plan**: Select the appropriate plan (Free or Starter tier for development)

## Environment Variables

Add these environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=10000
DB_URL=postgres://postgres.vatitwmdtipuemrvxpne:RqNtxWvpcw6DiKzf@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
DB_SSL=true

JWT_SECRET=generate-a-secure-random-string-here
CORS_ORIGIN=https://bruno-ai-olive.vercel.app
```

If you prefer to use individual connection parameters:

```
DB_USERNAME=postgres
DB_PASSWORD=RqNtxWvpcw6DiKzf
DB_NAME=postgres
DB_HOST=db.vatitwmdtipuemrvxpne.supabase.co
DB_PORT=5432
DB_SSL=true
```

## Troubleshooting Common Issues

### npm ci Failures

If you encounter "npm ci" failures:
- The Docker deployment uses `npm install` instead which is more lenient
- The Node.js deployment uses `setup-render.sh` which also uses `npm install`

### Database Connection Issues

If you see database connection errors:
- Check that the database URL or credentials are correct
- Verify SSL settings (DB_SSL=true is usually required for Supabase)
- Check that your database allows connections from Render IP addresses

### CORS Issues

If your frontend can't connect:
- Ensure CORS_ORIGIN includes your Vercel frontend URL
- Check for any typos in the URL

## Verifying the Deployment

After deployment:

1. Test the health endpoint:
   ```
   curl https://bruno-ai-api.onrender.com/api/health
   ```

2. Update your frontend configuration:
   - Go to your Vercel project settings
   - Add/update `REACT_APP_API_URL=https://bruno-ai-api.onrender.com/api`

## Security Notes

After successful deployment, rotate your database credentials since they have been exposed.

## Monitoring

Enable health check alerts in your Render dashboard to be notified of any downtime.