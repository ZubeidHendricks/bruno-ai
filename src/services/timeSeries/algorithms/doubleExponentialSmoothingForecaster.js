/**
 * Double Exponential Smoothing Forecaster (Holt's method)
 * Handles both level and trend components
 */
const _ = require('lodash');

/**
 * Perform double exponential smoothing (Holt's method)
 * @param {Array} values - Array of values
 * @param {number} alpha - Level smoothing factor (0 < alpha < 1)
 * @param {number} beta - Trend smoothing factor (0 < beta < 1)
 * @param {number} horizon - Forecast horizon
 * @returns {Array} - Forecasted values
 */
function generateDoubleExponentialSmoothingForecast(values, alpha = 0.3, beta = 0.1, horizon) {
  if (values.length < 2) return Array(horizon).fill(values.length > 0 ? values[0] : 0);
  
  // Initialize level and trend
  let level = values[0];
  let trend = values[1] - values[0];
  
  // Update level and trend with each observed value
  for (let i = 1; i < values.length; i++) {
    const oldLevel = level;
    
    // Update level and trend
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - oldLevel) + (1 - beta) * trend;
  }
  
  // Generate forecasts for the horizon
  const forecasts = [];
  for (let i = 1; i <= horizon; i++) {
    forecasts.push(level + i * trend);
  }
  
  return forecasts;
}

/**
 * Calculate forecast accuracy for double exponential smoothing method
 * @param {Array} values - Original values
 * @param {number} alpha - Level smoothing factor
 * @param {number} beta - Trend smoothing factor
 * @returns {number} - Forecast accuracy (MAPE)
 */
function calculateAccuracy(values, alpha = 0.3, beta = 0.1) {
  if (values.length < 5) return null;
  
  // Use the first half for training and the second half for testing
  const splitPoint = Math.floor(values.length / 2);
  const trainingData = values.slice(0, splitPoint);
  const testData = values.slice(splitPoint);
  
  // Generate forecasts from training data
  const forecasts = generateDoubleExponentialSmoothingForecast(trainingData, alpha, beta, testData.length);
  
  // Calculate forecast errors
  const errors = [];
  for (let i = 0; i < testData.length; i++) {
    if (testData[i] !== 0) {
      const error = Math.abs((testData[i] - forecasts[i]) / testData[i]);
      errors.push(error);
    }
  }
  
  // Calculate Mean Absolute Percentage Error (MAPE)
  if (errors.length === 0) return null;
  
  return _.mean(errors) * 100; // MAPE as percentage
}

module.exports = {
  generateDoubleExponentialSmoothingForecast,
  calculateAccuracy,
  name: 'Double Exponential Smoothing',
  description: 'Handles both level and trend components'
};
