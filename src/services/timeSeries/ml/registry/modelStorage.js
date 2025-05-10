/**
 * Model Storage
 * Implements storage and retrieval of time series forecast models
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../../../../utils/logger');

// Default storage location
const DEFAULT_STORAGE_PATH = process.env.MODEL_STORAGE_PATH || path.join(process.cwd(), 'models', 'timeSeries');

/**
 * Save a model to storage
 * @param {Object} model - Model to save
 * @param {string} storagePath - Path to storage location
 * @returns {string} - ID of the saved model
 */
async function saveModel(model, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Generate a unique ID if not provided
    const modelId = model.id || generateModelId(model);
    
    // Create models directory if it doesn't exist
    await ensureDirectoryExists(storagePath);
    
    // Create model directory
    const modelDir = path.join(storagePath, modelId);
    await ensureDirectoryExists(modelDir);
    
    // Save model.json
    const modelPath = path.join(modelDir, 'model.json');
    
    // Add ID and timestamp to model if not present
    const modelToSave = {
      ...model,
      id: modelId,
      timestamp: model.timestamp || new Date().toISOString()
    };
    
    await fs.writeFile(
      modelPath, 
      JSON.stringify(modelToSave, null, 2), 
      'utf8'
    );
    
    logger.info(`Model saved successfully with ID: ${modelId}`);
    
    return modelId;
  } catch (error) {
    logger.error('Error saving model:', { error });
    throw error;
  }
}

/**
 * Load a model from storage
 * @param {string} modelId - ID of the model to load
 * @param {string} storagePath - Path to storage location
 * @returns {Object} - Loaded model
 */
async function loadModel(modelId, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const modelPath = path.join(storagePath, modelId, 'model.json');
    
    // Check if file exists
    try {
      await fs.access(modelPath);
    } catch (error) {
      logger.error(`Model not found: ${modelId}`);
      return null;
    }
    
    // Load and parse model
    const modelData = await fs.readFile(modelPath, 'utf8');
    return JSON.parse(modelData);
  } catch (error) {
    logger.error('Error loading model:', { error, modelId });
    throw error;
  }
}

/**
 * Update an existing model in storage
 * @param {string} modelId - ID of the model to update
 * @param {Object} model - Updated model
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the update was successful
 */
async function updateModel(modelId, model, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Check if model exists
    const existingModel = await loadModel(modelId, storagePath);
    
    if (!existingModel) {
      logger.error(`Cannot update non-existent model: ${modelId}`);
      return false;
    }
    
    // Save previous version if versioning is needed
    const versionsDir = path.join(storagePath, modelId, 'versions');
    await ensureDirectoryExists(versionsDir);
    
    const versionId = existingModel.version || '1.0.0';
    const versionPath = path.join(versionsDir, `${versionId}.json`);
    
    await fs.writeFile(
      versionPath,
      JSON.stringify(existingModel, null, 2),
      'utf8'
    );
    
    // Update model.json
    const modelToSave = {
      ...model,
      id: modelId,
      timestamp: new Date().toISOString()
    };
    
    const modelPath = path.join(storagePath, modelId, 'model.json');
    
    await fs.writeFile(
      modelPath,
      JSON.stringify(modelToSave, null, 2),
      'utf8'
    );
    
    logger.info(`Model updated successfully: ${modelId}`);
    
    return true;
  } catch (error) {
    logger.error('Error updating model:', { error, modelId });
    throw error;
  }
}

/**
 * Delete a model from storage
 * @param {string} modelId - ID of the model to delete
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the deletion was successful
 */
async function deleteModel(modelId, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const modelDir = path.join(storagePath, modelId);
    
    // Check if directory exists
    try {
      await fs.access(modelDir);
    } catch (error) {
      logger.error(`Model not found: ${modelId}`);
      return false;
    }
    
    // Recursive directory deletion
    await fs.rm(modelDir, { recursive: true, force: true });
    
    logger.info(`Model deleted successfully: ${modelId}`);
    
    return true;
  } catch (error) {
    logger.error('Error deleting model:', { error, modelId });
    throw error;
  }
}

/**
 * List all models in storage
 * @param {Object} filters - Optional filters
 * @param {string} storagePath - Path to storage location
 * @returns {Array} - List of models
 */
async function listModels(filters = {}, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Ensure storage directory exists
    try {
      await fs.access(storagePath);
    } catch (error) {
      // Create directory if it doesn't exist
      await ensureDirectoryExists(storagePath);
      return []; // Return empty array for new directory
    }
    
    // Get list of model directories
    const modelDirs = await fs.readdir(storagePath);
    
    // Initialize result array
    const models = [];
    
    // Load each model
    for (const modelDir of modelDirs) {
      const modelPath = path.join(storagePath, modelDir, 'model.json');
      
      try {
        // Check if model.json exists
        await fs.access(modelPath);
        
        // Load and parse model
        const modelData = await fs.readFile(modelPath, 'utf8');
        const model = JSON.parse(modelData);
        
        // Apply filters if any
        if (applyFilters(model, filters)) {
          models.push(model);
        }
      } catch (error) {
        // Skip if model.json doesn't exist or can't be parsed
        logger.warn(`Skipping invalid model directory: ${modelDir}`, { error });
        continue;
      }
    }
    
    return models;
  } catch (error) {
    logger.error('Error listing models:', { error });
    throw error;
  }
}

/**
 * Save training data for a model
 * @param {string} modelId - ID of the model
 * @param {Object} data - Training data
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the save was successful
 */
async function saveModelData(modelId, data, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Check if model exists
    const modelDir = path.join(storagePath, modelId);
    
    try {
      await fs.access(modelDir);
    } catch (error) {
      logger.error(`Model not found: ${modelId}`);
      return false;
    }
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(modelDir, 'data');
    await ensureDirectoryExists(dataDir);
    
    // Save data.json
    const dataPath = path.join(dataDir, 'training_data.json');
    
    await fs.writeFile(
      dataPath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
    
    logger.info(`Model data saved successfully for model: ${modelId}`);
    
    return true;
  } catch (error) {
    logger.error('Error saving model data:', { error, modelId });
    throw error;
  }
}

/**
 * Load training data for a model
 * @param {string} modelId - ID of the model
 * @param {string} storagePath - Path to storage location
 * @returns {Object} - Model training data
 */
async function loadModelData(modelId, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const dataPath = path.join(storagePath, modelId, 'data', 'training_data.json');
    
    // Check if file exists
    try {
      await fs.access(dataPath);
    } catch (error) {
      logger.error(`Model data not found: ${modelId}`);
      return null;
    }
    
    // Load and parse data
    const modelData = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(modelData);
  } catch (error) {
    logger.error('Error loading model data:', { error, modelId });
    throw error;
  }
}

/**
 * Apply filters to a model
 * @param {Object} model - Model to filter
 * @param {Object} filters - Filters to apply
 * @returns {boolean} - Whether the model passes the filters
 */
function applyFilters(model, filters) {
  // If no filters, return true
  if (!filters || Object.keys(filters).length === 0) {
    return true;
  }
  
  // Check each filter
  for (const [key, value] of Object.entries(filters)) {
    // Handle nested keys (e.g., 'metrics.mape')
    const keys = key.split('.');
    let modelValue = model;
    
    for (const k of keys) {
      if (modelValue === undefined || modelValue === null) {
        return false;
      }
      modelValue = modelValue[k];
    }
    
    // Check if value matches
    if (modelValue !== value) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate a unique model ID
 * @param {Object} model - Model to generate ID for
 * @returns {string} - Generated ID
 */
function generateModelId(model) {
  // Create a hash of the model method and timestamp
  const input = `${model.method}_${model.timestamp || new Date().toISOString()}`;
  return crypto.createHash('md5').update(input).digest('hex').substring(0, 10);
}

/**
 * Ensure a directory exists
 * @param {string} directory - Directory path
 */
async function ensureDirectoryExists(directory) {
  try {
    await fs.access(directory);
  } catch (error) {
    // Create directory if it doesn't exist
    await fs.mkdir(directory, { recursive: true });
  }
}

module.exports = {
  saveModel,
  loadModel,
  updateModel,
  deleteModel,
  listModels,
  saveModelData,
  loadModelData
};
