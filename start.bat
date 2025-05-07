@echo off
echo Starting Vector-Based Financial Intelligence Platform...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo Please update .env with your API keys before running again.
    pause
    exit /b
)

REM Start Weaviate in Docker (if not running)
echo Checking Weaviate status...
docker ps | find "weaviate" >nul
if errorlevel 1 (
    echo Starting Weaviate...
    docker run -d -p 8080:8080 --name weaviate semitechnologies/weaviate:latest
)

REM Start the application
echo Starting application...
npm run dev

pause
