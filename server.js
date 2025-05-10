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

// Fix CORS issues - MUST be before any routes or middleware
// Very permissive CORS for development and debugging
app.use((req, res, next) => {
  // Log the request for debugging
  console.log(`Received ${req.method} request for ${req.url} from origin: ${req.headers.origin}`);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  next();
});

// Also use the cors middleware for good measure
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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
console.log('DB_HOST:', process.env.DB_HOST ? '***SET***' : 'NOT SET');
console.log('DB_URL:', process.env.DB_URL ? '***SET***' : 'NOT SET');
console.log('DB_SSL:', process.env.DB_SSL);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***SET***' : 'NOT SET');
console.log('=======================================');

// Directory for data storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid issues
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
  app.use(morgan('combined'));
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

// Basic authentication endpoints for testing
app.post('/api/auth/register', (req, res) => {
  console.log('Register endpoint hit:', req.body);
  
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: '12345',
        username,
        email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'production' ? 'Registration failed' : error.message
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login endpoint hit:', req.body);
  
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Return success response with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: 'mock-jwt-token-for-testing',
      user: {
        id: '12345',
        username: 'testuser',
        email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: process.env.NODE_ENV === 'production' ? 'Login failed' : error.message
    });
  }
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

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  // Close server and database connections
  server.close(() => {
    console.log('HTTP server closed');
    sequelize.close().then(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  });
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
    
    const server = app.listen(PORT, () => {
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
      const server = app.listen(PORT, () => {
        console.log(`Server running in production mode on port ${PORT} (with errors)`);
      });
      return server;
    }
  }
};

// Start the server and export it for testing
const server = startServer();

module.exports = server;