/**
 * CORS Proxy Service
 * 
 * This service helps bypass CORS restrictions when the backend
 * doesn't properly support cross-origin requests.
 */

const CORS_PROXY_URLS = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// Choose which proxy to use (can be changed if one stops working)
const ACTIVE_PROXY_INDEX = 1;

/**
 * Wraps a URL with a CORS proxy
 * @param {string} url - The original URL to call
 * @returns {string} The proxied URL
 */
export const proxyUrl = (url) => {
  if (url.startsWith('http')) {
    return `${CORS_PROXY_URLS[ACTIVE_PROXY_INDEX]}${encodeURIComponent(url)}`;
  }
  return url;
};

/**
 * Determines if we need to use a CORS proxy
 * Based on environment and configuration
 */
export const shouldUseProxy = () => {
  // Use proxy in production or if forced via an environment variable
  return process.env.REACT_APP_USE_CORS_PROXY === 'true' || 
         process.env.NODE_ENV === 'production';
};

export default {
  proxyUrl,
  shouldUseProxy
};