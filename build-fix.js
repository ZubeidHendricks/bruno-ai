// Script to fix build issues
const fs = require('fs');
const path = require('path');

// Fix apiService.js file
const apiServicePath = path.join(__dirname, 'src', 'services', 'apiService.js');
console.log(`Checking ${apiServicePath}`);

if (fs.existsSync(apiServicePath)) {
  console.log('File exists, updating...');
  let content = fs.readFileSync(apiServicePath, 'utf8');
  
  // Make sure authAPI is properly exported
  if (!content.includes('export const authAPI')) {
    console.log('Adding proper authAPI export...');
    
    // Replace the auth API functions declaration
    content = content.replace(
      /\/\/ Auth API functions[\s\S]*?const auth([^;]*);/m,
      `// Auth API functions\nexport const authAPI$1;`
    );
    
    // Replace the API modules declaration to use authAPI
    content = content.replace(
      /\/\/ Export API modules[\s\S]*?const api([^;]*);/m,
      `// Export API modules\nconst api = {\n  auth: authAPI\n};`
    );
    
    fs.writeFileSync(apiServicePath, content, 'utf8');
    console.log('Updated apiService.js successfully');
  } else {
    console.log('authAPI already properly exported');
  }
} else {
  console.error('apiService.js not found!');
}

// Create a basic working fallback if needed
const fallbackApiServicePath = path.join(__dirname, 'src', 'services', 'apiService.js');
if (!fs.existsSync(fallbackApiServicePath)) {
  console.log('Creating fallback apiService.js...');
  const fallbackContent = `import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiService = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auth API functions
export const authAPI = {
  register: (userData) => apiService.post('/auth/register', userData),
  login: (credentials) => apiService.post('/auth/login', credentials),
  getProfile: () => apiService.get('/auth/profile')
};

// Default export
export default {
  auth: authAPI
};`;
  
  fs.writeFileSync(fallbackApiServicePath, fallbackContent, 'utf8');
  console.log('Created fallback apiService.js');
}

console.log('Build fix complete!');
