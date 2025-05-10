@echo off
echo Bruno AI Vercel Deployment Script
echo ==================================

REM Check for Vercel CLI
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Copy production environment
echo Setting up production environment...
copy .env.production .env

REM Install dependencies if needed
if not exist node_modules\ (
    echo Installing dependencies...
    npm install
)

REM Login to Vercel if needed
echo Logging in to Vercel (if not already logged in)...
vercel whoami || vercel login

REM Deploy to Vercel
echo Deploying to Vercel...
vercel --prod

echo Deployment complete! Check the Vercel dashboard for details.
