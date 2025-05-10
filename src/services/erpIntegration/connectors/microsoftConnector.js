/**
 * Microsoft Dynamics Connector
 * Provides connection and authentication for Microsoft Dynamics 365 Finance and Operations
 */

const axios = require('axios');
const { createLogger } = require('../../../utils/logger');
const { MicrosoftError } = require('../utils/errors');

/**
 * Microsoft Dynamics Connector
 */
class MicrosoftConnector {
  /**
   * Create a Microsoft Dynamics connector
   * @param {Object} config - Connection configuration
   */
  constructor(config) {
    this.config = {
      baseUrl: config.baseUrl,
      tenantId: config.tenantId,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      resource: config.resource || 'https://dynamics.microsoft.com',
      timeout: config.timeout || 30000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      ...config
    };
    
    this.logger = createLogger('microsoftConnector');
    this.client = null;
    this.tokenInfo = null;
  }
  
  /**
   * Connect to Microsoft Dynamics
   * @returns {Object} - Connection object
   */
  async connect() {
    try {
      this.logger.info('Connecting to Microsoft Dynamics 365');
      
      // Create axios client with default config
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        }
      });
      
      // Add request interceptor for authentication
      this.client.interceptors.request.use(
        async (config) => {
          // Add authentication token
          const token = await this.getAuthToken();
          config.headers['Authorization'] = `Bearer ${token}`;
          
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
      
      // Add response interceptor for error handling and retries
      this.client.interceptors.response.use(
        (response) => {
          return response;
        },
        async (error) => {
          const originalRequest = error.config;
          
          // Retry logic for timeouts and 5xx errors
          if (
            (error.code === 'ECONNABORTED' || 
             (error.response && error.response.status >= 500)) && 
            originalRequest._retry < this.config.maxRetries
          ) {
            originalRequest._retry = (originalRequest._retry || 0) + 1;
            
            this.logger.warn(`Retrying request (${originalRequest._retry}/${this.config.maxRetries})`, {
              url: originalRequest.url,
              method: originalRequest.method,
              error: error.message
            });
            
            // Exponential backoff
            const delay = Math.pow(2, originalRequest._retry) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.client(originalRequest);
          }
          
          // Handle token expiration
          if (error.response && error.response.status === 401 && this.tokenInfo) {
            this.logger.info('Authentication token expired, refreshing');
            this.tokenInfo = null;
            
            // Don't retry if already retrying authentication
            if (originalRequest._authRetry) {
              return Promise.reject(error);
            }
            
            originalRequest._authRetry = true;
            
            // Get new token and retry
            const token = await this.getAuthToken();
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            
            return this.client(originalRequest);
          }
          
          return Promise.reject(error);
        }
      );
      
      // Test connection with a simple request
      await this.testConnection();
      
      this.logger.info('Successfully connected to Microsoft Dynamics 365');
      
      return {
        client: this.client,
        config: this.config
      };
    } catch (error) {
      this.logger.error('Error connecting to Microsoft Dynamics 365:', error);
      throw new MicrosoftError(`Failed to connect to Microsoft Dynamics 365: ${error.message}`);
    }
  }
  
  /**
   * Get authentication token
   * @returns {string} - Authentication token
   */
  async getAuthToken() {
    try {
      // Check if token exists and is still valid
      if (this.tokenInfo && this.tokenInfo.expiresAt > Date.now()) {
        return this.tokenInfo.token;
      }
      
      this.logger.info('Getting new Microsoft Dynamics authentication token');
      
      // Microsoft uses OAuth for authentication
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);
      params.append('resource', this.config.resource);
      
      const response = await axios.post(
        `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.data || !response.data.access_token) {
        throw new MicrosoftError('Invalid response when getting OAuth token');
      }
      
      this.tokenInfo = {
        token: response.data.access_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000)
      };
      
      return this.tokenInfo.token;
    } catch (error) {
      this.logger.error('Error getting Microsoft Dynamics authentication token:', error);
      throw new MicrosoftError(`Failed to get Microsoft Dynamics authentication token: ${error.message}`);
    }
  }
  
  /**
   * Test the connection to Microsoft Dynamics
   * @returns {boolean} - Whether connection is successful
   */
  async testConnection() {
    try {
      // Make a simple request to test connection
      await this.client.get('/data/Customers?$top=1');
      
      return true;
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      throw new MicrosoftError(`Connection test failed: ${error.message}`);
    }
  }
  
  /**
   * Disconnect from Microsoft Dynamics
   */
  async disconnect() {
    this.logger.info('Disconnecting from Microsoft Dynamics 365');
    
    // Clear token and client
    this.tokenInfo = null;
    this.client = null;
  }
}

module.exports = MicrosoftConnector;
