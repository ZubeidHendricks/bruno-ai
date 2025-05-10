import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService, { authAPI } from '../services/apiService';

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
          // Get user data from localStorage as fallback
          const userJson = localStorage.getItem('user');
          if (userJson) {
            const userData = JSON.parse(userJson);
            dispatch({ 
              type: ActionTypes.INIT_SUCCESS, 
              payload: userData
            });
          } else {
            dispatch({ type: ActionTypes.INIT_FAILURE });
          }
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
      // Using our authAPI from updated apiService
      const response = await authAPI.login(credentials);
      const data = response.data;
      
      console.log('Login response:', data);
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Store user data
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
      
      dispatch({ 
        type: ActionTypes.LOGIN_SUCCESS, 
        payload: data.user 
      });
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ 
        type: ActionTypes.LOGIN_FAILURE, 
        payload: error.data?.error || 'Login failed. Please try again.' 
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: ActionTypes.LOGIN_START });
    
    try {
      // Using our authAPI from updated apiService
      const response = await authAPI.register(userData);
      const data = response.data;
      
      console.log('Register response:', data);
      return data;
    } catch (error) {
      console.error('Register error:', error);
      dispatch({ 
        type: ActionTypes.LOGIN_FAILURE, 
        payload: error.data?.error || 'Registration failed. Please try again.' 
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

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout
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