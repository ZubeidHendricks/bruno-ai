require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Print environment variables for debugging (without sensitive info)
console.log('========== ENVIRONMENT INFO ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('DB_HOST:', process.env.DB_HOST ? '***SET***' : 'NOT SET');
console.log('DB_URL:', process.env.DB_URL ? '***SET***' : 'NOT SET');
console.log('DB_SSL:', process.env.DB_SSL);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***SET***' : 'NOT SET');
console.log('=======================================');

// Directory for data storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory at:', DATA_DIR);
  } catch (error) {
    console.error('Failed to create data directory:', error);
    // Continue anyway
  }
}

// Health check endpoint - must be before other middleware for faster health checks
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bruno AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// Add request ID for traceability
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400 // Log only errors in production
  }));
}

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:3000', 'https://bruno-ai-olive.vercel.app'];

console.log('Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Make unavailable routes respond with 503 instead of crashing
const unavailableHandler = (req, res) => {
  res.status(503).json({
    error: 'Service temporarily unavailable',
    message: 'This part of the API is currently unavailable. Please try again later.'
  });
};

// Setup API routes with error handling
const setupApiRoutes = async () => {
  try {
    // Import routes - with fallbacks for production
    let authRoutes, datasetRoutes, transformationRoutes, dashboardRoutes, searchRoutes, errorHandler;
    
    try {
      // Try to import database models - this is where most errors occur
      const db = require('./src/database/models');
      console.log('Database models loaded successfully');
      
      // Test database connection but don't crash if it fails in production
      try {
        await db.testConnection();
      } catch (error) {
        console.error('Database connection test failed:', error);
        if (process.env.NODE_ENV !== 'production') {
          throw error;
        }
      }
      
      // Import routes
      try {
        authRoutes = require('./src/routes/authRoutes');
        datasetRoutes = require('./src/routes/datasetRoutes');
        transformationRoutes = require('./src/routes/transformationRoutes');
        dashboardRoutes = require('./src/routes/dashboardRoutes');
        searchRoutes = require('./src/routes/searchRoutes');
        errorHandler = require('./src/middlewares/errorHandler');
        
        // Setup routes
        app.use('/api/auth', authRoutes);
        app.use('/api/datasets', datasetRoutes);
        app.use('/api/transformations', transformationRoutes);
        app.use('/api/search', searchRoutes);
        app.use('/api/dashboard', dashboardRoutes);
        
        console.log('API routes loaded successfully');
      } catch (error) {
        console.error('Error loading routes:', error);
        if (process.env.NODE_ENV === 'production') {
          // In production, provide unavailable responses
          app.use('/api/auth', unavailableHandler);
          app.use('/api/datasets', unavailableHandler);
          app.use('/api/transformations', unavailableHandler);
          app.use('/api/search', unavailableHandler);
          app.use('/api/dashboard', unavailableHandler);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Critical error loading database or routes:', error);
      if (process.env.NODE_ENV === 'production') {
        // In production, provide unavailable responses
        app.use('/api/auth', unavailableHandler);
        app.use('/api/datasets', unavailableHandler);
        app.use('/api/transformations', unavailableHandler);
        app.use('/api/search', unavailableHandler);
        app.use('/api/dashboard', unavailableHandler);
      } else {
        throw error;
      }
    }
    
    // Static files - only serve if not deployed separately
    if (process.env.SERVE_FRONTEND === 'true') {
      app.use(express.static(path.join(__dirname, 'build')));
      
      // Serve React app for any routes not handled by the API
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
      });
    }
    
    // Error handling middleware
    if (errorHandler) {
      app.use(errorHandler);
    } else {
      // Fallback error handler
      app.use((err, req, res, next) => {
        console.error('Unhandled error:', err);
        res.status(500).json({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message,
          requestId: req.id
        });
      });
    }
    
    console.log('API routes successfully set up');
    return true;
  } catch (error) {
    console.error('Failed to set up API routes:', error);
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    // Setup API routes asynchronously - but don't wait for it in production
    if (process.env.NODE_ENV === 'production') {
      // In production, start server first, then set up routes
      const server = app.listen(PORT, () => {
        console.log(`Server running in production mode on port ${PORT}`);
        
        // Setup routes after server is started
        setupApiRoutes().catch(err => {
          console.error('Error setting up API routes:', err);
        });
      });
      
      // Set timeout for server operations
      server.timeout = 120000; // 2 minutes
      
      // Graceful shutdown handling
      setupShutdownHandlers(server);
      
      return server;
    } else {
      // In development, wait for routes to be set up before starting server
      await setupApiRoutes();
      
      const server = app.listen(PORT, () => {
        console.log(`Server running in development mode on port ${PORT}`);
      });
      
      // Set timeout for server operations
      server.timeout = 120000; // 2 minutes
      
      // Graceful shutdown handling
      setupShutdownHandlers(server);
      
      return server;
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      // In production, try to start anyway
      const server = app.listen(PORT, () => {
        console.log(`Server running in production mode on port ${PORT} (with errors)`);
      });
      
      return server;
    }
  }
};

// Handle graceful shutdown
const setupShutdownHandlers = (server) => {
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  });
};

// Start the server
startServer();

// Export for testing
module.exports = app;