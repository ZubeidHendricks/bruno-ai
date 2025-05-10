/**
 * Accuracy Utilities for Time Series Forecasting
 */
const _ = require('lodash');

/**
 * Calculate prediction errors for a given forecast method
 * @param {Array} values - Original values
 * @param {string} method - Forecasting method
 * @param {Object} forecast - Forecast parameters
 * @returns {Array} - Array of prediction errors
 */
function calculatePredictionErrors(values, method, forecast) {
  if (values.length < 3) return [];
  
  // Use the last third of the data to calculate errors
  const testStartIndex = Math.floor(values.length * 2 / 3);
  const trainingData = values.slice(0, testStartIndex);
  const testData = values.slice(testStartIndex);
  
  // Get the appropriate forecaster
  const forecaster = getForecastingMethod(method);
  if (!forecaster) return [];
  
  // Generate one-step-ahead forecasts for the test data
  const forecasts = [];
  
  for (let i = 0; i < testData.length; i++) {
    const currentData = [...trainingData, ...testData.slice(0, i)];
    let nextForecast;
    
    try {
      switch (method) {
        case 'naive':
          nextForecast = currentData[currentData.length - 1];
          break;
        case 'movingAverage':
          const window = forecast.window || Math.min(5, Math.floor(currentData.length / 3));
          const movingAverageForecaster = require('../algorithms/movingAverageForecaster');
          nextForecast = movingAverageForecaster.calculateMovingAverage(currentData, window);
          break;
        case 'linearRegression':
          const linearRegressionForecaster = require('../algorithms/linearRegressionForecaster');
          const { slope, intercept } = linearRegressionForecaster.linearRegression(currentData);
          nextForecast = intercept + slope * currentData.length;
          break;
        case 'exponentialSmoothing':
          const alpha = forecast.alpha || 0.3;
          const exponentialSmoothingForecaster = require('../algorithms/exponentialSmoothingForecaster');
          const esForecasts = exponentialSmoothingForecaster.generateExponentialSmoothingForecast(currentData, alpha, 1);
          nextForecast = esForecasts[0];
          break;
        case 'doubleExponentialSmoothing':
          const desAlpha = forecast.alpha || 0.3;
          const desBeta = forecast.beta || 0.1;
          const doubleExponentialSmoothingForecaster = require('../algorithms/doubleExponentialSmoothingForecaster');
          const desForecasts = doubleExponentialSmoothingForecaster.generateDoubleExponentialSmoothingForecast(
            currentData, desAlpha, desBeta, 1
          );
          nextForecast = desForecasts[0];
          break;
        case 'seasonalNaive':
          const snPeriod = forecast.period || 7;
          if (currentData.length >= snPeriod) {
            nextForecast = currentData[currentData.length - snPeriod];
          } else {
            nextForecast = currentData[currentData.length - 1];
          }
          break;
        case 'holtWinters':
          const hwPeriod = forecast.period || 7;
          const hwAlpha = forecast.alpha || 0.3;
          const hwBeta = forecast.beta || 0.1;
          const hwGamma = forecast.gamma || 0.1;
          
          if (currentData.length >= hwPeriod * 2) {
            const holtWintersForecaster = require('../algorithms/holtWintersForecaster');
            const hwForecasts = holtWintersForecaster.generateHoltWintersForecast(
              currentData, hwPeriod, hwAlpha, hwBeta, hwGamma, 1
            );
            nextForecast = hwForecasts[0];
          } else if (currentData.length >= 2) {
            const doubleExponentialSmoothingForecaster = require('../algorithms/doubleExponentialSmoothingForecaster');
            const desForecasts = doubleExponentialSmoothingForecaster.generateDoubleExponentialSmoothingForecast(
              currentData, hwAlpha, hwBeta, 1
            );
            nextForecast = desForecasts[0];
          } else {
            nextForecast = currentData[currentData.length - 1];
          }
          break;
        default:
          nextForecast = currentData[currentData.length - 1];
      }
    } catch (error) {
      // If forecasting fails, use the last value
      nextForecast = currentData[currentData.length - 1];
    }
    
    forecasts.push(nextForecast);
  }
  
  // Calculate errors
  return testData.map((actual, i) => actual - forecasts[i]);
}

/**
 * Get critical value for confidence interval
 * @param {number} confidenceLevel - Confidence level (0-1)
 * @returns {number} - Critical value
 */
function getCriticalValue(confidenceLevel) {
  // Approximate critical values for normal distribution
  switch (Math.round(confidenceLevel * 100)) {
    case 90: return 1.645;
    case 95: return 1.96;
    case 99: return 2.576;
    default:
      // Linear interpolation for other confidence levels
      if (confidenceLevel >= 0.9 && confidenceLevel < 0.95) {
        return 1.645 + (1.96 - 1.645) * ((confidenceLevel - 0.9) / 0.05);
      } else if (confidenceLevel >= 0.95 && confidenceLevel < 0.99) {
        return 1.96 + (2.576 - 1.96) * ((confidenceLevel - 0.95) / 0.04);
      } else if (confidenceLevel >= 0.8 && confidenceLevel < 0.9) {
        return 1.28 + (1.645 - 1.28) * ((confidenceLevel - 0.8) / 0.1);
      } else {
        return 1.96; // Default to 95% confidence
      }
  }
}

/**
 * Helper function to get the appropriate forecasting module
 * @param {string} method - Forecasting method name
 * @returns {Object|null} - Forecasting module or null if not found
 */
function getForecastingMethod(method) {
  try {
    switch (method) {
      case 'naive':
        return require('../algorithms/naiveForecaster');
      case 'movingAverage':
        return require('../algorithms/movingAverageForecaster');
      case 'linearRegression':
        return require('../algorithms/linearRegressionForecaster');
      case 'exponentialSmoothing':
        return require('../algorithms/exponentialSmoothingForecaster');
      case 'doubleExponentialSmoothing':
        return require('../algorithms/doubleExponentialSmoothingForecaster');
      case 'seasonalNaive':
        return require('../algorithms/seasonalNaiveForecaster');
      case 'holtWinters':
        return require('../algorithms/holtWintersForecaster');
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

module.exports = {
  calculatePredictionErrors,
  getCriticalValue,
  getForecastingMethod
};
