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

// Print environment for debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('DB_HOST:', process.env.DB_HOST);

// Directory for data storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory at:', DATA_DIR);
  } catch (error) {
    console.error('Failed to create data directory:', error);
  }
}

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
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
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

// Health check endpoint - must be before other routes for faster health checks
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bruno AI API is running',
    timestamp: new Date().toISOString()
  });
});

// Check if we need to continue with database and API setup
const setupApiRoutes = async () => {
  try {
    // Import database connection - will be skipped in quick health check responses
    const { sequelize, testConnection } = require('./src/config/database');
    
    // Import routes
    const datasetRoutes = require('./src/routes/datasetRoutes');
    const transformationRoutes = require('./src/routes/transformationRoutes');
    const authRoutes = require('./src/routes/authRoutes');
    const dashboardRoutes = require('./src/routes/dashboardRoutes');
    const searchRoutes = require('./src/routes/searchRoutes');
    
    // Import middleware
    const errorHandler = require('./src/middlewares/errorHandler');
    
    // API Routes
    app.use('/api/datasets', datasetRoutes);
    app.use('/api/transformations', transformationRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/search', searchRoutes);
    
    // Static files - only serve if not deployed separately
    if (process.env.SERVE_FRONTEND === 'true') {
      app.use(express.static(path.join(__dirname, 'build')));
      
      // Serve React app for any routes not handled by the API
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
      });
    }
    
    // Error handling middleware
    app.use(errorHandler);
    
    // Test database connection but don't crash if it fails in production
    try {
      const dbConnected = await testConnection();
      
      if (!dbConnected) {
        console.error('Failed to connect to database. Check database configuration and retry.');
        // In production, we might want to retry connection rather than exit
        if (process.env.NODE_ENV !== 'production') {
          console.error('Exiting in development mode due to database connection failure');
          process.exit(1);
        }
      } else {
        console.log('Database connection successful');
        
        // Sync models with database in development mode
        if (process.env.NODE_ENV !== 'production') {
          await sequelize.sync({ alter: true });
          console.log('Database tables synced');
        }
      }
    } catch (error) {
      console.error('Database setup error:', error);
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    }
    
    console.log('API routes successfully set up');
    return true;
  } catch (error) {
    console.error('Failed to set up API routes:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    // Setup API routes asynchronously
    await setupApiRoutes();
    
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
    
    // Set timeout for server operations
    server.timeout = 120000; // 2 minutes
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Start the server
startServer();

// Export for testing
module.exports = app;