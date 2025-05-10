/**
 * Model Registry for Time Series Forecasting
 * Manages storing and retrieving forecast models
 */
const modelStorage = require('./modelStorage');
const modelVersioning = require('./modelVersioning');
const modelMetadata = require('./modelMetadata');

/**
 * Register a model in the registry
 * @param {Object} model - Model to register
 * @returns {string} - ID of the registered model
 */
async function registerModel(model) {
  return modelStorage.saveModel(model);
}

/**
 * Get a model from the registry
 * @param {string} modelId - ID of the model to retrieve
 * @returns {Object} - Retrieved model
 */
async function getModel(modelId) {
  return modelStorage.loadModel(modelId);
}

/**
 * Update an existing model in the registry
 * @param {string} modelId - ID of the model to update
 * @param {Object} model - Updated model
 * @returns {boolean} - Whether the update was successful
 */
async function updateModel(modelId, model) {
  return modelStorage.updateModel(modelId, model);
}

/**
 * Delete a model from the registry
 * @param {string} modelId - ID of the model to delete
 * @returns {boolean} - Whether the deletion was successful
 */
async function deleteModel(modelId) {
  return modelStorage.deleteModel(modelId);
}

/**
 * List all models in the registry
 * @param {Object} filters - Optional filters
 * @returns {Array} - List of models
 */
async function listModels(filters = {}) {
  return modelStorage.listModels(filters);
}

/**
 * Get the data used to train a model
 * @param {string} modelId - ID of the model
 * @returns {Object} - Training data
 */
async function getModelData(modelId) {
  return modelStorage.loadModelData(modelId);
}

/**
 * Save the data used to train a model
 * @param {string} modelId - ID of the model
 * @param {Object} data - Training data
 * @returns {boolean} - Whether the save was successful
 */
async function saveModelData(modelId, data) {
  return modelStorage.saveModelData(modelId, data);
}

/**
 * Get model version history
 * @param {string} modelId - ID of the model
 * @returns {Array} - Version history
 */
async function getModelVersions(modelId) {
  return modelVersioning.getVersionHistory(modelId);
}

/**
 * Get a specific version of a model
 * @param {string} modelId - ID of the model
 * @param {string} version - Version to retrieve
 * @returns {Object} - Model at the specified version
 */
async function getModelVersion(modelId, version) {
  return modelVersioning.getModelVersion(modelId, version);
}

/**
 * Tag a model version
 * @param {string} modelId - ID of the model
 * @param {string} version - Version to tag
 * @param {string} tag - Tag to apply
 * @returns {boolean} - Whether the tagging was successful
 */
async function tagModelVersion(modelId, version, tag) {
  return modelVersioning.tagVersion(modelId, version, tag);
}

/**
 * Get model metadata
 * @param {string} modelId - ID of the model
 * @returns {Object} - Model metadata
 */
async function getModelMetadata(modelId) {
  return modelMetadata.getMetadata(modelId);
}

/**
 * Update model metadata
 * @param {string} modelId - ID of the model
 * @param {Object} metadata - Metadata to update
 * @returns {boolean} - Whether the update was successful
 */
async function updateModelMetadata(modelId, metadata) {
  return modelMetadata.updateMetadata(modelId, metadata);
}

module.exports = {
  registerModel,
  getModel,
  updateModel,
  deleteModel,
  listModels,
  getModelData,
  saveModelData,
  getModelVersions,
  getModelVersion,
  tagModelVersion,
  getModelMetadata,
  updateModelMetadata
};
