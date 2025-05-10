/**
 * Oracle Connector
 * Provides connection and authentication for Oracle ERP Cloud systems
 */

const axios = require('axios');
const { createLogger } = require('../../../utils/logger');
const { OracleError } = require('../utils/errors');

/**
 * Oracle Connector for connecting to Oracle ERP Cloud systems
 */
class OracleConnector {
  /**
   * Create an Oracle connector
   * @param {Object} config - Connection configuration
   */
  constructor(config) {
    this.config = {
      baseUrl: config.baseUrl,
      username: config.username,
      password: config.password,
      identityDomain: config.identityDomain,
      timeout: config.timeout || 30000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      ...config
    };
    
    this.logger = createLogger('oracleConnector');
    this.client = null;
    this.tokenInfo = null;
  }
  
  /**
   * Connect to Oracle ERP Cloud
   * @returns {Object} - Connection object
   */
  async connect() {
    try {
      this.logger.info('Connecting to Oracle ERP Cloud');
      
      // Create axios client with default config
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
      
      this.logger.info('Successfully connected to Oracle ERP Cloud');
      
      return {
        client: this.client,
        config: this.config
      };
    } catch (error) {
      this.logger.error('Error connecting to Oracle ERP Cloud:', error);
      throw new OracleError(`Failed to connect to Oracle ERP Cloud: ${error.message}`);
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
      
      this.logger.info('Getting new Oracle authentication token');
      
      // Oracle Cloud uses OAuth for authentication
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('scope', 'https://example.oracle.com');
      params.append('username', this.config.username);
      params.append('password', this.config.password);
      
      const response = await axios.post(
        `${this.config.baseUrl}/fscmRestApi/tokenrelay`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-IDENTITY-DOMAIN-NAME': this.config.identityDomain
          }
        }
      );
      
      if (!response.data || !response.data.access_token) {
        throw new OracleError('Invalid response when getting OAuth token');
      }
      
      this.tokenInfo = {
        token: response.data.access_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000)
      };
      
      return this.tokenInfo.token;
    } catch (error) {
      this.logger.error('Error getting Oracle authentication token:', error);
      throw new OracleError(`Failed to get Oracle authentication token: ${error.message}`);
    }
  }
  
  /**
   * Test the connection to Oracle
   * @returns {boolean} - Whether connection is successful
   */
  async testConnection() {
    try {
      // Make a simple request to test connection
      await this.client.get('/fscmRestApi/resources/latest/receivablesCustomers?limit=1');
      
      return true;
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      throw new OracleError(`Connection test failed: ${error.message}`);
    }
  }
  
  /**
   * Disconnect from Oracle
   */
  async disconnect() {
    this.logger.info('Disconnecting from Oracle ERP Cloud');
    
    // Clear token and client
    this.tokenInfo = null;
    this.client = null;
  }
}

module.exports = OracleConnector;
