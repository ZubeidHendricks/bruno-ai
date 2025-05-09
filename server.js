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

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Directory for data storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

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
      process.exit(1);
    }
    
    // Sync models with database
    if (process.env.NODE_ENV !== 'production') {
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
    process.exit(1);
  }
};

// Start the server and export it for testing
const server = startServer();

module.exports = server;
