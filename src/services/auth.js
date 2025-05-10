import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

// Auth API functions
export const authService = {
  register: (userData) => {
    console.log('Registering user with data:', userData);
    return apiClient.post('/auth/register', userData);
  },
  
  login: (credentials) => {
    console.log('Logging in with credentials:', credentials);
    return apiClient.post('/auth/login', credentials);
  },
  
  getProfile: () => {
    console.log('Getting user profile');
    return apiClient.get('/auth/profile');
  },
  
  // For testing
  ping: () => {
    console.log('Pinging API at:', API_URL);
    return apiClient.get('/health');
  }
};

export default authService;