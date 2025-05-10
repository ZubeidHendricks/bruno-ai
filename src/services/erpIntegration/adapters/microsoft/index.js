/**
 * Microsoft Dynamics Adapter
 * Adapter for Microsoft Dynamics 365 Finance and Operations
 */

const { createLogger } = require('../../../../utils/logger');
const transformers = require('./transformers');
const { MicrosoftError } = require('../../utils/errors');

/**
 * Microsoft Dynamics Adapter class
 */
class MicrosoftAdapter {
  /**
   * Initialize the Microsoft Dynamics adapter
   * @param {Object} connection - Microsoft Dynamics connection object
   */
  constructor(connection) {
    this.connection = connection;
    this.logger = createLogger('microsoftAdapter');
    
    // Available entities in Microsoft Dynamics
    this.availableEntities = [
      'customers',
      'vendors',
      'products',
      'salesOrders',
      'purchaseOrders',
      'invoices',
      'payments',
      'ledgerJournals',
      'dimensions',
      'warehouses',
      'budgets'
    ];
  }
  
  /**
   * Fetch data from Microsoft Dynamics
   * @param {string} entity - Entity type to fetch
   * @param {Object} options - Fetch options
   * @returns {Array} - Fetched data
   */
  async fetchData(entity, options = {}) {
    try {
      if (!this.availableEntities.includes(entity)) {
        throw new MicrosoftError(`Unsupported entity: ${entity}`);
      }
      
      this.logger.info(`Fetching ${entity} from Microsoft Dynamics with options:`, options);
      
      // Default options
      const fetchOptions = {
        limit: options.limit || 1000,
        offset: options.offset || 0,
        filters: options.filters || {},
        fields: options.fields || '*',
        ...options
      };
      
      // Build OData query parameters for Dynamics
      const queryParams = this.buildDynamicsQueryParams(entity, fetchOptions);
      
      // Execute Dynamics call
      const result = await this.executeDynamicsRequest(
        'GET', 
        `/data/${this.getEntityPath(entity)}`,
        queryParams
      );
      
      if (!result || !result.value) {
        throw new MicrosoftError('Invalid response from Microsoft Dynamics');
      }
      
      this.logger.info(`Successfully fetched ${result.value.length} ${entity} from Microsoft Dynamics`);
      
      return result.value;
    } catch (error) {
      this.logger.error(`Error fetching ${entity} from Microsoft Dynamics:`, error);
      throw new MicrosoftError(`Error fetching ${entity} from Microsoft Dynamics: ${error.message}`);
    }
  }
  
  /**
   * Push data to Microsoft Dynamics
   * @param {string} entity - Entity type to push
   * @param {Array} data - Data to push
   * @param {Object} options - Push options
   * @returns {Object} - Push results
   */
  async pushData(entity, data, options = {}) {
    try {
      if (!this.availableEntities.includes(entity)) {
        throw new MicrosoftError(`Unsupported entity: ${entity}`);
      }
      
      if (!Array.isArray(data)) {
        data = [data]; // Convert to array if not already
      }
      
      this.logger.info(`Pushing ${data.length} ${entity} to Microsoft Dynamics`);
      
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
          const batchResults = await this.processDynamicsBatch(entity, batch, pushOptions);
          
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
      
      this.logger.info(`Finished pushing ${entity} to Microsoft Dynamics: ${results.success} success, ${results.failed} failed`);
      
      return results;
    } catch (error) {
      this.logger.error(`Error pushing ${entity} to Microsoft Dynamics:`, error);
      throw new MicrosoftError(`Error pushing ${entity} to Microsoft Dynamics: ${error.message}`);
    }
  }
  
  /**
   * Execute a direct query on Microsoft Dynamics
   * @param {string} query - OData query
   * @param {Object} params - Query parameters
   * @returns {Array} - Query results
   */
  async executeQuery(query, params = {}) {
    try {
      this.logger.info('Executing Microsoft Dynamics query');
      
      // For Dynamics, direct queries are just OData queries
      const result = await this.executeDynamicsRequest(
        'GET',
        `/data/${query}`,
        params
      );
      
      if (!result || !result.value) {
        throw new MicrosoftError('Invalid response from Microsoft Dynamics query');
      }
      
      this.logger.info(`Query executed successfully, returned ${result.value.length} results`);
      
      return result.value;
    } catch (error) {
      this.logger.error('Error executing Microsoft Dynamics query:', error);
      throw new MicrosoftError(`Error executing Microsoft Dynamics query: ${error.message}`);
    }
  }
  
  /**
   * Process a batch of Microsoft Dynamics records
   * @param {string} entity - Entity type
   * @param {Array} batch - Batch of records
   * @param {Object} options - Processing options
   * @returns {Object} - Batch results
   */
  async processDynamicsBatch(entity, batch, options) {
    // For Dynamics 365 F&O, we can use the OData batch endpoint
    const batchId = `batch-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const changesetId = `changeset-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    // Create batch request body
    const batchRequests = [];
    const entityPath = this.getEntityPath(entity);
    
    for (let i = 0; i < batch.length; i++) {
      const record = batch[i];
      let method, url;
      
      if (options.updateExisting && record.id) {
        // Update existing record
        method = 'PATCH';
        url = `/data/${entityPath}(${this.getDynamicsKey(entity, record)})`;
      } else {
        // Create new record
        method = 'POST';
        url = `/data/${entityPath}`;
      }
      
      batchRequests.push({
        id: `request-${i}`,
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: record
      });
    }
    
    try {
      // Execute batch request
      const batchResults = await this.executeDynamicsBatchRequest(batchRequests, batchId, changesetId);
      
      // Process batch response
      const results = {
        success: 0,
        failed: 0,
        errors: [],
        items: []
      };
      
      if (!batchResults || !batchResults.responses || !Array.isArray(batchResults.responses)) {
        throw new MicrosoftError('Invalid batch response');
      }
      
      for (let i = 0; i < batchResults.responses.length; i++) {
        const response = batchResults.responses[i];
        
        if (response.status >= 200 && response.status < 300) {
          results.success++;
          results.items.push({
            index: i,
            id: response.body && response.body.id ? response.body.id : batch[i].id,
            status: 'success',
            response: response.body
          });
        } else {
          results.failed++;
          const errorMessage = response.body && response.body.error ? 
            response.body.error.message : 
            `HTTP Error ${response.status}`;
          
          results.errors.push(errorMessage);
          results.items.push({
            index: i,
            error: errorMessage,
            status: 'failed'
          });
          
          if (!options.continueOnError) {
            throw new MicrosoftError(`Batch processing stopped at item ${i}: ${errorMessage}`);
          }
        }
      }
      
      return results;
    } catch (error) {
      // For non-batch specific errors
      throw new MicrosoftError(`Error processing Dynamics batch: ${error.message}`);
    }
  }
  
  /**
   * Execute a batch request to Microsoft Dynamics
   * @param {Array} requests - Array of request objects
   * @param {string} batchId - Batch ID
   * @param {string} changesetId - Changeset ID
   * @returns {Object} - Batch response
   */
  async executeDynamicsBatchRequest(requests, batchId, changesetId) {
    if (!this.connection || !this.connection.client) {
      throw new MicrosoftError('Microsoft Dynamics connection not available');
    }
    
    try {
      // Create batch request body
      const boundary = `batch_${batchId}`;
      const changesetBoundary = `changeset_${changesetId}`;
      
      let batchBody = `--${boundary}\r\n`;
      batchBody += `Content-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;
      
      // Add requests to batch
      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        
        batchBody += `--${changesetBoundary}\r\n`;
        batchBody += 'Content-Type: application/http\r\n';
        batchBody += `Content-Transfer-Encoding: binary\r\n`;
        batchBody += `Content-ID: ${request.id}\r\n\r\n`;
        
        batchBody += `${request.method} ${request.url} HTTP/1.1\r\n`;
        
        // Add request headers
        for (const [header, value] of Object.entries(request.headers)) {
          batchBody += `${header}: ${value}\r\n`;
        }
        
        batchBody += '\r\n';
        
        // Add request body
        if (request.body) {
          batchBody += JSON.stringify(request.body) + '\r\n';
        }
      }
      
      batchBody += `--${changesetBoundary}--\r\n`;
      batchBody += `--${boundary}--`;
      
      // Execute batch request
      const response = await this.connection.client.request({
        method: 'POST',
        url: '/data/$batch',
        headers: {
          'Content-Type': `multipart/mixed; boundary=${boundary}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        },
        data: batchBody
      });
      
      // Parse batch response - this is simplified and would need to be more robust in a real implementation
      return {
        responses: response.data
      };
    } catch (error) {
      this.logger.error('Microsoft Dynamics batch request failed:', error);
      throw new MicrosoftError(`Microsoft Dynamics batch request failed: ${error.message}`);
    }
  }
  
  /**
   * Build Dynamics OData query parameters
   * @param {string} entity - Entity type
   * @param {Object} options - Query options
   * @returns {Object} - OData query parameters
   */
  buildDynamicsQueryParams(entity, options) {
    const params = {};
    
    // Add OData parameters
    if (options.limit) {
      params.$top = options.limit;
    }
    
    if (options.offset) {
      params.$skip = options.offset;
    }
    
    if (options.fields && options.fields !== '*') {
      params.$select = Array.isArray(options.fields) ? options.fields.join(',') : options.fields;
    }
    
    // Build filter string
    if (options.filters && Object.keys(options.filters).length > 0) {
      const filterParts = [];
      
      for (const [key, value] of Object.entries(options.filters)) {
        if (typeof value === 'string') {
          filterParts.push(`${key} eq '${value}'`);
        } else if (typeof value === 'number') {
          filterParts.push(`${key} eq ${value}`);
        } else if (typeof value === 'boolean') {
          filterParts.push(`${key} eq ${value ? 'true' : 'false'}`);
        } else if (value === null) {
          filterParts.push(`${key} eq null`);
        } else if (Array.isArray(value) && value.length > 0) {
          // Handle IN operator - Dynamics uses the 'in' operator differently, so we use multiple 'eq' with 'or'
          const valueParts = value.map(v => {
            if (typeof v === 'string') {
              return `${key} eq '${v}'`;
            } else {
              return `${key} eq ${v}`;
            }
          });
          
          filterParts.push(`(${valueParts.join(' or ')})`);
        } else if (typeof value === 'object') {
          // Handle operators like gt, lt, ge, le, etc.
          for (const [op, opValue] of Object.entries(value)) {
            if (typeof opValue === 'string') {
              filterParts.push(`${key} ${op} '${opValue}'`);
            } else {
              filterParts.push(`${key} ${op} ${opValue}`);
            }
          }
        }
      }
      
      if (filterParts.length > 0) {
        params.$filter = filterParts.join(' and ');
      }
    }
    
    // Add ordering
    if (options.orderBy) {
      params.$orderby = options.orderBy;
    }
    
    // Add expand for related entities
    if (options.expand) {
      params.$expand = Array.isArray(options.expand) ? options.expand.join(',') : options.expand;
    }
    
    return params;
  }
  
  /**
   * Get the Dynamics OData entity path for an entity
   * @param {string} entity - Entity type
   * @returns {string} - Entity path
   */
  getEntityPath(entity) {
    // Map entity to Dynamics OData entity path
    const entityPathMap = {
      'customers': 'Customers',
      'vendors': 'Vendors',
      'products': 'Products',
      'salesOrders': 'SalesOrders',
      'purchaseOrders': 'PurchaseOrders',
      'invoices': 'CustomerInvoices',
      'payments': 'CustomerPayments',
      'ledgerJournals': 'LedgerJournalTables',
      'dimensions': 'Dimensions',
      'warehouses': 'Warehouses',
      'budgets': 'Budgets'
    };
    
    return entityPathMap[entity] || entity;
  }
  
  /**
   * Get the key field for a Dynamics entity
   * @param {string} entity - Entity type
   * @param {Object} record - Entity record
   * @returns {string} - Key value for the entity
   */
  getDynamicsKey(entity, record) {
    // Map entity to its key field in Dynamics
    const keyFieldMap = {
      'customers': 'CustomerAccount',
      'vendors': 'VendorAccount',
      'products': 'ProductNumber',
      'salesOrders': 'SalesOrderNumber',
      'purchaseOrders': 'PurchaseOrderNumber',
      'invoices': 'InvoiceNumber',
      'payments': 'PaymentNumber',
      'ledgerJournals': 'JournalNumber',
      'dimensions': 'DimensionCode',
      'warehouses': 'WarehouseId',
      'budgets': 'BudgetId'
    };
    
    const keyField = keyFieldMap[entity] || 'id';
    
    return record[keyField] || record.id;
  }
  
  /**
   * Execute a request to Microsoft Dynamics
   * @param {string} method - HTTP method
   * @param {string} path - API path
   * @param {Object} params - Query parameters
   * @param {Object} body - Request body
   * @returns {Object} - Response data
   */
  async executeDynamicsRequest(method, path, params, body) {
    if (!this.connection || !this.connection.client) {
      throw new MicrosoftError('Microsoft Dynamics connection not available');
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
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        }
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Microsoft Dynamics request failed: ${method} ${path}`, error);
      
      // Extract error details from Dynamics response if available
      let errorMessage = error.message;
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message;
      }
      
      throw new MicrosoftError(`Microsoft Dynamics request failed: ${errorMessage}`);
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

module.exports = MicrosoftAdapter;
