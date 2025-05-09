import apiService from './apiService';

/**
 * Authentication service to handle all auth operations
 */
const authService = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @returns {Promise} - Login response
   */
  login: async (credentials) => {
    try {
      const response = await apiService.auth.login(credentials);
      
      // Store token and user data
      if (response.token) {
        localStorage.setItem('token', response.token);
        
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Register new user
   * @param {Object} userData - New user data
   * @returns {Promise} - Registration response
   */
  register: async (userData) => {
    try {
      return await apiService.auth.register(userData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Get current user from localStorage
   * @returns {Object|null} - Current user or null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  },
  
  /**
   * Send forgot password request
   * @param {string} email - User email
   * @returns {Promise} - Response
   */
  forgotPassword: async (email) => {
    try {
      return await apiService.auth.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Promise} - Response
   */
  verifyResetToken: async (token) => {
    try {
      return await apiService.auth.verifyResetToken(token);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Reset password using token
   * @param {Object} data - Reset data including token and new password
   * @returns {Promise} - Response
   */
  resetPassword: async (data) => {
    try {
      return await apiService.auth.resetPassword(data);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Change password for authenticated user
   * @param {Object} data - Password change data
   * @returns {Promise} - Response
   */
  changePassword: async (data) => {
    try {
      return await apiService.auth.changePassword(data);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update user profile
   * @param {Object} data - Profile data
   * @returns {Promise} - Response
   */
  updateProfile: async (data) => {
    try {
      const response = await apiService.auth.updateProfile(data);
      
      // Update stored user data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;