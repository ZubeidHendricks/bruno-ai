/**
 * SAP Connector
 * Provides connection and authentication for SAP ERP systems
 */

const axios = require('axios');
const { createLogger } = require('../../../utils/logger');
const { SAPError } = require('../utils/errors');

/**
 * SAP Connector for connecting to SAP ERP systems
 */
class SAPConnector {
  /**
   * Create a SAP connector
   * @param {Object} config - Connection configuration
   */
  constructor(config) {
    this.config = {
      baseUrl: config.baseUrl,
      username: config.username,
      password: config.password,
      client: config.client,
      language: config.language || 'EN',
      timeout: config.timeout || 30000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      ...config
    };
    
    this.logger = createLogger('sapConnector');
    this.client = null;
    this.tokenInfo = null;
  }
  
  /**
   * Connect to SAP system
   * @returns {Object} - Connection object
   */
  async connect() {
    try {
      this.logger.info('Connecting to SAP ERP system');
      
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
          // Add authentication token if needed
          if (this.shouldAuthenticate(config)) {
            const token = await this.getAuthToken();
            config.headers['Authorization'] = `Bearer ${token}`;
          }
          
          // Add SAP specific headers
          config.headers['x-sap-client'] = this.config.client;
          config.headers['Accept-Language'] = this.config.language;
          
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
      
      this.logger.info('Successfully connected to SAP ERP system');
      
      return {
        client: this.client,
        config: this.config
      };
    } catch (error) {
      this.logger.error('Error connecting to SAP ERP system:', error);
      throw new SAPError(`Failed to connect to SAP ERP system: ${error.message}`);
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
      
      this.logger.info('Getting new SAP authentication token');
      
      // Different authentication methods depending on SAP system
      if (this.config.authType === 'basic') {
        // Basic authentication
        const response = await axios.post(
          `${this.config.baseUrl}/sap/opu/odata/sap/API_USER_SRV/GetToken`,
          {},
          {
            auth: {
              username: this.config.username,
              password: this.config.password
            },
            headers: {
              'x-sap-client': this.config.client,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.data || !response.data.value) {
          throw new SAPError('Invalid response when getting token');
        }
        
        this.tokenInfo = {
          token: response.data.value,
          expiresAt: Date.now() + (12 * 60 * 60 * 1000) // 12 hours
        };
        
        return this.tokenInfo.token;
      } else if (this.config.authType === 'oauth') {
        // OAuth authentication
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', this.config.clientId);
        params.append('client_secret', this.config.clientSecret);
        params.append('username', this.config.username);
        params.append('password', this.config.password);
        
        const response = await axios.post(
          `${this.config.baseUrl}/sap/opu/odata/sap/API_USER_SRV/oauth/token`,
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.data || !response.data.access_token) {
          throw new SAPError('Invalid response when getting OAuth token');
        }
        
        this.tokenInfo = {
          token: response.data.access_token,
          expiresAt: Date.now() + (response.data.expires_in * 1000)
        };
        
        return this.tokenInfo.token;
      } else {
        // Default to username/password as header
        return 'Basic ' + Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      }
    } catch (error) {
      this.logger.error('Error getting SAP authentication token:', error);
      throw new SAPError(`Failed to get SAP authentication token: ${error.message}`);
    }
  }
  
  /**
   * Check if request should use authentication
   * @param {Object} config - Request config
   * @returns {boolean} - Whether to use authentication
   */
  shouldAuthenticate(config) {
    // Most SAP APIs require authentication, but some public ones don't
    // For simplicity, we assume all requests need authentication
    return true;
  }
  
  /**
   * Test the connection to SAP
   * @returns {boolean} - Whether connection is successful
   */
  async testConnection() {
    try {
      // Make a simple request to test connection
      await this.client.get('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$top=1');
      
      return true;
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      throw new SAPError(`Connection test failed: ${error.message}`);
    }
  }
  
  /**
   * Disconnect from SAP
   */
  async disconnect() {
    this.logger.info('Disconnecting from SAP ERP system');
    
    // Clear token and client
    this.tokenInfo = null;
    this.client = null;
  }
}

module.exports = SAPConnector;
