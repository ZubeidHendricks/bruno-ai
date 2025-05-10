/**
 * Oracle ERP Adapter
 * Adapter for Oracle ERP Cloud systems
 */

const { createLogger } = require('../../../../utils/logger');
const transformers = require('./transformers');
const { OracleError } = require('../../utils/errors');

/**
 * Oracle ERP Adapter class
 */
class OracleAdapter {
  /**
   * Initialize the Oracle adapter
   * @param {Object} connection - Oracle connection object
   */
  constructor(connection) {
    this.connection = connection;
    this.logger = createLogger('oracleAdapter');
    
    // Available entities in Oracle
    this.availableEntities = [
      'customers',
      'suppliers',
      'items',
      'salesOrders',
      'purchaseOrders',
      'invoices',
      'receipts',
      'journalEntries',
      'accountingPeriods',
      'assets'
    ];
  }
  
  /**
   * Fetch data from Oracle ERP
   * @param {string} entity - Entity type to fetch
   * @param {Object} options - Fetch options
   * @returns {Array} - Fetched data
   */
  async fetchData(entity, options = {}) {
    try {
      if (!this.availableEntities.includes(entity)) {
        throw new OracleError(`Unsupported entity: ${entity}`);
      }
      
      this.logger.info(`Fetching ${entity} from Oracle with options:`, options);
      
      // Default options
      const fetchOptions = {
        limit: options.limit || 1000,
        offset: options.offset || 0,
        filters: options.filters || {},
        fields: options.fields || '*',
        ...options
      };
      
      // Build Oracle REST API parameters
      const queryParams = this.buildOracleQueryParams(entity, fetchOptions);
      
      // Execute Oracle call
      const result = await this.executeOracleRequest(
        'GET',
        `/fscmRestApi/resources/latest/${this.getResourcePath(entity)}`,
        queryParams
      );
      
      if (!result || !result.items) {
        throw new OracleError('Invalid response from Oracle');
      }
      
      this.logger.info(`Successfully fetched ${result.items.length} ${entity} from Oracle`);
      
      return result.items;
    } catch (error) {
      this.logger.error(`Error fetching ${entity} from Oracle:`, error);
      throw new OracleError(`Error fetching ${entity} from Oracle: ${error.message}`);
    }
  }
  
  /**
   * Push data to Oracle ERP
   * @param {string} entity - Entity type to push
   * @param {Array} data - Data to push
   * @param {Object} options - Push options
   * @returns {Object} - Push results
   */
  async pushData(entity, data, options = {}) {
    try {
      if (!this.availableEntities.includes(entity)) {
        throw new OracleError(`Unsupported entity: ${entity}`);
      }
      
      if (!Array.isArray(data)) {
        data = [data]; // Convert to array if not already
      }
      
      this.logger.info(`Pushing ${data.length} ${entity} to Oracle`);
      
      // Default options
      const pushOptions = {
        batchSize: options.batchSize || 100,
        continueOnError: options.continueOnError !== undefined ? options.continueOnError : false,
        updateExisting: options.updateExisting !== undefined ? options.updateExisting : true,
        ...options
      };
      
      // Process in batches
      const results = {
        success: 0,
        failed: 0,
        errors: [],
        items: []
      };
      
      // Split into batches
      for (let i = 0; i < data.length; i += pushOptions.batchSize) {
        const batch = data.slice(i, i + pushOptions.batchSize);
        
        try {
          // Process batch
          const batchResults = await this.processOracleBatch(entity, batch, pushOptions);
          
          // Update overall results
          results.success += batchResults.success;
          results.failed += batchResults.failed;
          results.errors = [...results.errors, ...batchResults.errors];
          results.items = [...results.items, ...batchResults.items];
          
          this.logger.info(`Processed batch ${i / pushOptions.batchSize + 1}: ${batchResults.success} success, ${batchResults.failed} failed`);
        } catch (batchError) {
          this.logger.error(`Error processing batch ${i / pushOptions.batchSize + 1}:`, batchError);
          
          if (!pushOptions.continueOnError) {
            throw batchError;
          }
          
          results.failed += batch.length;
          results.errors.push(batchError.message);
        }
      }
      
      this.logger.info(`Finished pushing ${entity} to Oracle: ${results.success} success, ${results.failed} failed`);
      
      return results;
    } catch (error) {
      this.logger.error(`Error pushing ${entity} to Oracle:`, error);
      throw new OracleError(`Error pushing ${entity} to Oracle: ${error.message}`);
    }
  }
  
  /**
   * Execute a direct query on Oracle ERP
   * @param {string} query - SQL or SOQL query
   * @param {Object} params - Query parameters
   * @returns {Array} - Query results
   */
  async executeQuery(query, params = {}) {
    try {
      this.logger.info('Executing Oracle query');
      
      // Execute Oracle query
      const result = await this.executeOracleRequest(
        'POST',
        '/fscmRestApi/resources/latest/erpintegrations/executeQuery',
        null,
        {
          query,
          parameters: params
        }
      );
      
      if (!result || !result.items) {
        throw new OracleError('Invalid response from Oracle query');
      }
      
      this.logger.info(`Query executed successfully, returned ${result.items.length} results`);
      
      return result.items;
    } catch (error) {
      this.logger.error('Error executing Oracle query:', error);
      throw new OracleError(`Error executing Oracle query: ${error.message}`);
    }
  }
  
  /**
   * Process a batch of Oracle records
   * @param {string} entity - Entity type
   * @param {Array} batch - Batch of records
   * @param {Object} options - Processing options
   * @returns {Object} - Batch results
   */
  async processOracleBatch(entity, batch, options) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      items: []
    };
    
    // For Oracle, we need to process records individually as it doesn't support true batching
    for (let i = 0; i < batch.length; i++) {
      const record = batch[i];
      
      try {
        let response;
        const resourcePath = this.getResourcePath(entity);
        
        if (options.updateExisting && record.id) {
          // Update existing record
          response = await this.executeOracleRequest(
            'PATCH',
            `/fscmRestApi/resources/latest/${resourcePath}/${record.id}`,
            null,
            record
          );
        } else {
          // Create new record
          response = await this.executeOracleRequest(
            'POST',
            `/fscmRestApi/resources/latest/${resourcePath}`,
            null,
            record
          );
        }
        
        results.success++;
        results.items.push({
          index: i,
          id: response.id || record.id,
          status: 'success',
          response
        });
      } catch (error) {
        results.failed++;
        const errorMessage = `Error processing ${entity} item ${i}: ${error.message}`;
        results.errors.push(errorMessage);
        results.items.push({
          index: i,
          error: errorMessage,
          status: 'failed'
        });
        
        if (!options.continueOnError) {
          throw new OracleError(`Batch processing stopped at item ${i}: ${error.message}`);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Build Oracle query parameters
   * @param {string} entity - Entity type
   * @param {Object} options - Query options
   * @returns {Object} - Oracle query parameters
   */
  buildOracleQueryParams(entity, options) {
    const params = {};
    
    // Add pagination parameters
    if (options.limit) {
      params.limit = options.limit;
    }
    
    if (options.offset) {
      params.offset = options.offset;
    }
    
    // Add fields parameter
    if (options.fields && options.fields !== '*') {
      params.fields = Array.isArray(options.fields) ? options.fields.join(',') : options.fields;
    }
    
    // Build filter string (Oracle uses a different format than OData)
    if (options.filters && Object.keys(options.filters).length > 0) {
      const filterParts = [];
      
      for (const [key, value] of Object.entries(options.filters)) {
        if (typeof value === 'string') {
          // String values need to be quoted
          filterParts.push(`${key}=${encodeURIComponent(`'${value}'`)}`);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          filterParts.push(`${key}=${encodeURIComponent(value)}`);
        } else if (value === null) {
          filterParts.push(`${key}=null`);
        } else if (Array.isArray(value) && value.length > 0) {
          // Handle IN operator
          const valueList = value.map(v => typeof v === 'string' ? `'${v}'` : v).join(',');
          filterParts.push(`${key} IN (${encodeURIComponent(valueList)})`);
        } else if (typeof value === 'object') {
          // Handle operators like >, <, >=, <=, etc.
          for (const [op, opValue] of Object.entries(value)) {
            const operator = this.mapOperator(op);
            if (typeof opValue === 'string') {
              filterParts.push(`${key}${operator}${encodeURIComponent(`'${opValue}'`)}`);
            } else {
              filterParts.push(`${key}${operator}${encodeURIComponent(opValue)}`);
            }
          }
        }
      }
      
      if (filterParts.length > 0) {
        params.q = filterParts.join(';');
      }
    }
    
    // Add ordering
    if (options.orderBy) {
      params.orderBy = options.orderBy;
    }
    
    return params;
  }
  
  /**
   * Map operator symbol to Oracle operator
   * @param {string} op - Operator symbol
   * @returns {string} - Oracle operator
   */
  mapOperator(op) {
    const operatorMap = {
      'eq': '=',
      'ne': '!=',
      'gt': '>',
      'lt': '<',
      'ge': '>=',
      'le': '<=',
      'like': ' LIKE '
    };
    
    return operatorMap[op] || `=${op}=`; // Default to equality with the original operator
  }
  
  /**
   * Get the Oracle REST API resource path for an entity
   * @param {string} entity - Entity type
   * @returns {string} - Resource path
   */
  getResourcePath(entity) {
    // Map entity to Oracle REST API resource path
    const resourcePathMap = {
      'customers': 'receivablesCustomers',
      'suppliers': 'payablesSuppliers',
      'items': 'inventoryItems',
      'salesOrders': 'salesOrders',
      'purchaseOrders': 'purchaseOrders',
      'invoices': 'receivablesInvoices',
      'receipts': 'receivablesReceipts',
      'journalEntries': 'generalLedgerJournals',
      'accountingPeriods': 'accountingPeriods',
      'assets': 'fixedAssets'
    };
    
    return resourcePathMap[entity] || entity;
  }
  
  /**
   * Execute a request to Oracle ERP
   * @param {string} method - HTTP method
   * @param {string} path - API path
   * @param {Object} params - Query parameters
   * @param {Object} body - Request body
   * @returns {Object} - Response data
   */
  async executeOracleRequest(method, path, params, body) {
    if (!this.connection || !this.connection.client) {
      throw new OracleError('Oracle connection not available');
    }
    
    try {
      const response = await this.connection.client.request({
        method,
        url: path,
        params,
        data: body,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'REST-Framework-Version': '2'
        }
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Oracle request failed: ${method} ${path}`, error);
      
      // Extract error details from Oracle response if available
      let errorMessage = error.message;
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      }
      
      throw new OracleError(`Oracle request failed: ${errorMessage}`);
    }
  }
  
  /**
   * Get available entities
   * @returns {Array} - Available entities
   */
  getAvailableEntities() {
    return this.availableEntities;
  }
}

module.exports = OracleAdapter;
