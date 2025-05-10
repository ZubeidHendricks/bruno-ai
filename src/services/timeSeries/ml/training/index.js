/**
 * Time Series Model Training
 * Coordinates the training of time series forecast models
 */
const _ = require('lodash');
const logger = require('../../../../utils/logger');
const timeSeriesForecaster = require('../../timeSeriesForecaster');
const hyperparameterTuning = require('./hyperparameterTuning');
const modelTraining = require('./modelTraining');

/**
 * Train multiple forecasting models
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Detected data frequency
 * @param {Array} features - Generated features
 * @param {Object} options - Training options
 * @returns {Object} - Training results for all models
 */
async function trainModels(timeValues, values, frequency, features, options = {}) {
  try {
    logger.info('Starting model training with options:', { options });
    
    // Determine which methods to train
    const methodsToTrain = options.methods || [
      'naive',
      'movingAverage',
      'linearRegression',
      'exponentialSmoothing',
      'doubleExponentialSmoothing',
      'seasonalNaive',
      'holtWinters'
    ];
    
    const results = {};
    
    // Train each method
    for (const method of methodsToTrain) {
      logger.info(`Training model: ${method}`);
      
      try {
        // Determine if hyperparameter tuning is needed
        let params = {};
        
        if (options.enableHyperparameterTuning) {
          logger.info(`Performing hyperparameter tuning for method: ${method}`);
          params = await hyperparameterTuning.tuneHyperparameters(
            method, 
            timeValues, 
            values, 
            frequency, 
            features,
            options
          );
          logger.info(`Optimal parameters for ${method}:`, params);
        } else {
          // Use default parameters or provided ones
          params = getDefaultParameters(method, options);
        }
        
        // Train the model
        const modelResult = await modelTraining.trainModel(
          method,
          timeValues,
          values,
          frequency,
          features,
          params,
          options
        );
        
        results[method] = modelResult;
      } catch (error) {
        logger.error(`Error training model ${method}:`, { error });
        results[method] = {
          method,
          error: error.message,
          status: 'failed'
        };
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Error in trainModels:', { error });
    throw error;
  }
}

/**
 * Get default parameters for a forecasting method
 * @param {string} method - Forecasting method
 * @param {Object} options - Training options
 * @returns {Object} - Default parameters
 */
function getDefaultParameters(method, options = {}) {
  // Check if parameters are provided in options
  if (options[method]) {
    return options[method];
  }
  
  // Default parameters for each method
  switch (method) {
    case 'naive':
      return {};
    
    case 'movingAverage':
      return {
        window: options.maWindow || 5
      };
    
    case 'linearRegression':
      return {};
    
    case 'exponentialSmoothing':
      return {
        alpha: options.alpha || 0.3
      };
    
    case 'doubleExponentialSmoothing':
      return {
        alpha: options.alpha || 0.3,
        beta: options.beta || 0.1
      };
    
    case 'seasonalNaive':
      return {
        seasonalPeriod: options.seasonalPeriod
      };
    
    case 'holtWinters':
      return {
        alpha: options.alpha || 0.3,
        beta: options.beta || 0.1,
        gamma: options.gamma || 0.1,
        seasonalPeriod: options.seasonalPeriod
      };
    
    default:
      return {};
  }
}

/**
 * Retrain a specific model with new data
 * @param {Object} model - Existing model
 * @param {Array} newTimeValues - New time values
 * @param {Array} newValues - New values
 * @param {Array} features - Generated features
 * @param {Object} options - Training options
 * @returns {Object} - Retrained model
 */
async function retrainModel(model, newTimeValues, newValues, features, options = {}) {
  try {
    logger.info('Retraining model:', { method: model.method });
    
    // Combine existing data with new data
    const combinedTimeValues = [...(options.previousTimeValues || []), ...newTimeValues];
    const combinedValues = [...(options.previousValues || []), ...newValues];
    
    // Train the model with combined data
    return modelTraining.trainModel(
      model.method,
      combinedTimeValues,
      combinedValues,
      options.frequency || 'auto',
      features,
      model.parameters || getDefaultParameters(model.method, options),
      options
    );
  } catch (error) {
    logger.error('Error in retrainModel:', { error, method: model.method });
    throw error;
  }
}

/**
 * Export model to a standardized format
 * @param {Object} model - Trained model
 * @returns {Object} - Exported model
 */
function exportModel(model) {
  return {
    id: model.id,
    method: model.method,
    parameters: model.parameters,
    metrics: model.metrics,
    timestamp: model.timestamp || new Date().toISOString(),
    version: model.version || '1.0.0'
  };
}

/**
 * Import model from a standardized format
 * @param {Object} modelData - Exported model data
 * @returns {Object} - Imported model
 */
function importModel(modelData) {
  // Validate model data
  if (!modelData.method) {
    throw new Error('Invalid model data: missing method');
  }
  
  return {
    id: modelData.id,
    method: modelData.method,
    parameters: modelData.parameters || {},
    metrics: modelData.metrics || {},
    timestamp: modelData.timestamp || new Date().toISOString(),
    version: modelData.version || '1.0.0'
  };
}

module.exports = {
  trainModels,
  retrainModel,
  exportModel,
  importModel,
  getDefaultParameters
};
