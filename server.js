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

// Load custom CORS middleware
const corsMiddleware = require('./src/middlewares/cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// =========== CORS HANDLING - MUST BE FIRST ===========
// Use custom CORS middleware
app.use(corsMiddleware);

// Also use the cors package for good measure
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle OPTIONS requests globally
app.options('*', (req, res) => {
  res.status(200).end();
});
// ==========================================

// Add request logging right after CORS handling
app.use(morgan('combined'));

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

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Add request ID for traceability
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin resource sharing
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to some API routes (but not auth)
app.use('/api/datasets', apiLimiter);
app.use('/api/transformations', apiLimiter);
app.use('/api/dashboard', apiLimiter);
app.use('/api/search', apiLimiter);

// Root path endpoint for health checks and debugging
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bruno AI API server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bruno AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Direct auth endpoints for testing and backup
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

// Load the database and routes if we're not in a minimal CORS test mode
if (process.env.MINIMAL_MODE !== 'true') {
  try {
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

    // API Routes - apply after direct endpoints above
    app.use('/api/datasets', datasetRoutes);
    app.use('/api/transformations', transformationRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/search', searchRoutes);

    // Serve React app in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, 'build')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
      });
    }

    // Error handling middleware
    app.use(errorHandler);

    // Start server with database connection
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
        console.error('Failed to start server with database:', error);
        startWithoutDatabase();
      }
    };

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

    // Start the server with database
    const server = startServer();
  } catch (error) {
    console.error('Error loading database or routes:', error);
    startWithoutDatabase();
  }
} else {
  // Start without database in minimal mode
  startWithoutDatabase();
}

// Simple start without database
function startWithoutDatabase() {
  console.log('Starting server without database connection...');
  
  app.listen(PORT, () => {
    console.log(`Server running in minimal mode on port ${PORT}`);
  });
}

// Export for testing
module.exports = app;