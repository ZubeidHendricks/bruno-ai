const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const dataRoutes = require('./data');
const analysisRoutes = require('./analysis');
const authRoutes = require('./auth');
const timelineRoutes = require('./timeline');
const logger = require('../../utils/logger');
const { checkHealth } = require('../../services/vectorDatabaseService');

// Mount routes
router.use('/auth', authRoutes);
router.use('/data', dataRoutes);
router.use('/analysis', analysisRoutes);
router.use('/timeline', timelineRoutes);

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = { status: 'healthy' };
    
    // Check vector database connection
    const vectorDbStatus = await checkHealth();
    
    // Check OpenAI API status
    let openaiStatus = { status: 'healthy' };
    try {
      // We don't do an actual API call here to avoid unnecessary costs
      // In a production app, you might want to do a lightweight API call
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        openaiStatus = { 
          status: 'warning',
          message: 'API key not configured'
        };
      }
    } catch (error) {
      openaiStatus = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // Overall system status
    const systemStatus = dbStatus.status === 'healthy' && 
                        vectorDbStatus.status === 'healthy' && 
                        openaiStatus.status === 'healthy' 
                        ? 'healthy' : 'degraded';
    
    res.json({
      status: systemStatus,
      services: {
        database: dbStatus,
        vectorDb: vectorDbStatus,
        openai: openaiStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed:', { error });
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API information endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'Bruno AI Financial Intelligence Platform API',
    version: '1.0.0',
    endpoints: [
      { path: '/api/auth', description: 'Authentication endpoints' },
      { path: '/api/data', description: 'Data transformation endpoints' },
      { path: '/api/analysis', description: 'Financial analysis endpoints' },
      { path: '/api/timeline', description: 'Timeline tracking endpoints' },
      { path: '/api/health', description: 'System health check' }
    ]
  });
});

// Admin-only endpoint for system statistics
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    // In a real app, you would get these stats from the database
    const stats = {
      users: {
        total: 42,
        active: 28,
        newLast7Days: 5
      },
      data: {
        totalDatasets: 156,
        totalTransformations: 842,
        storageUsed: '2.4 GB'
      },
      system: {
        averageResponseTime: '245ms',
        cpuUsage: '32%',
        memoryUsage: '1.2 GB'
      }
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Stats retrieval failed:', { error });
    res.status(500).json({
      error: 'Stats retrieval failed',
      message: error.message
    });
  }
});

// Error handling for the API routes
router.use((err, req, res, next) => {
  logger.error('API error:', { 
    error: err,
    path: req.path,
    method: req.method
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details || err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Authentication error',
      message: err.message
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.id // Assuming you're using a request ID middleware
  });
});

module.exports = router;