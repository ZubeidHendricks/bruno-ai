import axios from 'axios';

// Create an axios instance with defaults
const apiService = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // Set to false to avoid CORS preflight issues
});

// Add request interceptor to add auth token if available
apiService.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    
    // Get token from localStorage if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
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
    return response;
  },
  (error) => {
    // Log the error for debugging
    console.error('API Error:', error.message);
    
    // Handle specific error cases
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Response error:', error.response.status, error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('authToken');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // Return the error response for handling in components
      return Promise.reject(error.response);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response received');
      
      // Create a custom error object for network issues
      const networkError = {
        status: 0,
        data: {
          error: 'Network Error',
          message: 'Could not connect to the server. Please check your internet connection.'
        }
      };
      
      return Promise.reject(networkError);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Export the service
export default apiService;
