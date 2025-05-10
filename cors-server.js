// Minimal Express server for CORS testing
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// CORS middleware - MUST BE FIRST
app.use((req, res, next) => {
  // Set CORS headers for all origins
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`Handling OPTIONS request from ${req.headers.origin || 'unknown'}`);
    return res.status(200).end();
  }
  
  console.log(`${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
  next();
});

// Parse JSON bodies
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CORS Test Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Health check passed',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Register endpoint hit:', req.body);
  
  res.json({
    success: true,
    message: 'Test registration successful',
    user: {
      id: 'test-id',
      username: req.body.username || 'testuser',
      email: req.body.email || 'test@example.com'
    }
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login endpoint hit:', req.body);
  
  res.json({
    success: true,
    message: 'Test login successful',
    token: 'test-jwt-token',
    user: {
      id: 'test-id',
      username: 'testuser',
      email: req.body.email || 'test@example.com'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`CORS test server running on port ${PORT}`);
  console.log(`Test at http://localhost:${PORT}/`);
});