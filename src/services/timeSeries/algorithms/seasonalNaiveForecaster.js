/**
 * Seasonal Naive Forecaster
 * Uses values from the same season in the previous cycle
 */
const _ = require('lodash');

/**
 * Perform seasonal naive forecasting
 * @param {Array} values - Array of values
 * @param {number} period - Seasonal period
 * @param {number} horizon - Forecast horizon
 * @returns {Array} - Forecasted values
 */
function generateSeasonalNaiveForecast(values, period, horizon) {
  const forecasts = [];
  
  for (let i = 0; i < horizon; i++) {
    const seasonalIndex = (values.length + i) % period;
    const lastSeasonValue = values[values.length - period + seasonalIndex];
    forecasts.push(lastSeasonValue);
  }
  
  return forecasts;
}

/**
 * Calculate forecast accuracy for seasonal naive method
 * @param {Array} values - Original values
 * @param {number} period - Seasonal period
 * @returns {number} - Forecast accuracy (MAPE)
 */
function calculateAccuracy(values, period) {
  if (values.length < period * 2) return null;
  
  // Use the first half for training and the second half for testing
  const splitPoint = Math.floor(values.length / 2);
  const trainingData = values.slice(0, splitPoint);
  const testData = values.slice(splitPoint);
  
  // Generate forecasts from training data
  const forecasts = [];
  for (let i = 0; i < testData.length; i++) {
    const seasonalIndex = (trainingData.length + i) % period;
    const value = trainingData[trainingData.length - period + seasonalIndex];
    forecasts.push(value);
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
  generateSeasonalNaiveForecast,
  calculateAccuracy,
  name: 'Seasonal Naive',
  description: 'Uses values from the same season in the previous cycle'
};
