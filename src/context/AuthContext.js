import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/apiService';

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

// Action types
const ActionTypes = {
  INIT_START: 'INIT_START',
  INIT_SUCCESS: 'INIT_SUCCESS',
  INIT_FAILURE: 'INIT_FAILURE',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  PROFILE_LOADING: 'PROFILE_LOADING',
  PROFILE_SUCCESS: 'PROFILE_SUCCESS',
  PROFILE_FAILURE: 'PROFILE_FAILURE'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.INIT_START:
      return {
        ...state,
        loading: true
      };
    case ActionTypes.INIT_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.INIT_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      };
    case ActionTypes.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case ActionTypes.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null
      };
    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case ActionTypes.PROFILE_LOADING:
      return {
        ...state,
        loading: true
      };
    case ActionTypes.PROFILE_SUCCESS:
      return {
        ...state,
        user: action.payload,
        loading: false
      };
    case ActionTypes.PROFILE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: ActionTypes.INIT_START });
      
      try {
        // Check if there's a token in localStorage
        const token = localStorage.getItem('token');
        
        if (token) {
          // Get user profile data from the API
          const userData = await apiService.auth.getProfile();
          
          dispatch({ 
            type: ActionTypes.INIT_SUCCESS, 
            payload: userData.user 
          });
        } else {
          dispatch({ type: ActionTypes.INIT_FAILURE });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Clear token in case of error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        dispatch({ type: ActionTypes.INIT_FAILURE });
      }
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: ActionTypes.LOGIN_START });
    
    try {
      const response = await apiService.auth.login(credentials);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        
        // Store user data
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      }
      
      dispatch({ 
        type: ActionTypes.LOGIN_SUCCESS, 
        payload: response.user 
      });
      
      return response;
    } catch (error) {
      dispatch({ 
        type: ActionTypes.LOGIN_FAILURE, 
        payload: error.displayMessage || 'Login failed. Please try again.' 
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: ActionTypes.LOGIN_START });
    
    try {
      const response = await apiService.auth.register(userData);
      return response;
    } catch (error) {
      dispatch({ 
        type: ActionTypes.LOGIN_FAILURE, 
        payload: error.displayMessage || 'Registration failed. Please try again.' 
      });
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: ActionTypes.LOGOUT });
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    dispatch({ type: ActionTypes.PROFILE_LOADING });
    
    try {
      const response = await apiService.auth.updateProfile(profileData);
      
      // Update localStorage
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      dispatch({ 
        type: ActionTypes.PROFILE_SUCCESS, 
        payload: response.user 
      });
      
      return response;
    } catch (error) {
      dispatch({ 
        type: ActionTypes.PROFILE_FAILURE, 
        payload: error.displayMessage || 'Failed to update profile' 
      });
      throw error;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await apiService.auth.changePassword(passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await apiService.auth.forgotPassword(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (data) => {
    try {
      const response = await apiService.auth.resetPassword(data);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Verify reset token
  const verifyResetToken = async (token) => {
    try {
      const response = await apiService.auth.verifyResetToken(token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyResetToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;