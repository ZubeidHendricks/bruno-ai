/**
 * Time Series Forecasting Service
 * Exports all forecasting functionality
 */

// Main forecaster
const forecaster = require('./timeSeriesForecaster');

// Individual forecasting algorithms
const naiveForecaster = require('./algorithms/naiveForecaster');
const movingAverageForecaster = require('./algorithms/movingAverageForecaster');
const linearRegressionForecaster = require('./algorithms/linearRegressionForecaster');
const exponentialSmoothingForecaster = require('./algorithms/exponentialSmoothingForecaster');
const doubleExponentialSmoothingForecaster = require('./algorithms/doubleExponentialSmoothingForecaster');
const seasonalNaiveForecaster = require('./algorithms/seasonalNaiveForecaster');
const holtWintersForecaster = require('./algorithms/holtWintersForecaster');

// Utility modules
const timeUtils = require('./utils/timeUtils');
const seasonalityDetector = require('./utils/seasonalityDetector');
const accuracyUtils = require('./utils/accuracyUtils');

// Export main forecasting functions
module.exports = {
  // Main forecasting functionality
  generateForecasts: forecaster.generateForecasts,
  generateConfidenceIntervals: forecaster.generateConfidenceIntervals,
  
  // Individual forecasting algorithms
  algorithms: {
    naive: naiveForecaster,
    movingAverage: movingAverageForecaster,
    linearRegression: linearRegressionForecaster,
    exponentialSmoothing: exponentialSmoothingForecaster,
    doubleExponentialSmoothing: doubleExponentialSmoothingForecaster,
    seasonalNaive: seasonalNaiveForecaster,
    holtWinters: holtWintersForecaster
  },
  
  // Utility functions
  utils: {
    time: timeUtils,
    seasonality: seasonalityDetector,
    accuracy: accuracyUtils
  }
};
