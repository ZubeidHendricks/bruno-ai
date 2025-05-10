// Vercel serverless function for user registration
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
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name: name || '',
    });

    // Return success message
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });
  } catch (error) {
    errorHandler(error, res);
  }
};
