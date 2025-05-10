// Vercel serverless function for health check endpoint
const cors = require('../../api-vercel/middleware/cors');
const { testConnection } = require('../../api-vercel/config/database');

module.exports = async (req, res) => {
  // Handle CORS
  if (cors(req, res)) return;

  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    // Return health status
    res.status(200).json({
      status: 'ok',
      message: 'Bruno AI API is running',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking service health',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};
