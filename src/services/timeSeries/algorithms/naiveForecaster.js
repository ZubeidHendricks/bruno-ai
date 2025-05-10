/**
 * Naive Forecaster
 * Uses the last observed value for all future forecasts
 */
const _ = require('lodash');

/**
 * Generate naive forecast
 * @param {Array} values - Array of values
 * @param {number} horizon - Forecast horizon
 * @returns {Array} - Forecasted values
 */
function generateNaiveForecast(values, horizon) {
  if (values.length < 1) return Array(horizon).fill(0);
  
  const lastValue = values[values.length - 1];
  return Array(horizon).fill(lastValue);
}

/**
 * Calculate forecast accuracy for naive method
 * @param {Array} values - Original values
 * @returns {number} - Forecast accuracy (MAPE)
 */
function calculateAccuracy(values) {
  if (values.length < 5) return null;
  
  // Use the first half for training and the second half for testing
  const splitPoint = Math.floor(values.length / 2);
  const trainingData = values.slice(0, splitPoint);
  const testData = values.slice(splitPoint);
  
  // Last value of training data
  const forecasts = Array(testData.length).fill(trainingData[trainingData.length - 1]);
  
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
  generateNaiveForecast,
  calculateAccuracy,
  name: 'Naive Forecast',
  description: 'Uses the last observed value for all future forecasts'
};
