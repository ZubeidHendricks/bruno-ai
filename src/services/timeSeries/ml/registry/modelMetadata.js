/**
 * Model Metadata
 * Manages metadata for time series forecast models
 */
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../../../utils/logger');

// Default storage location
const DEFAULT_STORAGE_PATH = process.env.MODEL_STORAGE_PATH || path.join(process.cwd(), 'models', 'timeSeries');

/**
 * Get metadata for a model
 * @param {string} modelId - ID of the model
 * @param {string} storagePath - Path to storage location
 * @returns {Object} - Model metadata
 */
async function getMetadata(modelId, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const metadataPath = path.join(storagePath, modelId, 'metadata.json');
    
    // Check if file exists
    try {
      await fs.access(metadataPath);
    } catch (error) {
      // If metadata file doesn't exist, create an empty one
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          description: '',
          owner: '',
          deployments: []
        }, null, 2),
        'utf8'
      );
    }
    
    // Load and parse metadata
    const metadataData = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(metadataData);
  } catch (error) {
    logger.error('Error getting model metadata:', { error, modelId });
    throw error;
  }
}

/**
 * Update metadata for a model
 * @param {string} modelId - ID of the model
 * @param {Object} metadata - Metadata to update
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the update was successful
 */
async function updateMetadata(modelId, metadata, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Check if model directory exists
    const modelDir = path.join(storagePath, modelId);
    
    try {
      await fs.access(modelDir);
    } catch (error) {
      logger.error(`Model not found: ${modelId}`);
      return false;
    }
    
    // Get current metadata
    const currentMetadata = await getMetadata(modelId, storagePath);
    
    // Merge with new metadata
    const updatedMetadata = {
      ...currentMetadata,
      ...metadata,
      updatedAt: new Date().toISOString()
    };
    
    // Write updated metadata
    const metadataPath = path.join(modelDir, 'metadata.json');
    
    await fs.writeFile(
      metadataPath,
      JSON.stringify(updatedMetadata, null, 2),
      'utf8'
    );
    
    logger.info(`Updated metadata for model ${modelId}`);
    
    return true;
  } catch (error) {
    logger.error('Error updating model metadata:', { error, modelId });
    throw error;
  }
}

/**
 * Add deployment info to model metadata
 * @param {string} modelId - ID of the model
 * @param {Object} deploymentInfo - Deployment information
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the update was successful
 */
async function addDeployment(modelId, deploymentInfo, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Get current metadata
    const metadata = await getMetadata(modelId, storagePath);
    
    // Add deployment info
    const deployments = metadata.deployments || [];
    
    deployments.push({
      ...deploymentInfo,
      timestamp: new Date().toISOString(),
      status: deploymentInfo.status || 'active'
    });
    
    // Update metadata with new deployments
    return updateMetadata(modelId, { deployments }, storagePath);
  } catch (error) {
    logger.error('Error adding deployment info:', { error, modelId });
    throw error;
  }
}

/**
 * Update deployment status in model metadata
 * @param {string} modelId - ID of the model
 * @param {string} deploymentId - ID of the deployment
 * @param {string} status - New status
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the update was successful
 */
async function updateDeploymentStatus(modelId, deploymentId, status, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Get current metadata
    const metadata = await getMetadata(modelId, storagePath);
    
    // Find deployment by ID
    const deployments = metadata.deployments || [];
    const deploymentIndex = deployments.findIndex(d => d.id === deploymentId);
    
    if (deploymentIndex === -1) {
      logger.error(`Deployment not found: ${deploymentId} for model ${modelId}`);
      return false;
    }
    
    // Update status
    deployments[deploymentIndex] = {
      ...deployments[deploymentIndex],
      status,
      statusUpdatedAt: new Date().toISOString()
    };
    
    // Update metadata with updated deployments
    return updateMetadata(modelId, { deployments }, storagePath);
  } catch (error) {
    logger.error('Error updating deployment status:', { error, modelId, deploymentId });
    throw error;
  }
}

/**
 * Add a tag to model metadata
 * @param {string} modelId - ID of the model
 * @param {string} tag - Tag to add
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the update was successful
 */
async function addTag(modelId, tag, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Get current metadata
    const metadata = await getMetadata(modelId, storagePath);
    
    // Add tag if it doesn't exist
    const tags = metadata.tags || [];
    
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
    
    // Update metadata with new tags
    return updateMetadata(modelId, { tags }, storagePath);
  } catch (error) {
    logger.error('Error adding tag:', { error, modelId, tag });
    throw error;
  }
}

/**
 * Remove a tag from model metadata
 * @param {string} modelId - ID of the model
 * @param {string} tag - Tag to remove
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the update was successful
 */
async function removeTag(modelId, tag, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Get current metadata
    const metadata = await getMetadata(modelId, storagePath);
    
    // Remove tag if it exists
    const tags = metadata.tags || [];
    const updatedTags = tags.filter(t => t !== tag);
    
    // Update metadata with new tags
    return updateMetadata(modelId, { tags: updatedTags }, storagePath);
  } catch (error) {
    logger.error('Error removing tag:', { error, modelId, tag });
    throw error;
  }
}

module.exports = {
  getMetadata,
  updateMetadata,
  addDeployment,
  updateDeploymentStatus,
  addTag,
  removeTag
};
