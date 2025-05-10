/**
 * SAP Adapter
 * Adapter for SAP ERP systems
 */

const { createLogger } = require('../../../../utils/logger');
const transformers = require('./transformers');
const { SAPError } = require('../../utils/errors');

/**
 * SAP Adapter class
 */
class SAPAdapter {
  /**
   * Initialize the SAP adapter
   * @param {Object} connection - SAP connection object
   */
  constructor(connection) {
    this.connection = connection;
    this.logger = createLogger('sapAdapter');
    
    // Available entities in SAP
    this.availableEntities = [
      'customers',
      'vendors',
      'materials',
      'salesOrders',
      'purchaseOrders',
      'invoices',
      'deliveries',
      'financialRecords',
      'costCenters',
      'profitCenters'
    ];
  }
  
  /**
   * Fetch data from SAP
   * @param {string} entity - Entity type to fetch
   * @param {Object} options - Fetch options
   * @returns {Array} - Fetched data
   */
  async fetchData(entity, options = {}) {
    try {
      if (!this.availableEntities.includes(entity)) {
        throw new SAPError(`Unsupported entity: ${entity}`);
      }
      
      this.logger.info(`Fetching ${entity} from SAP with options:`, options);
      
      // Default options
      const fetchOptions = {
        limit: options.limit || 1000,
        offset: options.offset || 0,
        filters: options.filters || {},
        fields: options.fields || '*',
        ...options
      };
      
      // Build SAP query parameters
      const queryParams = this.buildSAPQueryParams(entity, fetchOptions);
      
      // Execute SAP call
      const result = await this.executeSAPRequest(
        'GET', 
        `/sap/opu/odata/sap/${this.getServicePath(entity)}/`,
        queryParams
      );
      
      if (!result || !result.d || !result.d.results) {
        throw new SAPError('Invalid response from SAP');
      }
      
      this.logger.info(`Successfully fetched ${result.d.results.length} ${entity} from SAP`);
      
      return result.d.results;
    } catch (error) {
      this.logger.error(`Error fetching ${entity} from SAP:`, error);
      throw new SAPError(`Error fetching ${entity} from SAP: ${error.message}`);
    }
  }
  
  /**
   * Push data to SAP
   * @param {string} entity - Entity type to push
   * @param {Array} data - Data to push
   * @param {Object} options - Push options
   * @returns {Object} - Push results
   */
  async pushData(entity, data, options = {}) {
    try {
      if (!this.availableEntities.includes(entity)) {
        throw new SAPError(`Unsupported entity: ${entity}`);
      }
      
      if (!Array.isArray(data)) {
        data = [data]; // Convert to array if not already
      }
      
      this.logger.info(`Pushing ${data.length} ${entity} to SAP`);
      
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
          const batchResults = await this.processSAPBatch(entity, batch, pushOptions);
          
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
      
      this.logger.info(`Finished pushing ${entity} to SAP: ${results.success} success, ${results.failed} failed`);
      
      return results;
    } catch (error) {
      this.logger.error(`Error pushing ${entity} to SAP:`, error);
      throw new SAPError(`Error pushing ${entity} to SAP: ${error.message}`);
    }
  }
  
  /**
   * Execute a direct query on SAP
   * @param {string} query - ABAP or SQL query
   * @param {Object} params - Query parameters
   * @returns {Array} - Query results
   */
  async executeQuery(query, params = {}) {
    try {
      this.logger.info('Executing SAP query');
      
      // Execute SAP query
      const result = await this.executeSAPRequest(
        'POST',
        '/sap/opu/odata/sap/Z_CUSTOM_QUERY_SRV/ExecuteQuery',
        {
          query,
          ...params
        }
      );
      
      if (!result || !result.d || !result.d.results) {
        throw new SAPError('Invalid response from SAP query');
      }
      
      this.logger.info(`Query executed successfully, returned ${result.d.results.length} results`);
      
      return result.d.results;
    } catch (error) {
      this.logger.error('Error executing SAP query:', error);
      throw new SAPError(`Error executing SAP query: ${error.message}`);
    }
  }
  
  /**
   * Process a batch of SAP records
   * @param {string} entity - Entity type
   * @param {Array} batch - Batch of records
   * @param {Object} options - Processing options
   * @returns {Object} - Batch results
   */
  async processSAPBatch(entity, batch, options) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      items: []
    };
    
    // Create batch request for SAP
    const batchBody = this.createSAPBatchRequest(entity, batch, options);
    
    // Execute batch request
    const batchResult = await this.executeSAPRequest(
      'POST',
      '/sap/opu/odata/sap/BATCH',
      null,
      batchBody,
      { 'Content-Type': 'multipart/mixed;boundary=batch' }
    );
    
    // Process batch response
    // This is a simplified implementation - actual processing would be more complex
    
    for (let i = 0; i < batch.length; i++) {
      // Mock response processing - in reality, would parse the batch response
      if (Math.random() > 0.1) { // 90% success rate for demo
        results.success++;
        results.items.push({
          index: i,
          id: batch[i].id || `generated-id-${i}`,
          status: 'success'
        });
      } else {
        results.failed++;
        const error = `Error processing item ${i}: Mock error`;
        results.errors.push(error);
        results.items.push({
          index: i,
          error,
          status: 'failed'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Build SAP query parameters
   * @param {string} entity - Entity type
   * @param {Object} options - Query options
   * @returns {Object} - SAP query parameters
   */
  buildSAPQueryParams(entity, options) {
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
          // Handle IN operator
          const valueList = value.map(v => typeof v === 'string' ? `'${v}'` : v).join(',');
          filterParts.push(`${key} in (${valueList})`);
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
    
    return params;
  }
  
  /**
   * Create a SAP batch request
   * @param {string} entity - Entity type
   * @param {Array} batch - Batch of records
   * @param {Object} options - Batch options
   * @returns {string} - Batch request body
   */
  createSAPBatchRequest(entity, batch, options) {
    const boundary = 'batch';
    const changeset = 'changeset';
    const servicePath = this.getServicePath(entity);
    
    let batchBody = `--${boundary}\r\n`;
    batchBody += `Content-Type: multipart/mixed;boundary=${changeset}\r\n\r\n`;
    
    // Add each record to the batch
    batch.forEach((record, index) => {
      batchBody += `--${changeset}\r\n`;
      batchBody += 'Content-Type: application/http\r\n';
      batchBody += 'Content-Transfer-Encoding: binary\r\n\r\n';
      
      const method = options.updateExisting && record.id ? 'MERGE' : 'POST';
      const uri = options.updateExisting && record.id ? 
        `/sap/opu/odata/sap/${servicePath}(${record.id})` : 
        `/sap/opu/odata/sap/${servicePath}`;
      
      batchBody += `${method} ${uri} HTTP/1.1\r\n`;
      batchBody += 'Content-Type: application/json\r\n\r\n';
      batchBody += JSON.stringify(record) + '\r\n';
    });
    
    batchBody += `--${changeset}--\r\n`;
    batchBody += `--${boundary}--`;
    
    return batchBody;
  }
  
  /**
   * Get the SAP OData service path for an entity
   * @param {string} entity - Entity type
   * @returns {string} - Service path
   */
  getServicePath(entity) {
    // Map entity to SAP OData service path
    const servicePathMap = {
      customers: 'API_BUSINESS_PARTNER/A_BusinessPartner',
      vendors: 'API_BUSINESS_PARTNER/A_Supplier',
      materials: 'API_MATERIAL/A_Material',
      salesOrders: 'API_SALES_ORDER_SRV/A_SalesOrder',
      purchaseOrders: 'API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder',
      invoices: 'API_BILLING_DOCUMENT_SRV/A_BillingDocument',
      deliveries: 'API_INBOUND_DELIVERY_SRV/A_InboundDelivery',
      financialRecords: 'API_FINANCIALACCOUNTINGEXTERNALREPORTING/A_GLAccountItem',
      costCenters: 'API_COSTCENTER_SRV/A_CostCenter',
      profitCenters: 'API_PROFITCENTER_SRV/A_ProfitCenter'
    };
    
    return servicePathMap[entity] || 'DEFAULT_SERVICE_PATH';
  }
  
  /**
   * Execute a request to SAP
   * @param {string} method - HTTP method
   * @param {string} path - API path
   * @param {Object} params - Query parameters
   * @param {Object|string} body - Request body
   * @param {Object} headers - Additional headers
   * @returns {Object} - Response data
   */
  async executeSAPRequest(method, path, params, body, headers = {}) {
    if (!this.connection || !this.connection.client) {
      throw new SAPError('SAP connection not available');
    }
    
    try {
      const response = await this.connection.client.request({
        method,
        url: path,
        params,
        data: body,
        headers: {
          'Accept': 'application/json',
          ...headers
        }
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`SAP request failed: ${method} ${path}`, error);
      throw new SAPError(`SAP request failed: ${error.message}`);
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

module.exports = SAPAdapter;
