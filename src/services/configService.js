// Configuration service to handle dynamic config loading
const getConfig = () => {
  // Try to get config from window object (set by public/config.js)
  if (window.BRUNO_CONFIG) {
    console.log('Using runtime config:', window.BRUNO_CONFIG);
    return window.BRUNO_CONFIG;
  }
  
  // Fallback to environment variables
  return {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    DEBUG: process.env.REACT_APP_DEBUG === 'true'
  };
};

export default getConfig;