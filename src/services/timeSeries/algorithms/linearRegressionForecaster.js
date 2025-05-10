/**
 * Linear Regression Forecaster
 * Forecasts based on linear trend in the data
 */
const _ = require('lodash');

/**
 * Calculate linear regression parameters
 * @param {Array} values - Array of values
 * @returns {Object} - Slope and intercept
 */
function linearRegression(values) {
  const n = values.length;
  const x = [...Array(n).keys()]; // 0, 1, 2, ...
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += values[i];
    sumXY += x[i] * values[i];
    sumXX += x[i] * x[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Generate linear regression forecast
 * @param {Array} values - Array of values
 * @param {number} horizon - Forecast horizon
 * @returns {Array} - Forecasted values
 */
function generateLinearRegressionForecast(values, horizon) {
  if (values.length < 2) return Array(horizon).fill(values.length > 0 ? values[0] : 0);
  
  const { slope, intercept } = linearRegression(values);
  
  const forecasts = [];
  for (let i = 1; i <= horizon; i++) {
    forecasts.push(intercept + slope * (values.length + i - 1));
  }
  
  return forecasts;
}

/**
 * Calculate forecast accuracy for linear regression method
 * @param {Array} values - Original values
 * @returns {number} - Forecast accuracy (MAPE)
 */
function calculateAccuracy(values) {
  if (values.length < 5) return null;
  
  // Use the first half for training and the second half for testing
  const splitPoint = Math.floor(values.length / 2);
  const trainingData = values.slice(0, splitPoint);
  const testData = values.slice(splitPoint);
  
  // Calculate linear regression from training data
  const { slope, intercept } = linearRegression(trainingData);
  
  // Generate forecasts for test data
  const forecasts = [];
  for (let i = 0; i < testData.length; i++) {
    forecasts.push(intercept + slope * (trainingData.length + i));
  }
  
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
  linearRegression,
  generateLinearRegressionForecast,
  calculateAccuracy,
  name: 'Linear Regression',
  description: 'Forecasts based on linear trend in the data'
};
