/**
 * Model Training
 * Core functionality for training time series forecast models
 */
const _ = require('lodash');
const logger = require('../../../../utils/logger');
const timeSeriesForecaster = require('../../timeSeriesForecaster');

/**
 * Train a specific forecasting model
 * @param {string} method - Forecasting method
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Detected data frequency
 * @param {Array} features - Generated features
 * @param {Object} parameters - Model parameters
 * @param {Object} options - Training options
 * @returns {Object} - Trained model
 */
async function trainModel(method, timeValues, values, frequency, features, parameters = {}, options = {}) {
  try {
    logger.info(`Training ${method} model with parameters:`, parameters);
    
    // Apply feature preprocessing if needed
    const processedValues = applyFeaturePreprocessing(values, features, method, options);
    
    // Generate forecasts to obtain model information
    const forecastResults = await timeSeriesForecaster.generateForecasts(
      timeValues,
      processedValues,
      frequency,
      {
        method,
        ...parameters,
        horizon: options.horizon || timeSeriesForecaster.utils.time.getDefaultHorizon(frequency)
      }
    );
    
    // Extract model information from forecast results
    const modelInfo = forecastResults.methods[method];
    
    // Create model object
    const model = {
      method,
      parameters,
      metrics: {
        accuracy: modelInfo.accuracy,
        // Add more metrics if available in the forecast results
      },
      features: getFeatureImportance(features, method, options),
      timestamp: new Date().toISOString(),
      status: 'trained'
    };
    
    return model;
  } catch (error) {
    logger.error(`Error training ${method} model:`, { error });
    throw error;
  }
}

/**
 * Apply feature preprocessing for a specific model
 * @param {Array} values - Original values
 * @param {Array} features - Generated features
 * @param {string} method - Forecasting method
 * @param {Object} options - Training options
 * @returns {Array} - Processed values
 */
function applyFeaturePreprocessing(values, features, method, options = {}) {
  // For simple models, we don't need feature preprocessing yet
  // This is a placeholder for future ML integration
  return values;
}

/**
 * Calculate feature importance for the trained model
 * @param {Array} features - Generated features
 * @param {string} method - Forecasting method
 * @param {Object} options - Training options
 * @returns {Array} - Feature importance
 */
function getFeatureImportance(features, method, options = {}) {
  // For simple models, feature importance is not applicable yet
  // This is a placeholder for future ML integration
  
  // Return skeleton for feature importance
  return features.map(feature => ({
    name: feature.name,
    importance: 0, // Placeholder value
    description: feature.description
  }));
}

/**
 * Evaluate a trained model on test data
 * @param {Object} model - Trained model
 * @param {Array} testTimeValues - Test time values
 * @param {Array} testValues - Test values
 * @param {string} frequency - Data frequency
 * @returns {Object} - Evaluation results
 */
async function evaluateModel(model, testTimeValues, testValues, frequency) {
  try {
    logger.info(`Evaluating ${model.method} model on test data`);
    
    // Generate forecasts for test period
    const forecastResults = await timeSeriesForecaster.generateForecasts(
      testTimeValues.slice(0, 1), // Use just the first time point as reference
      testValues.slice(0, 1),     // Use just the first value as reference
      frequency,
      {
        method: model.method,
        ...model.parameters,
        horizon: testValues.length - 1
      }
    );
    
    // Extract forecast values
    const forecasts = forecastResults.methods[model.method].values;
    
    // Calculate error metrics
    const metrics = calculateErrorMetrics(testValues.slice(1), forecasts);
    
    return {
      model: model.method,
      parameters: model.parameters,
      metrics,
      forecasts
    };
  } catch (error) {
    logger.error(`Error evaluating ${model.method} model:`, { error });
    throw error;
  }
}

/**
 * Calculate error metrics for model evaluation
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {Object} - Error metrics
 */
function calculateErrorMetrics(actual, forecast) {
  // Basic implementation - will be expanded in the future
  const errors = [];
  const squaredErrors = [];
  const absoluteErrors = [];
  const percentageErrors = [];
  
  for (let i = 0; i < Math.min(actual.length, forecast.length); i++) {
    if (actual[i] !== null && !isNaN(actual[i]) &&
        forecast[i] !== null && !isNaN(forecast[i])) {
      const error = actual[i] - forecast[i];
      errors.push(error);
      squaredErrors.push(error * error);
      absoluteErrors.push(Math.abs(error));
      
      if (actual[i] !== 0) {
        percentageErrors.push(Math.abs(error / actual[i]));
      }
    }
  }
  
  // Calculate metrics
  const mse = squaredErrors.length > 0 ? _.mean(squaredErrors) : null;
  const rmse = mse !== null ? Math.sqrt(mse) : null;
  const mae = absoluteErrors.length > 0 ? _.mean(absoluteErrors) : null;
  const mape = percentageErrors.length > 0 ? _.mean(percentageErrors) * 100 : null;
  const bias = errors.length > 0 ? _.mean(errors) : null;
  
  return {
    mse,
    rmse,
    mae,
    mape,
    bias
  };
}

/**
 * Save a trained model
 * @param {Object} model - Trained model
 * @param {string} path - Path to save the model
 * @returns {boolean} - Whether the save was successful
 */
async function saveModel(model, path) {
  try {
    const fs = require('fs').promises;
    
    // Create directory if it doesn't exist
    try {
      await fs.access(path);
    } catch (error) {
      await fs.mkdir(path, { recursive: true });
    }
    
    // Save model to file
    const modelPath = require('path').join(path, `${model.method}_model.json`);
    
    await fs.writeFile(
      modelPath,
      JSON.stringify(model, null, 2),
      'utf8'
    );
    
    logger.info(`Model saved to ${modelPath}`);
    
    return true;
  } catch (error) {
    logger.error('Error saving model:', { error });
    return false;
  }
}

/**
 * Load a trained model
 * @param {string} modelPath - Path to the model file
 * @returns {Object} - Loaded model
 */
async function loadModel(modelPath) {
  try {
    const fs = require('fs').promises;
    
    // Check if file exists
    try {
      await fs.access(modelPath);
    } catch (error) {
      logger.error(`Model file not found: ${modelPath}`);
      return null;
    }
    
    // Load and parse model
    const modelData = await fs.readFile(modelPath, 'utf8');
    return JSON.parse(modelData);
  } catch (error) {
    logger.error('Error loading model:', { error, modelPath });
    throw error;
  }
}

module.exports = {
  trainModel,
  evaluateModel,
  applyFeaturePreprocessing,
  getFeatureImportance,
  calculateErrorMetrics,
  saveModel,
  loadModel
};
