// Vercel serverless function for user login
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('../../api-vercel/middleware/cors');
const errorHandler = require('../../api-vercel/middleware/errorHandler');
const { sequelize } = require('../../api-vercel/config/database');
require('dotenv').config();

// Import or define User model
const User = sequelize.define('User', {
  // Define your user model here or import from a models file
  email: {
    type: sequelize.Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: sequelize.Sequelize.STRING,
    allowNull: false
  },
  name: {
    type: sequelize.Sequelize.STRING,
    allowNull: true
  },
  role: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'user'
  }
}, {
  timestamps: true
});

module.exports = async (req, res) => {
  // Handle CORS
  if (cors(req, res)) return;

  // Only accept POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success with token
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    errorHandler(error, res);
  }
};
