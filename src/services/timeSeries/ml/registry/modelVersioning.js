/**
 * Model Versioning
 * Handles versioning of time series forecast models
 */
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../../../utils/logger');

// Default storage location
const DEFAULT_STORAGE_PATH = process.env.MODEL_STORAGE_PATH || path.join(process.cwd(), 'models', 'timeSeries');

/**
 * Get version history for a model
 * @param {string} modelId - ID of the model
 * @param {string} storagePath - Path to storage location
 * @returns {Array} - Version history
 */
async function getVersionHistory(modelId, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const versionsDir = path.join(storagePath, modelId, 'versions');
    
    // Check if versions directory exists
    try {
      await fs.access(versionsDir);
    } catch (error) {
      logger.warn(`No version history found for model: ${modelId}`);
      return [];
    }
    
    // Get list of version files
    const versionFiles = await fs.readdir(versionsDir);
    
    // Filter out non-JSON files
    const jsonFiles = versionFiles.filter(file => file.endsWith('.json'));
    
    // Initialize result array
    const versions = [];
    
    // Load each version
    for (const file of jsonFiles) {
      const versionPath = path.join(versionsDir, file);
      
      try {
        // Load and parse version
        const versionData = await fs.readFile(versionPath, 'utf8');
        const version = JSON.parse(versionData);
        
        versions.push({
          version: version.version || file.replace('.json', ''),
          timestamp: version.timestamp,
          method: version.method,
          metrics: version.metrics
        });
      } catch (error) {
        // Skip if file can't be parsed
        logger.warn(`Skipping invalid version file: ${file}`, { error });
        continue;
      }
    }
    
    // Sort versions by timestamp (newest first)
    versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return versions;
  } catch (error) {
    logger.error('Error getting version history:', { error, modelId });
    throw error;
  }
}

/**
 * Get a specific version of a model
 * @param {string} modelId - ID of the model
 * @param {string} version - Version to retrieve
 * @param {string} storagePath - Path to storage location
 * @returns {Object} - Model at the specified version
 */
async function getModelVersion(modelId, version, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const versionPath = path.join(storagePath, modelId, 'versions', `${version}.json`);
    
    // Check if file exists
    try {
      await fs.access(versionPath);
    } catch (error) {
      logger.error(`Version not found: ${modelId} v${version}`);
      return null;
    }
    
    // Load and parse version
    const versionData = await fs.readFile(versionPath, 'utf8');
    return JSON.parse(versionData);
  } catch (error) {
    logger.error('Error getting model version:', { error, modelId, version });
    throw error;
  }
}

/**
 * Tag a model version
 * @param {string} modelId - ID of the model
 * @param {string} version - Version to tag
 * @param {string} tag - Tag to apply
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the tagging was successful
 */
async function tagVersion(modelId, version, tag, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Check if version exists
    const versionModel = await getModelVersion(modelId, version, storagePath);
    
    if (!versionModel) {
      logger.error(`Cannot tag non-existent version: ${modelId} v${version}`);
      return false;
    }
    
    // Create tags directory if it doesn't exist
    const tagsDir = path.join(storagePath, modelId, 'tags');
    await ensureDirectoryExists(tagsDir);
    
    // Create tag file
    const tagPath = path.join(tagsDir, `${tag}.json`);
    
    // Write tag file with version reference
    await fs.writeFile(
      tagPath,
      JSON.stringify({
        tag,
        version,
        timestamp: new Date().toISOString()
      }, null, 2),
      'utf8'
    );
    
    logger.info(`Tagged model ${modelId} version ${version} as "${tag}"`);
    
    return true;
  } catch (error) {
    logger.error('Error tagging version:', { error, modelId, version, tag });
    throw error;
  }
}

/**
 * Get all tags for a model
 * @param {string} modelId - ID of the model
 * @param {string} storagePath - Path to storage location
 * @returns {Array} - List of tags
 */
async function getTags(modelId, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const tagsDir = path.join(storagePath, modelId, 'tags');
    
    // Check if tags directory exists
    try {
      await fs.access(tagsDir);
    } catch (error) {
      logger.warn(`No tags found for model: ${modelId}`);
      return [];
    }
    
    // Get list of tag files
    const tagFiles = await fs.readdir(tagsDir);
    
    // Filter out non-JSON files
    const jsonFiles = tagFiles.filter(file => file.endsWith('.json'));
    
    // Initialize result array
    const tags = [];
    
    // Load each tag
    for (const file of jsonFiles) {
      const tagPath = path.join(tagsDir, file);
      
      try {
        // Load and parse tag
        const tagData = await fs.readFile(tagPath, 'utf8');
        const tag = JSON.parse(tagData);
        
        tags.push(tag);
      } catch (error) {
        // Skip if file can't be parsed
        logger.warn(`Skipping invalid tag file: ${file}`, { error });
        continue;
      }
    }
    
    return tags;
  } catch (error) {
    logger.error('Error getting tags:', { error, modelId });
    throw error;
  }
}

/**
 * Get a model by tag
 * @param {string} modelId - ID of the model
 * @param {string} tag - Tag to retrieve
 * @param {string} storagePath - Path to storage location
 * @returns {Object} - Model with the specified tag
 */
async function getModelByTag(modelId, tag, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const tagPath = path.join(storagePath, modelId, 'tags', `${tag}.json`);
    
    // Check if tag file exists
    try {
      await fs.access(tagPath);
    } catch (error) {
      logger.error(`Tag not found: ${modelId} "${tag}"`);
      return null;
    }
    
    // Load and parse tag
    const tagData = await fs.readFile(tagPath, 'utf8');
    const tagInfo = JSON.parse(tagData);
    
    // Get the model version
    return getModelVersion(modelId, tagInfo.version, storagePath);
  } catch (error) {
    logger.error('Error getting model by tag:', { error, modelId, tag });
    throw error;
  }
}

/**
 * Roll back to a previous version
 * @param {string} modelId - ID of the model
 * @param {string} version - Version to roll back to
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the rollback was successful
 */
async function rollbackToVersion(modelId, version, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Get the specified version
    const versionModel = await getModelVersion(modelId, version, storagePath);
    
    if (!versionModel) {
      logger.error(`Cannot roll back to non-existent version: ${modelId} v${version}`);
      return false;
    }
    
    // Get current model
    const modelPath = path.join(storagePath, modelId, 'model.json');
    
    try {
      await fs.access(modelPath);
    } catch (error) {
      logger.error(`Model not found: ${modelId}`);
      return false;
    }
    
    // Save current model as a version
    const currentModel = JSON.parse(await fs.readFile(modelPath, 'utf8'));
    const currentVersion = currentModel.version;
    
    // Create versions directory if it doesn't exist
    const versionsDir = path.join(storagePath, modelId, 'versions');
    await ensureDirectoryExists(versionsDir);
    
    // Save current model as a version
    const currentVersionPath = path.join(versionsDir, `${currentVersion}.json`);
    
    await fs.writeFile(
      currentVersionPath,
      JSON.stringify(currentModel, null, 2),
      'utf8'
    );
    
    // Write the rolled-back version as the current model
    await fs.writeFile(
      modelPath,
      JSON.stringify({
        ...versionModel,
        timestamp: new Date().toISOString(),
        rollbackInfo: {
          rollbackFrom: currentVersion,
          rollbackTo: version,
          rollbackTime: new Date().toISOString()
        }
      }, null, 2),
      'utf8'
    );
    
    logger.info(`Rolled back model ${modelId} from version ${currentVersion} to ${version}`);
    
    return true;
  } catch (error) {
    logger.error('Error rolling back version:', { error, modelId, version });
    throw error;
  }
}

/**
 * Create a new version from a model
 * @param {string} modelId - ID of the model
 * @param {Object} model - Model to create version from
 * @param {string} version - Version string
 * @param {string} storagePath - Path to storage location
 * @returns {boolean} - Whether the version creation was successful
 */
async function createVersion(modelId, model, version, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    // Check if model directory exists
    const modelDir = path.join(storagePath, modelId);
    
    try {
      await fs.access(modelDir);
    } catch (error) {
      logger.error(`Model not found: ${modelId}`);
      return false;
    }
    
    // Create versions directory if it doesn't exist
    const versionsDir = path.join(modelDir, 'versions');
    await ensureDirectoryExists(versionsDir);
    
    // Create version file
    const versionPath = path.join(versionsDir, `${version}.json`);
    
    // Check if version already exists
    try {
      await fs.access(versionPath);
      logger.error(`Version already exists: ${modelId} v${version}`);
      return false;
    } catch (error) {
      // This is expected if the version doesn't exist yet
    }
    
    // Write version file
    await fs.writeFile(
      versionPath,
      JSON.stringify({
        ...model,
        version,
        timestamp: model.timestamp || new Date().toISOString()
      }, null, 2),
      'utf8'
    );
    
    logger.info(`Created version ${version} for model ${modelId}`);
    
    return true;
  } catch (error) {
    logger.error('Error creating version:', { error, modelId, version });
    throw error;
  }
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
  getVersionHistory,
  getModelVersion,
  tagVersion,
  getTags,
  getModelByTag,
  rollbackToVersion,
  createVersion
};
