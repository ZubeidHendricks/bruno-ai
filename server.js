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

// CORS configuration - MUST BE BEFORE OTHER MIDDLEWARE
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:3000', 'https://bruno-ai-olive.vercel.app'];

console.log('Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply CORS early
app.use(cors(corsOptions));

// Health check endpoint - must be before other middleware for faster health checks
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bruno AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// OPTIONS request handler for preflight CORS
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Add request ID for traceability
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes - EXCEPT health and auth routes
app.use('/api/datasets', apiLimiter);
app.use('/api/transformations', apiLimiter);
app.use('/api/search', apiLimiter);
app.use('/api/dashboard', apiLimiter);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400 // Log only errors in production
  }));
}

// CORS debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Make unavailable routes respond with 503 instead of crashing
const unavailableHandler = (req, res) => {
  res.status(503).json({
    error: 'Service temporarily unavailable',
    message: 'This part of the API is currently unavailable. Please try again later.'
  });
};

// Simple auth route placeholder for testing
app.post('/api/auth/register', (req, res) => {
  console.log('Register route hit', req.body);
  try {
    // Extract user details
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username, email, and password are required' 
      });
    }
    
    // This is a temporary placeholder until the database is working
    res.status(201).json({
      success: true,
      message: 'Temporary registration success. Database integration pending.',
      user: {
        id: '12345',
        username,
        email
      }
    });
  } catch (error) {
    console.error('Error in register route:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login route hit', req.body);
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }
    
    // This is a temporary placeholder until the database is working
    res.status(200).json({
      success: true,
      message: 'Temporary login success. Database integration pending.',
      token: 'temporary-jwt-token',
      user: {
        id: '12345',
        username: 'tempuser',
        email
      }
    });
  } catch (error) {
    console.error('Error in login route:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Setup API routes with error handling
const setupApiRoutes = async () => {
  try {
    // Try to import database models - this is where most errors occur
    let db;
    try {
      db = require('./src/database/models');
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
    } catch (error) {
      console.error('Error loading database models:', error);
      console.warn('Continuing without database models in production mode');
      // In development, we would throw the error
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
    
    // Import routes with error handling
    try {
      if (fs.existsSync('./src/routes/authRoutes.js')) {
        const authRoutes = require('./src/routes/authRoutes');
        app.use('/api/auth', authRoutes);
        console.log('Auth routes loaded successfully');
      } else {
        console.warn('authRoutes.js not found, using placeholder routes');
      }
      
      if (fs.existsSync('./src/routes/datasetRoutes.js')) {
        const datasetRoutes = require('./src/routes/datasetRoutes');
        app.use('/api/datasets', datasetRoutes);
        console.log('Dataset routes loaded successfully');
      } else {
        app.use('/api/datasets', unavailableHandler);
      }
      
      if (fs.existsSync('./src/routes/transformationRoutes.js')) {
        const transformationRoutes = require('./src/routes/transformationRoutes');
        app.use('/api/transformations', transformationRoutes);
        console.log('Transformation routes loaded successfully');
      } else {
        app.use('/api/transformations', unavailableHandler);
      }
      
      if (fs.existsSync('./src/routes/dashboardRoutes.js')) {
        const dashboardRoutes = require('./src/routes/dashboardRoutes');
        app.use('/api/dashboard', dashboardRoutes);
        console.log('Dashboard routes loaded successfully');
      } else {
        app.use('/api/dashboard', unavailableHandler);
      }
      
      if (fs.existsSync('./src/routes/searchRoutes.js')) {
        const searchRoutes = require('./src/routes/searchRoutes');
        app.use('/api/search', searchRoutes);
        console.log('Search routes loaded successfully');
      } else {
        app.use('/api/search', unavailableHandler);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      console.warn('Using fallback routes');
      
      // In production, we want to at least have the API running
      // Even if the database isn't connected
      if (process.env.NODE_ENV === 'production') {
        app.use('/api/datasets', unavailableHandler);
        app.use('/api/transformations', unavailableHandler);
        app.use('/api/dashboard', unavailableHandler);
        app.use('/api/search', unavailableHandler);
      } else {
        throw error;
      }
    }
    
    // Error handling middleware
    let errorHandler;
    try {
      if (fs.existsSync('./src/middlewares/errorHandler.js')) {
        errorHandler = require('./src/middlewares/errorHandler');
        app.use(errorHandler);
        console.log('Error handler loaded successfully');
      } else {
        console.warn('errorHandler.js not found, using default error handler');
      }
    } catch (error) {
      console.error('Error loading error handler:', error);
    }
    
    // Default error handler as fallback
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
    // In production, start server first, then set up routes
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      
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