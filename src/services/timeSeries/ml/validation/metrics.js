/**
 * Forecast Evaluation Metrics
 * Calculates various metrics to evaluate forecast quality
 */
const _ = require('lodash');
const timeSeriesForecaster = require('../../timeSeriesForecaster');

/**
 * Calculate metrics for a given forecast model
 * @param {Object} model - Model to evaluate
 * @param {Array} timeValues - Time values for evaluation
 * @param {Array} values - Actual values
 * @param {string} frequency - Data frequency
 * @returns {Object} - Metrics for the model
 */
function calculateMetrics(model, timeValues, values, frequency) {
  try {
    // Create a short-term forecast matching the actual values length
    const horizon = values.length;
    
    // We need at least some historical data to make a forecast
    const minHistoryNeeded = 3; // Minimum required history points
    
    if (timeValues.length < minHistoryNeeded) {
      return {
        method: model.method,
        metrics: null,
        error: 'Insufficient data for evaluation'
      };
    }
    
    // Generate forecasts using this model
    const forecasts = generateForecastsFromModel(model, timeValues, values, frequency, horizon);
    
    // Calculate metrics
    const metrics = {
      mape: calculateMAPE(values, forecasts),
      rmse: calculateRMSE(values, forecasts),
      mae: calculateMAE(values, forecasts),
      r2: calculateR2(values, forecasts),
      mase: calculateMASE(values, forecasts),
      smape: calculateSMAPE(values, forecasts),
      bias: calculateBias(values, forecasts)
    };
    
    return {
      method: model.method,
      parameters: model.parameters,
      metrics,
      forecastValues: forecasts
    };
  } catch (error) {
    return {
      method: model.method,
      metrics: null,
      error: error.message
    };
  }
}

/**
 * Generate forecasts using a given model
 * @param {Object} model - Model to use
 * @param {Array} timeValues - Time values
 * @param {Array} values - Actual values
 * @param {string} frequency - Data frequency
 * @param {number} horizon - Forecast horizon
 * @returns {Array} - Forecasted values
 */
function generateForecastsFromModel(model, timeValues, values, frequency, horizon) {
  // Use a portion of the data as history for forecasting
  const forecastStartIdx = Math.max(0, timeValues.length - horizon);
  const historyTimeValues = timeValues.slice(0, forecastStartIdx);
  const historyValues = values.slice(0, forecastStartIdx);
  
  // Generate forecasts using the appropriate method
  let forecastResults;
  
  try {
    forecastResults = timeSeriesForecaster.generateForecasts(
      historyTimeValues,
      historyValues,
      frequency,
      {
        method: model.method,
        ...model.parameters,
        horizon
      }
    );
    
    // Extract forecast values from the appropriate method
    return forecastResults.methods[model.method].values;
  } catch (error) {
    // If using model-specific method fails, fall back to naive forecast
    return Array(horizon).fill(historyValues[historyValues.length - 1] || 0);
  }
}

/**
 * Calculate Mean Absolute Percentage Error (MAPE)
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {number} - MAPE value
 */
function calculateMAPE(actual, forecast) {
  if (actual.length !== forecast.length) {
    throw new Error('Arrays must have the same length');
  }
  
  const errors = [];
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0 && actual[i] !== null && !isNaN(actual[i]) &&
        forecast[i] !== null && !isNaN(forecast[i])) {
      errors.push(Math.abs((actual[i] - forecast[i]) / actual[i]));
    }
  }
  
  if (errors.length === 0) return null;
  
  return _.mean(errors) * 100; // as percentage
}

/**
 * Calculate Root Mean Square Error (RMSE)
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {number} - RMSE value
 */
function calculateRMSE(actual, forecast) {
  if (actual.length !== forecast.length) {
    throw new Error('Arrays must have the same length');
  }
  
  const squaredErrors = [];
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== null && !isNaN(actual[i]) &&
        forecast[i] !== null && !isNaN(forecast[i])) {
      squaredErrors.push(Math.pow(actual[i] - forecast[i], 2));
    }
  }
  
  if (squaredErrors.length === 0) return null;
  
  return Math.sqrt(_.mean(squaredErrors));
}

/**
 * Calculate Mean Absolute Error (MAE)
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {number} - MAE value
 */
function calculateMAE(actual, forecast) {
  if (actual.length !== forecast.length) {
    throw new Error('Arrays must have the same length');
  }
  
  const absoluteErrors = [];
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== null && !isNaN(actual[i]) &&
        forecast[i] !== null && !isNaN(forecast[i])) {
      absoluteErrors.push(Math.abs(actual[i] - forecast[i]));
    }
  }
  
  if (absoluteErrors.length === 0) return null;
  
  return _.mean(absoluteErrors);
}

/**
 * Calculate R-squared (Coefficient of determination)
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {number} - R2 value
 */
function calculateR2(actual, forecast) {
  if (actual.length !== forecast.length) {
    throw new Error('Arrays must have the same length');
  }
  
  const validPairs = [];
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== null && !isNaN(actual[i]) &&
        forecast[i] !== null && !isNaN(forecast[i])) {
      validPairs.push({ actual: actual[i], forecast: forecast[i] });
    }
  }
  
  if (validPairs.length === 0) return null;
  
  const actualValues = validPairs.map(p => p.actual);
  const forecastValues = validPairs.map(p => p.forecast);
  
  const actualMean = _.mean(actualValues);
  
  let totalSS = 0;
  let residualSS = 0;
  
  for (let i = 0; i < validPairs.length; i++) {
    totalSS += Math.pow(actualValues[i] - actualMean, 2);
    residualSS += Math.pow(actualValues[i] - forecastValues[i], 2);
  }
  
  if (totalSS === 0) return null;
  
  return 1 - (residualSS / totalSS);
}

/**
 * Calculate Mean Absolute Scaled Error (MASE)
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {number} - MASE value
 */
function calculateMASE(actual, forecast) {
  if (actual.length !== forecast.length || actual.length < 2) {
    return null;
  }
  
  // Calculate MAE of the forecast
  const mae = calculateMAE(actual, forecast);
  
  if (mae === null) return null;
  
  // Calculate MAE of a naive forecast (one-step ahead)
  const naiveErrors = [];
  
  for (let i = 1; i < actual.length; i++) {
    if (actual[i] !== null && !isNaN(actual[i]) &&
        actual[i-1] !== null && !isNaN(actual[i-1])) {
      naiveErrors.push(Math.abs(actual[i] - actual[i-1]));
    }
  }
  
  if (naiveErrors.length === 0) return null;
  
  const naiveMAE = _.mean(naiveErrors);
  
  if (naiveMAE === 0) return null;
  
  return mae / naiveMAE;
}

/**
 * Calculate Symmetric Mean Absolute Percentage Error (SMAPE)
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {number} - SMAPE value
 */
function calculateSMAPE(actual, forecast) {
  if (actual.length !== forecast.length) {
    throw new Error('Arrays must have the same length');
  }
  
  const errors = [];
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== null && !isNaN(actual[i]) &&
        forecast[i] !== null && !isNaN(forecast[i])) {
      
      const numerator = Math.abs(actual[i] - forecast[i]);
      const denominator = (Math.abs(actual[i]) + Math.abs(forecast[i])) / 2;
      
      if (denominator !== 0) {
        errors.push(numerator / denominator);
      }
    }
  }
  
  if (errors.length === 0) return null;
  
  return _.mean(errors) * 100; // as percentage
}

/**
 * Calculate bias (mean forecast error)
 * @param {Array} actual - Actual values
 * @param {Array} forecast - Forecasted values
 * @returns {number} - Bias value
 */
function calculateBias(actual, forecast) {
  if (actual.length !== forecast.length) {
    throw new Error('Arrays must have the same length');
  }
  
  const errors = [];
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== null && !isNaN(actual[i]) &&
        forecast[i] !== null && !isNaN(forecast[i])) {
      errors.push(actual[i] - forecast[i]);
    }
  }
  
  if (errors.length === 0) return null;
  
  return _.mean(errors);
}

module.exports = {
  calculateMetrics,
  calculateMAPE,
  calculateRMSE,
  calculateMAE,
  calculateR2,
  calculateMASE,
  calculateSMAPE,
  calculateBias,
  generateForecastsFromModel
};
