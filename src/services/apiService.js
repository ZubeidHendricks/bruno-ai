import axios from 'axios';

// Base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Dataset API functions
export const datasetApi = {
  getAllDatasets: async () => {
    try {
      const response = await axios.get(`${API_URL}/datasets`);
      return response.data;
    } catch (error) {
      console.error('Error fetching datasets:', error);
      throw error;
    }
  },
  
  getDataset: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/datasets/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dataset:', error);
      throw error;
    }
  },
  
  uploadDataset: async (fileData, fileName, userId = 1) => {
    try {
      const response = await axios.post(`${API_URL}/upload`, {
        fileData,
        fileName,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading dataset:', error);
      throw error;
    }
  }
};

// Transformation API functions
export const transformationApi = {
  getAllTransformations: async () => {
    try {
      const response = await axios.get(`${API_URL}/transformations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transformations:', error);
      throw error;
    }
  },
  
  getDatasetTransformations: async (datasetId) => {
    try {
      const response = await axios.get(`${API_URL}/datasets/${datasetId}/transformations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dataset transformations:', error);
      throw error;
    }
  },
  
  processTransformation: async (message, datasetId, userId = 1) => {
    try {
      const response = await axios.post(`${API_URL}/chat/transform`, {
        message,
        datasetId,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error processing transformation:', error);
      throw error;
    }
  }
};

// Dashboard API functions
export const dashboardApi = {
  getDashboardData: async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};

// Authentication API functions
export const authApi = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      // Store token in local storage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  }
};

// Search API functions
export const searchApi = {
  search: async (query) => {
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  }
};

// File handling utility functions
export const fileUtils = {
  readFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  },
  
  downloadCSV: (data, filename = 'download.csv') => {
    if (!data) return;
    
    // Convert to CSV if data is an array of objects
    let csvContent = '';
    
    if (Array.isArray(data)) {
      // Get headers
      const headers = Object.keys(data[0] || {});
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvContent += values.join(',') + '\n';
      });
    } else {
      // Assume data is already CSV format
      csvContent = data;
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Set up axios interceptors to handle authentication
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Create a single export object for convenience
const api = {
  datasets: datasetApi,
  transformations: transformationApi,
  dashboard: dashboardApi,
  auth: authApi,
  search: searchApi,
  files: fileUtils
};

export default api;
