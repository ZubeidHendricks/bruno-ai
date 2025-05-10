/**
 * Time Series Forecaster
 * Provides forecasting methods for time series data
 */
const _ = require('lodash');
const moment = require('moment');
const logger = require('../../utils/logger');

// Import utility modules
const timeUtils = require('./utils/timeUtils');
const seasonalityDetector = require('./utils/seasonalityDetector');
const accuracyUtils = require('./utils/accuracyUtils');

// Import forecasting algorithms
const naiveForecaster = require('./algorithms/naiveForecaster');
const movingAverageForecaster = require('./algorithms/movingAverageForecaster');
const linearRegressionForecaster = require('./algorithms/linearRegressionForecaster');
const exponentialSmoothingForecaster = require('./algorithms/exponentialSmoothingForecaster');
const doubleExponentialSmoothingForecaster = require('./algorithms/doubleExponentialSmoothingForecaster');
const seasonalNaiveForecaster = require('./algorithms/seasonalNaiveForecaster');
const holtWintersForecaster = require('./algorithms/holtWintersForecaster');

/**
 * Generate forecasts using multiple methods
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Detected data frequency
 * @param {Object} options - Additional options for forecasting
 * @returns {Object} - Forecast results from multiple methods
 */
exports.generateForecasts = async (timeValues, values, frequency, options = {}) => {
  try {
    // Determine forecast horizon based on data frequency and length
    const defaultHorizon = timeUtils.getDefaultHorizon(frequency);
    const horizon = options.horizon || defaultHorizon;
    
    // Make sure we have enough data for forecasting
    if (values.length < 3) {
      return {
        horizonPeriods: horizon,
        methods: {},
        bestMethod: null,
        reason: 'Insufficient data for forecasting'
      };
    }
    
    // Generate last time point for forecasting
    const lastTimePoint = timeValues[timeValues.length - 1];
    
    // Generate future time points
    const futureTimes = timeUtils.generateFutureTimePoints(
      lastTimePoint, frequency, horizon, timeValues
    );
    
    // Check if a specific method is requested
    const specificMethod = options.method && options.method !== 'auto' ? options.method : null;
    
    // Initialize forecast results
    const forecasts = {
      horizonPeriods: horizon,
      horizonDates: futureTimes,
      methods: {},
      bestMethod: null
    };
    
    // Method 1: Naive forecast (last value)
    if (!specificMethod || specificMethod === 'naive') {
      const naiveForecast = naiveForecaster.generateNaiveForecast(values, horizon);
      forecasts.methods.naive = {
        name: naiveForecaster.name,
        description: naiveForecaster.description,
        values: naiveForecast,
        accuracy: naiveForecaster.calculateAccuracy(values)
      };
    }
    
    // Method 2: Moving Average
    if (!specificMethod || specificMethod === 'movingAverage') {
      const maWindow = Math.min(5, Math.floor(values.length / 3));
      const maForecast = movingAverageForecaster.generateMovingAverageForecast(values, maWindow, horizon);
      forecasts.methods.movingAverage = {
        name: movingAverageForecaster.name,
        description: `${movingAverageForecaster.description} (window: ${maWindow})`,
        values: maForecast,
        window: maWindow,
        accuracy: movingAverageForecaster.calculateAccuracy(values, maWindow)
      };
    }
    
    // Method 3: Linear Regression
    if (!specificMethod || specificMethod === 'linearRegression') {
      const { slope, intercept } = linearRegressionForecaster.linearRegression(values);
      const lrForecasts = linearRegressionForecaster.generateLinearRegressionForecast(values, horizon);
      forecasts.methods.linearRegression = {
        name: linearRegressionForecaster.name,
        description: linearRegressionForecaster.description,
        values: lrForecasts,
        slope,
        intercept,
        accuracy: linearRegressionForecaster.calculateAccuracy(values)
      };
    }
    
    // Method 4: Exponential Smoothing
    if (!specificMethod || specificMethod === 'exponentialSmoothing') {
      const alpha = options.alpha || 0.3; // Smoothing factor
      const esForecasts = exponentialSmoothingForecaster.generateExponentialSmoothingForecast(values, alpha, horizon);
      forecasts.methods.exponentialSmoothing = {
        name: exponentialSmoothingForecaster.name,
        description: `${exponentialSmoothingForecaster.description} (alpha: ${alpha})`,
        values: esForecasts,
        alpha,
        accuracy: exponentialSmoothingForecaster.calculateAccuracy(values, alpha)
      };
    }
    
    // Method 5: Double Exponential Smoothing (Holt's method)
    if (!specificMethod || specificMethod === 'doubleExponentialSmoothing') {
      const alpha = options.alpha || 0.3;
      const beta = options.beta || 0.1;
      const desForecasts = doubleExponentialSmoothingForecaster.generateDoubleExponentialSmoothingForecast(values, alpha, beta, horizon);
      forecasts.methods.doubleExponentialSmoothing = {
        name: doubleExponentialSmoothingForecaster.name,
        description: `${doubleExponentialSmoothingForecaster.description} (alpha: ${alpha}, beta: ${beta})`,
        values: desForecasts,
        alpha,
        beta,
        accuracy: doubleExponentialSmoothingForecaster.calculateAccuracy(values, alpha, beta)
      };
    }
    
    // Method 6: Seasonal Naive (if seasonality detected)
    const seasonalPeriod = options.seasonalPeriod || seasonalityDetector.detectSeasonalPeriod(values, frequency);
    if ((!specificMethod || specificMethod === 'seasonalNaive') && 
        values.length >= seasonalPeriod * 2) {
      
      const seasonalForecasts = seasonalNaiveForecaster.generateSeasonalNaiveForecast(values, seasonalPeriod, horizon);
      forecasts.methods.seasonalNaive = {
        name: seasonalNaiveForecaster.name,
        description: `${seasonalNaiveForecaster.description} (period: ${seasonalPeriod})`,
        values: seasonalForecasts,
        period: seasonalPeriod,
        accuracy: seasonalNaiveForecaster.calculateAccuracy(values, seasonalPeriod)
      };
    }
    
    // Method 7: Holt-Winters (Triple Exponential Smoothing) for seasonal data
    if ((!specificMethod || specificMethod === 'holtWinters') && 
        values.length >= seasonalPeriod * 2) {
      
      const alpha = options.alpha || 0.3;
      const beta = options.beta || 0.1;
      const gamma = options.gamma || 0.1;
      
      const hwForecasts = holtWintersForecaster.generateHoltWintersForecast(
        values, seasonalPeriod, alpha, beta, gamma, horizon
      );
      
      forecasts.methods.holtWinters = {
        name: holtWintersForecaster.name,
        description: `${holtWintersForecaster.description} (alpha: ${alpha}, beta: ${beta}, gamma: ${gamma})`,
        values: hwForecasts,
        period: seasonalPeriod,
        alpha,
        beta,
        gamma,
        accuracy: holtWintersForecaster.calculateAccuracy(values, seasonalPeriod, alpha, beta, gamma)
      };
    }
    
    // Determine the best forecasting method based on accuracy metrics
    const methodAccuracies = Object.keys(forecasts.methods)
      .map(method => ({ method, accuracy: forecasts.methods[method].accuracy }))
      .filter(item => item.accuracy !== null);
    
    if (methodAccuracies.length > 0) {
      const bestMethod = _.minBy(methodAccuracies, 'accuracy');
      forecasts.bestMethod = bestMethod.method;
    }
    
    return forecasts;
  } catch (error) {
    logger.error('Error generating forecasts:', { error });
    throw error;
  }
};

/**
 * Generate confidence intervals for forecasts
 * @param {Array} values - Original time series values
 * @param {Object} forecasts - Forecast results
 * @param {number} confidenceLevel - Confidence level (0-1, default: 0.95)
 * @returns {Object} - Forecasts with confidence intervals
 */
exports.generateConfidenceIntervals = (values, forecasts, confidenceLevel = 0.95) => {
  try {
    // Make a copy of forecasts to avoid modifying the original
    const forecastsWithCI = JSON.parse(JSON.stringify(forecasts));
    
    // If no best method is determined, return original forecasts
    if (!forecastsWithCI.bestMethod) {
      return forecastsWithCI;
    }
    
    const bestMethod = forecastsWithCI.bestMethod;
    const forecast = forecastsWithCI.methods[bestMethod];
    
    // Calculate prediction errors for past data using the best method
    const errors = accuracyUtils.calculatePredictionErrors(values, bestMethod, forecast);
    
    // Calculate RMSE (Root Mean Square Error)
    const rmse = Math.sqrt(errors.reduce((sum, err) => sum + err * err, 0) / errors.length);
    
    // Calculate critical value for the given confidence level
    const criticalValue = accuracyUtils.getCriticalValue(confidenceLevel);
    
    // Calculate confidence intervals
    const forecastValues = forecast.values;
    const lowerBounds = [];
    const upperBounds = [];
    
    for (let i = 0; i < forecastValues.length; i++) {
      // Wider intervals for forecasts further into the future
      const widthMultiplier = 1 + (i * 0.1); // Increases width by 10% for each step ahead
      const margin = criticalValue * rmse * widthMultiplier;
      
      lowerBounds.push(forecastValues[i] - margin);
      upperBounds.push(forecastValues[i] + margin);
    }
    
    // Add confidence intervals to the forecast
    forecastsWithCI.methods[bestMethod].confidenceIntervals = {
      level: confidenceLevel * 100,
      lower: lowerBounds,
      upper: upperBounds,
      rmse
    };
    
    return forecastsWithCI;
  } catch (error) {
    logger.error('Error generating confidence intervals:', { error });
    // Return original forecasts if error occurs
    return forecasts;
  }
};
