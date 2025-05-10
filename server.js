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

// Add a root path endpoint for health checks and debugging
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bruno AI API server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Import database connection
const { sequelize, testConnection } = require('./src/config/database');

// Import routes
const datasetRoutes = require('./src/routes/datasetRoutes');
const transformationRoutes = require('./src/routes/transformationRoutes');
const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const searchRoutes = require('./src/routes/searchRoutes');

// Import middleware
const errorHandler = require('./src/middlewares/errorHandler');

// Print environment variables for debugging (without sensitive info)
console.log('========== ENVIRONMENT INFO ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('DB_HOST:', process.env.POSTGRES_HOST ? '***SET***' : 'NOT SET');
console.log('DB_USER:', process.env.POSTGRES_USER ? '***SET***' : 'NOT SET');
console.log('DB_URL:', process.env.DB_URL ? '***SET***' : 'NOT SET');
console.log('DB_SSL:', process.env.DB_SSL);
console.log('=======================================');

// Directory for data storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple CORS configuration - enable for all origins during debugging
app.use(cors());

// Provide more explicit CORS headers for troubleshooting
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bruno AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/datasets', datasetRoutes);
app.use('/api/transformations', transformationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Define server variable before using it
let server;

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (server) {
    // Only close the server if it exists
    server.close(() => {
      console.log('HTTP server closed');
      sequelize.close().then(() => {
        console.log('Database connections closed');
        process.exit(0);
      });
    });
  } else {
    console.log('No HTTP server to close');
    sequelize.close().then(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  }
});

// Start server
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Check database configuration and retry.');
      // Continue in production, but exit in development
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
      console.warn('Continuing without database connection in production mode');
    }
    
    // Sync models with database
    if (process.env.NODE_ENV !== 'production' && dbConnected) {
      await sequelize.sync({ alter: true });
      console.log('Database tables synced');
    }
    
    server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
    
    // Set timeout for server operations
    server.timeout = 120000; // 2 minutes
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      // Try to start server anyway in production
      server = app.listen(PORT, () => {
        console.log(`Server running in production mode on port ${PORT} (with errors)`);
      });
      return server;
    }
  }
};

// Start the server and export it for testing
server = startServer();

module.exports = server;