/**
 * ERP Integration Module
 * Provides seamless integration with various ERP systems
 */

const adapters = require('./adapters');
const connectors = require('./connectors');
const utils = require('./utils');
const { ERPSyncManager } = require('./erpSyncManager');
const { ERPDataTransformer } = require('./erpDataTransformer');

/**
 * ERP Integration Service
 * Main entry point for ERP integration functionality
 */
class ERPIntegrationService {
  /**
   * Initialize the ERP Integration Service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      autoSync: false,
      syncInterval: 3600000, // 1 hour
      retryAttempts: 3,
      cacheExpiration: 300000, // 5 minutes
      ...options
    };
    
    this.adapters = adapters;
    this.connectors = connectors;
    this.syncManager = new ERPSyncManager(this.options);
    this.transformer = new ERPDataTransformer();
    
    if (this.options.autoSync) {
      this.startAutoSync();
    }
  }
  
  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    this.syncManager.startAutoSync();
  }
  
  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    this.syncManager.stopAutoSync();
  }
  
  /**
   * Create a connection to an ERP system
   * @param {string} system - ERP system type (e.g., 'sap', 'oracle', 'microsoft')
   * @param {Object} config - Connection configuration
   * @returns {Object} - Connection object
   */
  async createConnection(system, config) {
    try {
      if (!this.connectors[system]) {
        throw new Error(`Unsupported ERP system: ${system}`);
      }
      
      const connector = new this.connectors[system](config);
      const connection = await connector.connect();
      
      return connection;
    } catch (error) {
      console.error('Error creating ERP connection:', error);
      throw error;
    }
  }
  
  /**
   * Import data from an ERP system
   * @param {string} system - ERP system type
   * @param {Object} connection - Connection object
   * @param {string} entity - Entity type to import (e.g., 'customers', 'invoices')
   * @param {Object} options - Import options
   * @returns {Array} - Imported data
   */
  async importData(system, connection, entity, options = {}) {
    try {
      if (!this.adapters[system]) {
        throw new Error(`Unsupported ERP system: ${system}`);
      }
      
      const adapter = new this.adapters[system](connection);
      const rawData = await adapter.fetchData(entity, options);
      const transformedData = this.transformer.transformImportData(rawData, entity, system);
      
      await this.syncManager.recordSync(system, entity, 'import', transformedData.length);
      
      return transformedData;
    } catch (error) {
      console.error(`Error importing ${entity} from ${system}:`, error);
      throw error;
    }
  }
  
  /**
   * Export data to an ERP system
   * @param {string} system - ERP system type
   * @param {Object} connection - Connection object
   * @param {string} entity - Entity type to export (e.g., 'customers', 'invoices')
   * @param {Array} data - Data to export
   * @param {Object} options - Export options
   * @returns {Object} - Export results
   */
  async exportData(system, connection, entity, data, options = {}) {
    try {
      if (!this.adapters[system]) {
        throw new Error(`Unsupported ERP system: ${system}`);
      }
      
      const adapter = new this.adapters[system](connection);
      const transformedData = this.transformer.transformExportData(data, entity, system);
      const results = await adapter.pushData(entity, transformedData, options);
      
      await this.syncManager.recordSync(system, entity, 'export', data.length);
      
      return results;
    } catch (error) {
      console.error(`Error exporting ${entity} to ${system}:`, error);
      throw error;
    }
  }
  
  /**
   * Query an ERP system directly
   * @param {string} system - ERP system type
   * @param {Object} connection - Connection object
   * @param {string} query - Query string (system-specific)
   * @param {Object} params - Query parameters
   * @returns {Array} - Query results
   */
  async queryERP(system, connection, query, params = {}) {
    try {
      if (!this.adapters[system]) {
        throw new Error(`Unsupported ERP system: ${system}`);
      }
      
      const adapter = new this.adapters[system](connection);
      const results = await adapter.executeQuery(query, params);
      
      return results;
    } catch (error) {
      console.error(`Error querying ${system}:`, error);
      throw error;
    }
  }
  
  /**
   * Get synchronization history
   * @param {string} system - ERP system type (optional)
   * @param {string} entity - Entity type (optional)
   * @returns {Array} - Synchronization history
   */
  async getSyncHistory(system, entity) {
    return this.syncManager.getSyncHistory(system, entity);
  }
  
  /**
   * Get supported ERP systems
   * @returns {Array} - List of supported ERP systems
   */
  getSupportedSystems() {
    return Object.keys(this.connectors);
  }
  
  /**
   * Get available entities for a system
   * @param {string} system - ERP system type
   * @returns {Array} - List of available entities
   */
  getAvailableEntities(system) {
    if (!this.adapters[system]) {
      throw new Error(`Unsupported ERP system: ${system}`);
    }
    
    return this.adapters[system].getAvailableEntities();
  }
}

module.exports = {
  ERPIntegrationService,
  adapters,
  connectors,
  utils
};
