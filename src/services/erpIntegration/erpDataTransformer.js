/**
 * ERP Data Transformer
 * Transforms data between Bruno AI and ERP systems formats
 */

const { createLogger } = require('../../utils/logger');
const { getSchemaForEntity } = require('./utils/schemaRegistry');

/**
 * ERP Data Transformer
 */
class ERPDataTransformer {
  /**
   * Initialize the ERP Data Transformer
   */
  constructor() {
    this.logger = createLogger('erpDataTransformer');
    this.transformers = {
      // System-specific transformers
      sap: require('./adapters/sap/transformers'),
      oracle: require('./adapters/oracle/transformers'),
      microsoft: require('./adapters/microsoft/transformers'),
      netsuite: require('./adapters/netsuite/transformers')
    };
  }
  
  /**
   * Transform imported data from ERP to Bruno AI format
   * @param {Array} data - Raw data from ERP
   * @param {string} entity - Entity type
   * @param {string} system - ERP system type
   * @returns {Array} - Transformed data
   */
  transformImportData(data, entity, system) {
    try {
      if (!Array.isArray(data)) {
        this.logger.warn(`Expected array for ${entity} data, got ${typeof data}`);
        data = [data]; // Convert to array if not already
      }
      
      if (!this.transformers[system]) {
        throw new Error(`No transformer available for ${system}`);
      }
      
      // Get the appropriate transformer
      const transformer = this.transformers[system];
      
      if (!transformer[entity] || !transformer[entity].import) {
        throw new Error(`No import transformer for ${entity} in ${system}`);
      }
      
      // Get schema for validation
      const schema = getSchemaForEntity(entity);
      
      // Transform each item
      const transformed = data.map((item, index) => {
        try {
          const transformedItem = transformer[entity].import(item);
          
          // Validate against schema if available
          if (schema) {
            this.validateAgainstSchema(transformedItem, schema, `${entity}[${index}]`);
          }
          
          return transformedItem;
        } catch (itemError) {
          this.logger.error(`Error transforming ${entity} item ${index}:`, itemError);
          // Return partial or default item instead of failing completely
          return { 
            _original: item,
            _error: itemError.message,
            _partial: true
          };
        }
      });
      
      this.logger.info(`Transformed ${transformed.length} ${entity} records from ${system}`);
      
      return transformed;
    } catch (error) {
      this.logger.error(`Error transforming ${entity} from ${system}:`, error);
      throw error;
    }
  }
  
  /**
   * Transform data from Bruno AI to ERP format for export
   * @param {Array} data - Bruno AI data
   * @param {string} entity - Entity type
   * @param {string} system - ERP system type
   * @returns {Array} - Transformed data for ERP
   */
  transformExportData(data, entity, system) {
    try {
      if (!Array.isArray(data)) {
        this.logger.warn(`Expected array for ${entity} data, got ${typeof data}`);
        data = [data]; // Convert to array if not already
      }
      
      if (!this.transformers[system]) {
        throw new Error(`No transformer available for ${system}`);
      }
      
      // Get the appropriate transformer
      const transformer = this.transformers[system];
      
      if (!transformer[entity] || !transformer[entity].export) {
        throw new Error(`No export transformer for ${entity} in ${system}`);
      }
      
      // Transform each item
      const transformed = data.map((item, index) => {
        try {
          return transformer[entity].export(item);
        } catch (itemError) {
          this.logger.error(`Error transforming ${entity} item ${index} for export:`, itemError);
          // Return partial data with error flag
          return { 
            ...item,
            _error: itemError.message,
            _partial: true
          };
        }
      });
      
      this.logger.info(`Transformed ${transformed.length} ${entity} records for export to ${system}`);
      
      return transformed;
    } catch (error) {
      this.logger.error(`Error transforming ${entity} for export to ${system}:`, error);
      throw error;
    }
  }
  
  /**
   * Validate data against a schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @param {string} context - Context for error messages
   */
  validateAgainstSchema(data, schema, context) {
    // This is a placeholder for schema validation
    // In a real implementation, use a schema validation library like Joi or Yup
    
    const errors = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (data[field] === undefined) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    // Check field types
    if (schema.properties) {
      for (const [field, definition] of Object.entries(schema.properties)) {
        if (data[field] !== undefined) {
          // Type checking
          if (definition.type === 'string' && typeof data[field] !== 'string') {
            errors.push(`Field ${field} should be a string, got ${typeof data[field]}`);
          } else if (definition.type === 'number' && typeof data[field] !== 'number') {
            errors.push(`Field ${field} should be a number, got ${typeof data[field]}`);
          } else if (definition.type === 'boolean' && typeof data[field] !== 'boolean') {
            errors.push(`Field ${field} should be a boolean, got ${typeof data[field]}`);
          } else if (definition.type === 'object' && typeof data[field] !== 'object') {
            errors.push(`Field ${field} should be an object, got ${typeof data[field]}`);
          } else if (definition.type === 'array' && !Array.isArray(data[field])) {
            errors.push(`Field ${field} should be an array, got ${typeof data[field]}`);
          }
        }
      }
    }
    
    if (errors.length > 0) {
      this.logger.warn(`Validation errors for ${context}:`, errors);
    }
  }
  
  /**
   * Register a custom transformer
   * @param {string} system - ERP system type
   * @param {string} entity - Entity type
   * @param {Object} transformer - Transformer functions { import, export }
   */
  registerTransformer(system, entity, transformer) {
    if (!this.transformers[system]) {
      this.transformers[system] = {};
    }
    
    if (!this.transformers[system][entity]) {
      this.transformers[system][entity] = {};
    }
    
    this.transformers[system][entity] = {
      ...this.transformers[system][entity],
      ...transformer
    };
    
    this.logger.info(`Registered custom transformer for ${system}/${entity}`);
  }
}

module.exports = {
  ERPDataTransformer
};
