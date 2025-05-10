/**
 * Validation Module for Time Series ML
 * Provides tools for model validation and selection
 */
const crossValidation = require('./crossValidation');
const metrics = require('./metrics');
const modelSelection = require('./modelSelection');
const dataSplitter = require('./dataSplitter');

/**
 * Split time series data into training, validation, and test sets
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {Array} features - Array of feature objects
 * @param {Array} splitRatio - Ratio for train/validation/test split
 * @returns {Object} - Split data
 */
function splitTimeSeriesData(timeValues, values, features, splitRatio = [0.7, 0.15, 0.15]) {
  return dataSplitter.splitTimeSeriesData(timeValues, values, features, splitRatio);
}

/**
 * Evaluate multiple models on validation data
 * @param {Object} models - Model results from training
 * @param {Array} timeValues - Validation time values
 * @param {Array} values - Validation values
 * @param {string} frequency - Data frequency
 * @returns {Array} - Evaluation results for each model
 */
function evaluateModels(models, timeValues, values, frequency) {
  const results = [];
  
  for (const method of Object.keys(models)) {
    const model = models[method];
    
    const evaluation = evaluateModel(model, timeValues, values, frequency);
    results.push(evaluation);
  }
  
  return results;
}

/**
 * Evaluate a single model on validation data
 * @param {Object} model - Model to evaluate
 * @param {Array} timeValues - Validation time values
 * @param {Array} values - Validation values
 * @param {string} frequency - Data frequency
 * @returns {Object} - Evaluation result
 */
function evaluateModel(model, timeValues, values, frequency) {
  return metrics.calculateMetrics(model, timeValues, values, frequency);
}

/**
 * Select the best model based on validation results
 * @param {Array} validationResults - Results from model evaluation
 * @returns {Object} - Best model
 */
function selectBestModel(validationResults) {
  return modelSelection.selectBestModel(validationResults);
}

/**
 * Compare two models to determine if new one is better
 * @param {Object} existingModel - Existing model
 * @param {Object} newModel - New model
 * @param {Array} timeValues - Test time values
 * @param {Array} values - Test values
 * @param {string} frequency - Data frequency
 * @returns {Object} - Comparison result
 */
function compareModels(existingModel, newModel, timeValues, values, frequency) {
  return modelSelection.compareModels(existingModel, newModel, timeValues, values, frequency);
}

/**
 * Check if retraining is needed based on new data
 * @param {Object} model - Existing model
 * @param {Object} historicalData - Historical data used for training
 * @param {Array} newTimeValues - New time values
 * @param {Array} newValues - New values
 * @param {Object} options - Options for retraining check
 * @returns {boolean} - Whether retraining is needed
 */
function checkRetrainingNeed(model, historicalData, newTimeValues, newValues, options = {}) {
  return modelSelection.checkRetrainingNeed(model, historicalData, newTimeValues, newValues, options);
}

/**
 * Perform cross-validation for time series forecasting
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Data frequency
 * @param {Object} options - Cross-validation options
 * @returns {Object} - Cross-validation results
 */
function performCrossValidation(timeValues, values, frequency, options = {}) {
  return crossValidation.performTimeSeriesCV(timeValues, values, frequency, options);
}

module.exports = {
  splitTimeSeriesData,
  evaluateModels,
  evaluateModel,
  selectBestModel,
  compareModels,
  checkRetrainingNeed,
  performCrossValidation,
  metrics,
  crossValidation,
  modelSelection,
  dataSplitter
};
