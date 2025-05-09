const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Import models
const models = require('../src/database/models');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Login endpoint
  if (req.method === 'POST' && req.url.includes('/login')) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await models.User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );
      
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Register endpoint
  if (req.method === 'POST' && req.url.includes('/register')) {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await models.User.findOne({ where: { email } });
      
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new user
      const user = await models.User.create({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );
      
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error during registration:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Handle unsupported methods or routes
  return res.status(404).json({ error: 'Not found' });
};
