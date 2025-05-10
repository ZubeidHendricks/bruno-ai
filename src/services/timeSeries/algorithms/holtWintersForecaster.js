/**
 * Holt-Winters Triple Exponential Smoothing Forecaster
 * Accounts for level, trend, and seasonality
 */
const _ = require('lodash');
const doubleExponentialSmoothingForecaster = require('./doubleExponentialSmoothingForecaster');

/**
 * Perform Holt-Winters triple exponential smoothing
 * @param {Array} values - Array of values
 * @param {number} period - Seasonal period
 * @param {number} alpha - Level smoothing factor (0 < alpha < 1)
 * @param {number} beta - Trend smoothing factor (0 < beta < 1)
 * @param {number} gamma - Seasonal smoothing factor (0 < gamma < 1)
 * @param {number} horizon - Forecast horizon
 * @returns {Array} - Forecasted values
 */
function generateHoltWintersForecast(values, period, alpha = 0.3, beta = 0.1, gamma = 0.1, horizon) {
  if (values.length < period * 2) {
    // Not enough data for Holt-Winters, fall back to Double Exponential Smoothing
    return doubleExponentialSmoothingForecaster.generateDoubleExponentialSmoothingForecast(
      values, alpha, beta, horizon
    );
  }
  
  // Initialize level, trend, and seasonal components
  let level = _.mean(values.slice(0, period));
  
  // Initialize trend as average change over first season
  let trend = 0;
  for (let i = 0; i < period; i++) {
    trend += (values[period + i] - values[i]) / period;
  }
  trend /= period;
  
  // Initialize seasonal components
  const seasonals = Array(period).fill(0);
  for (let i = 0; i < period; i++) {
    const sum = values[i] + values[i + period];
    seasonals[i] = sum / 2 / level;
  }
  
  // Normalize seasonals
  const seasonalSum = _.sum(seasonals);
  for (let i = 0; i < period; i++) {
    seasonals[i] = period * seasonals[i] / seasonalSum;
  }
  
  // Apply Holt-Winters algorithm
  const levelHistory = [level];
  const trendHistory = [trend];
  const seasHistory = [...seasonals];
  
  for (let i = period; i < values.length; i++) {
    const oldLevel = level;
    const oldTrend = trend;
    const seasonIndex = i % period;
    
    // Update level, trend, and seasonal components
    level = alpha * (values[i] / seasonals[seasonIndex]) + (1 - alpha) * (oldLevel + oldTrend);
    trend = beta * (level - oldLevel) + (1 - beta) * oldTrend;
    seasonals[seasonIndex] = gamma * (values[i] / level) + (1 - gamma) * seasonals[seasonIndex];
    
    levelHistory.push(level);
    trendHistory.push(trend);
    seasHistory.push(seasonals[seasonIndex]);
  }
  
  // Generate forecasts for the horizon
  const forecasts = [];
  for (let i = 1; i <= horizon; i++) {
    const forecastIndex = (values.length + i - 1) % period;
    forecasts.push((level + i * trend) * seasonals[forecastIndex]);
  }
  
  return forecasts;
}

/**
 * Calculate forecast accuracy for Holt-Winters method
 * @param {Array} values - Original values
 * @param {number} period - Seasonal period
 * @param {number} alpha - Level smoothing factor
 * @param {number} beta - Trend smoothing factor
 * @param {number} gamma - Seasonal smoothing factor
 * @returns {number} - Forecast accuracy (MAPE)
 */
function calculateAccuracy(values, period, alpha = 0.3, beta = 0.1, gamma = 0.1) {
  if (values.length < period * 2) return doubleExponentialSmoothingForecaster.calculateAccuracy(values, alpha, beta);
  
  // Use the first half for training and the second half for testing
  const splitPoint = Math.floor(values.length / 2);
  const trainingData = values.slice(0, splitPoint);
  const testData = values.slice(splitPoint);
  
  // Generate forecasts from training data
  const forecasts = generateHoltWintersForecast(trainingData, period, alpha, beta, gamma, testData.length);
  
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
  generateHoltWintersForecast,
  calculateAccuracy,
  name: 'Holt-Winters',
  description: 'Triple exponential smoothing accounting for trend and seasonality'
};
