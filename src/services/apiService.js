import axios from 'axios';

// Create axios instance with base URL from environment variables
const API_URL = process.env.REACT_APP_API_URL || '/api';
const DEBUG = process.env.REACT_APP_DEBUG === 'true';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
});

// Logger function that only logs in debug mode
const log = (message, data) => {
  if (DEBUG) {
    console.log(message, data);
  }
};

// Error logger function that only logs in debug mode
const logError = (message, error) => {
  if (DEBUG) {
    console.error(message, error);
  }
};

// Add a request interceptor to include auth token in all requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    logError('API request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle session expiration
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Check if it's not a login attempt
      if (!error.config.url.includes('/auth/login')) {
        // Clear localStorage and refresh page
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    
    // Extract error message from response
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Something went wrong';
    
    // Add the error message to the error object for easier access
    error.displayMessage = errorMessage;
    
    // Log detailed error information in debug mode
    logError('API response error:', {
      status: error.response?.status,
      message: errorMessage,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    });
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
const auth = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
  
  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/reset-password/${token}/verify`);
    return response.data;
  },
  
  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  }
};

// Dataset API endpoints
const datasets = {
  getAll: async () => {
    const response = await api.get('/datasets');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/datasets/${id}`);
    return response.data;
  },
  
  uploadBase64: async (fileData) => {
    const response = await api.post('/datasets/upload', fileData);
    return response.data;
  },
  
  uploadFile: async (formData) => {
    const response = await api.post('/datasets/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/datasets/${id}`);
    return response.data;
  },
  
  export: async (id, data) => {
    const response = await api.post(`/datasets/${id}/export`, data, {
      responseType: 'blob'
    });
    return response;
  }
};

// Transformation API endpoints
const transformations = {
  getAll: async (datasetId) => {
    const url = datasetId 
      ? `/transformations?datasetId=${datasetId}` 
      : '/transformations';
    const response = await api.get(url);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/transformations/${id}`);
    return response.data;
  },
  
  create: async (transformation) => {
    const response = await api.post('/transformations', transformation);
    return response.data;
  },
  
  update: async (id, transformation) => {
    const response = await api.put(`/transformations/${id}`, transformation);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/transformations/${id}`);
    return response.data;
  }
};

// Reports API endpoints
const reports = {
  getAll: async () => {
    const response = await api.get('/reports');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },
  
  create: async (report) => {
    const response = await api.post('/reports', report);
    return response.data;
  },
  
  update: async (id, report) => {
    const response = await api.put(`/reports/${id}`, report);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
  
  export: async (id, format) => {
    const response = await api.get(`/reports/${id}/export?format=${format}`, {
      responseType: 'blob'
    });
    return response;
  },
  
  share: async (id, shareData) => {
    const response = await api.post(`/reports/${id}/share`, shareData);
    return response.data;
  }
};

// Dashboard API endpoints
const dashboard = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
  
  getActivityLog: async (params) => {
    const response = await api.get('/dashboard/activity', { params });
    return response.data;
  },
  
  getAnalytics: async (timeframe) => {
    const response = await api.get(`/dashboard/analytics?timeframe=${timeframe}`);
    return response.data;
  }
};

// User management API endpoints (for admin)
const users = {
  getAll: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  
  updateRole: async (id, role) => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  }
};

// Settings API endpoints
const settings = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  
  update: async (settings) => {
    const response = await api.put('/settings', settings);
    return response.data;
  }
};

// Export all API modules
export default {
  auth,
  datasets,
  transformations,
  reports,
  dashboard,
  users,
  settings
<<<<<<< HEAD
};
=======
};
>>>>>>> febae6c (Add production-ready API integration)
