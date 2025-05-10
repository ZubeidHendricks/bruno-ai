/**
 * Exponential Smoothing Forecaster
 * Weighted average with exponentially decreasing weights
 */
const _ = require('lodash');

/**
 * Perform exponential smoothing
 * @param {Array} values - Array of values
 * @param {number} alpha - Smoothing factor (0 < alpha < 1)
 * @param {number} horizon - Forecast horizon
 * @returns {Array} - Forecasted values
 */
function generateExponentialSmoothingForecast(values, alpha = 0.3, horizon) {
  if (values.length < 1) return Array(horizon).fill(0);
  
  // Initialize forecast with the first observed value
  let forecast = values[0];
  
  // Update forecast with each observed value
  for (let i = 1; i < values.length; i++) {
    forecast = alpha * values[i] + (1 - alpha) * forecast;
  }
  
  // Generate forecasts for the horizon
  return Array(horizon).fill(forecast);
}

/**
 * Calculate forecast accuracy for exponential smoothing method
 * @param {Array} values - Original values
 * @param {number} alpha - Smoothing factor (0 < alpha < 1)
 * @returns {number} - Forecast accuracy (MAPE)
 */
function calculateAccuracy(values, alpha = 0.3) {
  if (values.length < 5) return null;
  
  // Use the first half for training and the second half for testing
  const splitPoint = Math.floor(values.length / 2);
  const trainingData = values.slice(0, splitPoint);
  const testData = values.slice(splitPoint);
  
  // Generate forecasts from training data
  const forecasts = generateExponentialSmoothingForecast(trainingData, alpha, testData.length);
  
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
  generateExponentialSmoothingForecast,
  calculateAccuracy,
  name: 'Exponential Smoothing',
  description: 'Weighted average with exponentially decreasing weights'
};
