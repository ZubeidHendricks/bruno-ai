import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Log API URL for debugging
console.log('API URL:', API_URL);

// Create an axios instance with defaults
const apiService = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // Important to avoid CORS preflight issues
});

// Add request interceptor for debugging
apiService.interceptors.request.use(
  (config) => {
    console.log(`Sending ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiService.interceptors.response.use(
  (response) => {
    console.log(`Received response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    
    // For network errors or CORS issues
    if (!error.response) {
      return Promise.reject({
        status: 0,
        data: {
          error: 'Network Error',
          message: 'Could not connect to the server. Please check your internet connection or server status.'
        }
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
const auth = {
  register: (userData) => apiService.post('/auth/register', userData),
  login: (credentials) => apiService.post('/auth/login', credentials),
  getProfile: () => apiService.get('/auth/profile')
};

// Export API modules
const api = {
  auth
};

// Export the service for direct use
export default api;