/**
 * Moving Average Forecaster
 * Uses the average of the last n values for forecasting
 */
const _ = require('lodash');

/**
 * Calculate moving average
 * @param {Array} values - Array of values
 * @param {number} window - Window size for moving average
 * @returns {number} - Moving average value
 */
function calculateMovingAverage(values, window) {
  const n = values.length;
  const windowSize = Math.min(window, n);
  
  let sum = 0;
  for (let i = n - windowSize; i < n; i++) {
    sum += values[i];
  }
  
  return sum / windowSize;
}

/**
 * Generate moving average forecast
 * @param {Array} values - Array of values
 * @param {number} window - Window size for moving average
 * @param {number} horizon - Forecast horizon
 * @returns {Array} - Forecasted values
 */
function generateMovingAverageForecast(values, window, horizon) {
  if (values.length < 1) return Array(horizon).fill(0);
  
  const maValue = calculateMovingAverage(values, window);
  return Array(horizon).fill(maValue);
}

/**
 * Calculate forecast accuracy for moving average method
 * @param {Array} values - Original values
 * @param {number} window - Window size for moving average
 * @returns {number} - Forecast accuracy (MAPE)
 */
function calculateAccuracy(values, window) {
  if (values.length < 5) return null;
  
  // Use the first half for training and the second half for testing
  const splitPoint = Math.floor(values.length / 2);
  const trainingData = values.slice(0, splitPoint);
  const testData = values.slice(splitPoint);
  
  // Calculate moving average from training data
  const maWindow = window || Math.min(5, Math.floor(trainingData.length / 3));
  const ma = calculateMovingAverage(trainingData, maWindow);
  const forecasts = Array(testData.length).fill(ma);
  
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
  calculateMovingAverage,
  generateMovingAverageForecast,
  calculateAccuracy,
  name: 'Moving Average',
  description: 'Uses the average of the last n values'
};
