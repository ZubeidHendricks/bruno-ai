const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../database/models');

const JWT_SECRET = process.env.JWT_SECRET || 'bruno-ai-secure-jwt-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const SALT_ROUNDS = 10;

/**
 * Register a new user
 */
exports.registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user
    const user = await User.create({
      email: userData.email,
      fullName: userData.fullName,
      passwordHash,
      role: userData.role || 'analyst'
    });

    // Generate API key
    const apiKey = generateApiKey();
    await user.update({ apiKey });

    // Return user without sensitive data
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };
  } catch (error) {
    console.error('Error in registerUser:', error);
    throw error;
  }
};

/**
 * Authenticate user and generate tokens
 */
exports.loginUser = async (email, password) => {
  try {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  } catch (error) {
    console.error('Error in loginUser:', error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Get user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new Error('Invalid token');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return { accessToken };
  } catch (error) {
    console.error('Error in refreshToken:', error);
    throw error;
  }
};

/**
 * Change user password
 */
exports.changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await user.update({ passwordHash });

    return true;
  } catch (error) {
    console.error('Error in changePassword:', error);
    throw error;
  }
};

/**
 * Reset user password (admin function)
 */
exports.resetPassword = async (userId, adminId) => {
  try {
    // Find admin
    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    // Update password
    await user.update({ passwordHash });

    return { tempPassword };
  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw error;
  }
};

/**
 * Verify API key
 */
exports.verifyApiKey = async (apiKey) => {
  try {
    const user = await User.findOne({ where: { apiKey } });
    if (!user) {
      throw new Error('Invalid API key');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('Error in verifyApiKey:', error);
    throw error;
  }
};

/**
 * Generate access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Generate API key
 */
const generateApiKey = () => {
  const timestamp = new Date().getTime().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `bapi_${timestamp}${random}`;
};

/**
 * Generate temporary password
 */
const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};