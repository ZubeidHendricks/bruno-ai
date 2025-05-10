const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes - this is important for Vercel frontend
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint called');
  res.status(200).json({
    status: 'ok',
    message: 'Basic API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint called');
  res.status(200).json({
    message: 'Bruno AI API server',
    endpoints: ['/api/health', '/api/auth/register', '/api/auth/login']
  });
});

// Authentication routes
app.post('/api/auth/register', (req, res) => {
  console.log('Register endpoint called', req.body);
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username, email, and password are required' 
      });
    }
    
    // This is a simple mock response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: 'test-user-id',
        username,
        email
      }
    });
  } catch (error) {
    console.error('Error in register endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login endpoint called', req.body);
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }
    
    // This is a simple mock response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: 'mock-jwt-token',
      user: {
        id: 'test-user-id',
        username: 'testuser',
        email
      }
    });
  } catch (error) {