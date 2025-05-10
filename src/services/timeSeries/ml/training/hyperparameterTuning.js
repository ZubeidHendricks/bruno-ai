/**
 * Hyperparameter Tuning
 * Optimizes model parameters for time series forecasting
 */
const _ = require('lodash');
const logger = require('../../../../utils/logger');
const timeSeriesForecaster = require('../../timeSeriesForecaster');
const validation = require('../validation');

/**
 * Tune hyperparameters for a specific forecasting method
 * @param {string} method - Forecasting method
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Detected data frequency
 * @param {Array} features - Generated features
 * @param {Object} options - Tuning options
 * @returns {Object} - Optimal parameters
 */
async function tuneHyperparameters(method, timeValues, values, frequency, features, options = {}) {
  try {
    logger.info(`Starting hyperparameter tuning for ${method}`);
    
    // Get parameter grid for the specified method
    const paramGrid = getParameterGrid(method, frequency, options);
    
    // If the grid is empty, return default parameters
    if (Object.keys(paramGrid).length === 0) {
      return getDefaultParameters(method, frequency);
    }
    
    // Generate parameter combinations
    const paramCombinations = generateParameterCombinations(paramGrid);
    
    logger.info(`Generated ${paramCombinations.length} parameter combinations for ${method}`);
    
    // Split data for cross-validation
    const { trainData, validationData } = validation.splitTimeSeriesData(
      timeValues, 
      values, 
      features,
      options.splitRatio || [0.7, 0.3, 0] // Only train and validation sets
    );
    
    // Evaluate each parameter combination
    const results = [];
    
    for (const params of paramCombinations) {
      try {
        // Generate forecasts with the current parameters
        const forecasts = await timeSeriesForecaster.generateForecasts(
          trainData.timeValues,
          trainData.values,
          frequency,
          {
            method,
            ...params,
            horizon: validationData.values.length
          }
        );
        
        // Extract forecast values
        const forecastValues = forecasts.methods[method].values;
        
        // Calculate error metrics
        const metrics = calculateTuningMetrics(validationData.values, forecastValues);
        
        results.push({
          params,
          metrics
        });
      } catch (error) {
        logger.warn(`Error evaluating parameters for ${method}:`, { error, params });
        // Skip this combination if there's an error
        continue;
      }
    }
    
    // Select best parameters based on primary metric
    const primaryMetric = options.primaryMetric || 'mape';
    
    // Filter out results with null metrics
    const validResults = results.filter(r => r.metrics[primaryMetric] !== null);
    
    if (validResults.length === 0) {
      logger.warn(`No valid parameter combinations found for ${method}, using defaults`);
      return getDefaultParameters(method, frequency);
    }
    
    // Find best parameters
    let bestResult;
    
    if (primaryMetric === 'r2') {
      // For R²: higher is better
      bestResult = _.maxBy(validResults, r => r.metrics[primaryMetric]);
    } else {
      // For error metrics: lower is better
      bestResult = _.minBy(validResults, r => r.metrics[primaryMetric]);
    }
    
    logger.info(`Best parameters for ${method}:`, {
      params: bestResult.params,
      metrics: bestResult.metrics
    });
    
    return bestResult.params;
  } catch (error) {
    logger.error(`Error in hyperparameter tuning for ${method}:`, { error });
    return getDefaultParameters(method, frequency);
  }
}

/**
 * Get parameter grid for a specific forecasting method
 * @param {string} method - Forecasting method
 * @param {string} frequency - Data frequency
 * @param {Object} options - Tuning options
 * @returns {Object} - Parameter grid
 */
function getParameterGrid(method, frequency, options = {}) {
  // Define parameter grids for each method
  switch (method) {
    case 'naive':
      // No parameters to tune
      return {};
    
    case 'movingAverage':
      return {
        window: options.maWindowValues || [3, 5, 7, 10]
      };
    
    case 'linearRegression':
      // No parameters to tune
      return {};
    
    case 'exponentialSmoothing':
      return {
        alpha: options.alphaValues || [0.1, 0.2, 0.3, 0.5, 0.7, 0.9]
      };
    
    case 'doubleExponentialSmoothing':
      return {
        alpha: options.alphaValues || [0.1, 0.3, 0.5, 0.7, 0.9],
        beta: options.betaValues || [0.05, 0.1, 0.2, 0.3, 0.5]
      };
    
    case 'seasonalNaive': {
      // If seasonal period is provided, use it
      const seasonalPeriod = options.seasonalPeriod;
      
      if (seasonalPeriod) {
        return {
          seasonalPeriod: [seasonalPeriod]
        };
      }
      
      // Otherwise, try different periods based on frequency
      const periods = getSeasonalPeriodsForFrequency(frequency);
      
      return {
        seasonalPeriod: periods
      };
    }
    
    case 'holtWinters':
      // Combine parameters for Holt-Winters
      const baseParams = {
        alpha: options.alphaValues || [0.1, 0.3, 0.5, 0.7, 0.9],
        beta: options.betaValues || [0.05, 0.1, 0.2, 0.3, 0.5],
        gamma: options.gammaValues || [0.05, 0.1, 0.2, 0.3, 0.5]
      };
      
      // If seasonal period is provided, use it
      const seasonalPeriod = options.seasonalPeriod;
      
      if (seasonalPeriod) {
        return {
          ...baseParams,
          seasonalPeriod: [seasonalPeriod]
        };
      }
      
      // Otherwise, try different periods based on frequency
      const periods = getSeasonalPeriodsForFrequency(frequency);
      
      return {
        ...baseParams,
        seasonalPeriod: periods
      };
    
    default:
      return {};
  }
}

/**
 * Get default parameters for a forecasting method
 * @param {string} method - Forecasting method
 * @param {string} frequency - Data frequency
 * @returns {Object} - Default parameters
 */
function getDefaultParameters(method, frequency) {
  // Default parameters for each method
  switch (method) {
    case 'naive':
      return {};
    
    case 'movingAverage':
      return {
        window: 5
      };
    
    case 'linearRegression':
      return {};
    
    case 'exponentialSmoothing':
      return {
        alpha: 0.3
      };
    
    case 'doubleExponentialSmoothing':
      return {
        alpha: 0.3,
        beta: 0.1
      };
    
    case 'seasonalNaive': {
      const periods = getSeasonalPeriodsForFrequency(frequency);
      return {
        seasonalPeriod: periods[0] // Use first period as default
      };
    }
    
    case 'holtWinters': {
      const periods = getSeasonalPeriodsForFrequency(frequency);
      return {
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.1,
        seasonalPeriod: periods[0] // Use first period as default
      };
    }
    
    default:
      return {};
  }
}

/**
 * Get possible seasonal periods based on data frequency
 * @param {string} frequency - Data frequency
 * @returns {Array} - Possible seasonal periods
 */
function getSeasonalPeriodsForFrequency(frequency) {
  switch (frequency) {
    case 'daily':
      return [7, 14]; // Weekly patterns
    
    case 'weekly':
      return [4, 8, 13]; // Monthly and quarterly patterns
    
    case 'monthly':
      return [3, 4, 6, 12]; // Quarterly, yearly patterns
    
    case 'quarterly':
      return [4]; // Yearly pattern
    
    case 'yearly':
      return [4, 5, 10]; // Common yearly cycles
    
    default:
      return [7]; // Default to weekly
  }
}

/**
 * Generate all combinations of parameters from a parameter grid
 * @param {Object} paramGrid - Parameter grid
 * @returns {Array} - Array of parameter combinations
 */
function generateParameterCombinations(paramGrid) {
  const paramNames = Object.keys(paramGrid);
  
  if (paramNames.length === 0) {
    return [{}];
  }
  
  // Helper function to generate combinations recursively
  function generateCombinationsRecursive(index, currentCombination) {
    if (index === paramNames.length) {
      return [currentCombination];
    }
    
    const paramName = paramNames[index];
    const paramValues = paramGrid[paramName];
    const result = [];
    
    for (const value of paramValues) {
      result.push(
        ...generateCombinationsRecursive(index + 1, {
          ...currentCombination,
          [paramName]: value
        })
      );
    }
    
    return result;
  }
  
  return generateCombinationsRecursive(0, {});
}

/**
 * Calculate error metrics for hyperparameter tuning
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {Object} - Error metrics
 */
function calculateTuningMetrics(actual, forecast) {
  // Extract valid pairs for metrics calculation
  const validPairs = [];
  
  for (let i = 0; i < Math.min(actual.length, forecast.length); i++) {
    if (actual[i] !== null && !isNaN(actual[i]) &&
        forecast[i] !== null && !isNaN(forecast[i])) {
      validPairs.push({
        actual: actual[i],
        forecast: forecast[i]
      });
    }
  }
  
  if (validPairs.length === 0) {
    return {
      mape: null,
      rmse: null,
      mae: null,
      r2: null
    };
  }
  
  // Calculate MAPE (Mean Absolute Percentage Error)
  const mapeValues = validPairs
    .filter(p => p.actual !== 0)
    .map(p => Math.abs((p.actual - p.forecast) / p.actual));
  
  const mape = mapeValues.length > 0 ? _.mean(mapeValues) * 100 : null;
  
  // Calculate RMSE (Root Mean Square Error)
  const mse = _.mean(validPairs.map(p => Math.pow(p.actual - p.forecast, 2)));
  const rmse = Math.sqrt(mse);
  
  // Calculate MAE (Mean Absolute Error)
  const mae = _.mean(validPairs.map(p => Math.abs(p.actual - p.forecast)));
  
  // Calculate R² (Coefficient of determination)
  const actualValues = validPairs.map(p => p.actual);
  const forecastValues = validPairs.map(p => p.forecast);
  const actualMean = _.mean(actualValues);
  
  let totalSS = 0;
  let residualSS = 0;
  
  for (let i = 0; i < validPairs.length; i++) {
    totalSS += Math.pow(actualValues[i] - actualMean, 2);
    residualSS += Math.pow(actualValues[i] - forecastValues[i], 2);
  }
  
  const r2 = totalSS === 0 ? null : 1 - (residualSS / totalSS);
  
  return {
    mape,
    rmse,
    mae,
    r2
  };
}

module.exports = {
  tuneHyperparameters,
  getParameterGrid,
  getDefaultParameters,
  generateParameterCombinations,
  calculateTuningMetrics
};
