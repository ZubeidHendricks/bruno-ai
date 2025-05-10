/**
 * Model Selection for Time Series Forecasting
 * Provides tools for selecting and comparing forecast models
 */
const _ = require('lodash');
const metrics = require('./metrics');

/**
 * Select the best model based on validation results
 * @param {Array} validationResults - Results from model evaluation
 * @returns {Object} - Best model
 */
function selectBestModel(validationResults) {
  // Filter out models with no metrics
  const validModels = validationResults.filter(model => model.metrics !== null);
  
  if (validModels.length === 0) {
    throw new Error('No valid models to select from');
  }
  
  // Primary metric for selection is MAPE (Mean Absolute Percentage Error)
  // If MAPE is not available, use RMSE (Root Mean Square Error)
  // If neither is available, use MAE (Mean Absolute Error)
  
  // Try MAPE first
  const modelsWithMape = validModels.filter(model => 
    model.metrics.mape !== null && !isNaN(model.metrics.mape)
  );
  
  if (modelsWithMape.length > 0) {
    return _.minBy(modelsWithMape, model => model.metrics.mape);
  }
  
  // If no valid MAPE, try RMSE
  const modelsWithRmse = validModels.filter(model => 
    model.metrics.rmse !== null && !isNaN(model.metrics.rmse)
  );
  
  if (modelsWithRmse.length > 0) {
    return _.minBy(modelsWithRmse, model => model.metrics.rmse);
  }
  
  // If no valid RMSE, try MAE
  const modelsWithMae = validModels.filter(model => 
    model.metrics.mae !== null && !isNaN(model.metrics.mae)
  );
  
  if (modelsWithMae.length > 0) {
    return _.minBy(modelsWithMae, model => model.metrics.mae);
  }
  
  // If none of the above, just return the first valid model
  return validModels[0];
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
  // Generate forecasts from both models
  const existingForecasts = metrics.generateForecastsFromModel(
    existingModel, 
    timeValues, 
    values, 
    frequency, 
    values.length
  );
  
  const newForecasts = metrics.generateForecastsFromModel(
    newModel, 
    timeValues, 
    values, 
    frequency, 
    values.length
  );
  
  // Calculate metrics for both models
  const existingMape = metrics.calculateMAPE(values, existingForecasts);
  const newMape = metrics.calculateMAPE(values, newForecasts);
  
  const existingRmse = metrics.calculateRMSE(values, existingForecasts);
  const newRmse = metrics.calculateRMSE(values, newForecasts);
  
  const existingMae = metrics.calculateMAE(values, existingForecasts);
  const newMae = metrics.calculateMAE(values, newForecasts);
  
  // Initialize result
  const result = {
    isImprovement: false,
    improvementPercentage: 0,
    primaryMetric: 'mape', // Default primary metric
    metrics: {
      existing: {
        mape: existingMape,
        rmse: existingRmse,
        mae: existingMae
      },
      new: {
        mape: newMape,
        rmse: newRmse,
        mae: newMae
      }
    }
  };
  
  // Primary metric is MAPE if available, otherwise RMSE, then MAE
  if (existingMape !== null && newMape !== null) {
    result.primaryMetric = 'mape';
    result.isImprovement = newMape < existingMape;
    
    if (existingMape !== 0) {
      result.improvementPercentage = ((existingMape - newMape) / existingMape) * 100;
    } else {
      result.improvementPercentage = newMape === 0 ? 0 : -Infinity;
    }
  } else if (existingRmse !== null && newRmse !== null) {
    result.primaryMetric = 'rmse';
    result.isImprovement = newRmse < existingRmse;
    
    if (existingRmse !== 0) {
      result.improvementPercentage = ((existingRmse - newRmse) / existingRmse) * 100;
    } else {
      result.improvementPercentage = newRmse === 0 ? 0 : -Infinity;
    }
  } else if (existingMae !== null && newMae !== null) {
    result.primaryMetric = 'mae';
    result.isImprovement = newMae < existingMae;
    
    if (existingMae !== 0) {
      result.improvementPercentage = ((existingMae - newMae) / existingMae) * 100;
    } else {
      result.improvementPercentage = newMae === 0 ? 0 : -Infinity;
    }
  }
  
  return result;
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
  // Default thresholds
  const driftThreshold = options.driftThreshold || 0.2; // 20% change in distribution
  const minNewDataPoints = options.minNewDataPoints || 5;
  const forcedRetrain = options.forcedRetrain || false;
  
  // Check if forced retraining is requested
  if (forcedRetrain) {
    return true;
  }
  
  // Check if we have enough new data
  if (newValues.length < minNewDataPoints) {
    return false;
  }
  
  // Check for concept drift by comparing distributions
  const drift = calculateDistributionDrift(historicalData.values, newValues);
  
  if (drift > driftThreshold) {
    return true;
  }
  
  // Check forecast error on new data
  const forecastHorizon = newValues.length;
  const forecasts = metrics.generateForecastsFromModel(
    model,
    historicalData.timeValues,
    historicalData.values,
    historicalData.frequency,
    forecastHorizon
  );
  
  const mape = metrics.calculateMAPE(newValues, forecasts);
  
  // If MAPE is much higher than during training, retrain
  if (mape !== null && model.metrics && model.metrics.mape !== null) {
    const errorRatio = mape / model.metrics.mape;
    
    // If error is significantly higher (e.g., 50% worse)
    if (errorRatio > 1.5) {
      return true;
    }
  }
  
  // Check if too much time has passed since last training
  if (options.maxModelAge) {
    const lastTrainDate = new Date(model.timestamp);
    const currentDate = new Date();
    const ageInDays = (currentDate - lastTrainDate) / (1000 * 60 * 60 * 24);
    
    if (ageInDays > options.maxModelAge) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate distribution drift between two datasets
 * @param {Array} oldValues - Original values
 * @param {Array} newValues - New values
 * @returns {number} - Drift measure (0-1)
 */
function calculateDistributionDrift(oldValues, newValues) {
  // Filter out null and NaN values
  const validOldValues = oldValues.filter(v => v !== null && !isNaN(v));
  const validNewValues = newValues.filter(v => v !== null && !isNaN(v));
  
  if (validOldValues.length === 0 || validNewValues.length === 0) {
    return 0;
  }
  
  // Calculate basic statistics
  const oldMean = _.mean(validOldValues);
  const newMean = _.mean(validNewValues);
  
  const oldStd = Math.sqrt(
    validOldValues.reduce((sum, val) => sum + Math.pow(val - oldMean, 2), 0) / validOldValues.length
  );
  
  const newStd = Math.sqrt(
    validNewValues.reduce((sum, val) => sum + Math.pow(val - newMean, 2), 0) / validNewValues.length
  );
  
  // Calculate relative changes
  let meanChange = 0;
  if (oldMean !== 0) {
    meanChange = Math.abs((newMean - oldMean) / oldMean);
  } else if (newMean !== 0) {
    meanChange = 1; // Max change if old mean was 0 but new mean is not
  }
  
  let stdChange = 0;
  if (oldStd !== 0) {
    stdChange = Math.abs((newStd - oldStd) / oldStd);
  } else if (newStd !== 0) {
    stdChange = 1; // Max change if old std was 0 but new std is not
  }
  
  // Combine into a single drift measure (simple average for now)
  const drift = (meanChange + stdChange) / 2;
  
  return Math.min(1, drift); // Clamp to 0-1 range
}

module.exports = {
  selectBestModel,
  compareModels,
  checkRetrainingNeed,
  calculateDistributionDrift
};
