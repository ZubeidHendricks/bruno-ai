const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const models = require('../database/models');

// Handle user login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await models.User.findOne({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await user.update({ lastLogin: new Date() });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'bruno-ai-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Login failed' : error.message,
      requestId: req.id
    });
  }
};

// Handle user registration
const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user exists
    const existingUser = await models.User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await models.User.create({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || username,
      lastLogin: new Date()
    });
    
    // Create default user preferences
    await models.UserPreference.create({
      userId: user.id,
      theme: 'light',
      language: 'en',
      notifications: true
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'bruno-ai-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Registration failed' : error.message,
      requestId: req.id
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Ensure the user can only access their own profile
    if (req.user.id !== parseInt(userId) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied: You can only view your own profile' });
    }
    
    const user = await models.User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'fullName', 'createdAt', 'lastLogin'],
      include: [
        {
          model: models.UserPreference,
          attributes: ['theme', 'language', 'notifications']
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user statistics
    const datasetCount = await models.FinancialDataset.count({ where: { userId } });
    const transformationCount = await models.DataTransformation.count({ where: { userId } });
    
    res.json({
      user,
      stats: {
        datasetCount,
        transformationCount
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Failed to fetch user profile' : error.message,
      requestId: req.id
    });
  }
};

module.exports = {
  login,
  register,
  getUserProfile
};
