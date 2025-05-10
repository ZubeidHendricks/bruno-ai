/**
 * Cross-Validation for Time Series
 * Implements time series specific cross-validation techniques
 */
const _ = require('lodash');
const metrics = require('./metrics');
const timeSeriesForecaster = require('../../timeSeriesForecaster');
const dataSplitter = require('./dataSplitter');

/**
 * Perform time series cross-validation
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Data frequency
 * @param {Object} options - Cross-validation options
 * @returns {Object} - Cross-validation results
 */
function performTimeSeriesCV(timeValues, values, frequency, options = {}) {
  // Configuration
  const minTrainSize = options.minTrainSize || Math.max(10, Math.floor(values.length * 0.3));
  const horizon = options.horizon || 1;
  const numFolds = options.numFolds || 5;
  const methods = options.methods || ['naive', 'movingAverage', 'linearRegression', 'exponentialSmoothing', 'doubleExponentialSmoothing', 'seasonalNaive', 'holtWinters'];
  
  // Ensure we have enough data
  if (values.length < minTrainSize + horizon * numFolds) {
    throw new Error('Not enough data for the specified cross-validation parameters');
  }
  
  // Create folds
  const cvFolds = createTimeSeriesCVFolds(timeValues, values, minTrainSize, horizon, numFolds);
  
  // Initialize results
  const results = {
    methods: {},
    bestMethod: null,
    metrics: ['mape', 'rmse', 'mae', 'r2', 'mase', 'smape', 'bias'],
    foldResults: []
  };
  
  // Initialize method results
  for (const method of methods) {
    results.methods[method] = {
      name: method,
      averageMetrics: {},
      foldMetrics: []
    };
    
    for (const metricName of results.metrics) {
      results.methods[method].averageMetrics[metricName] = null;
    }
  }
  
  // Perform cross-validation for each fold
  for (let foldIndex = 0; foldIndex < cvFolds.length; foldIndex++) {
    const fold = cvFolds[foldIndex];
    const foldResult = {
      fold: foldIndex + 1,
      methodResults: {}
    };
    
    // For each method
    for (const method of methods) {
      // Generate forecast using current method
      try {
        const forecastResult = timeSeriesForecaster.generateForecasts(
          fold.trainTimeValues,
          fold.trainValues,
          frequency,
          {
            method: method,
            horizon: fold.testValues.length
          }
        );
        
        // Extract forecast values
        const forecastValues = forecastResult.methods[method].values;
        
        // Calculate metrics
        const foldMetrics = {
          mape: metrics.calculateMAPE(fold.testValues, forecastValues),
          rmse: metrics.calculateRMSE(fold.testValues, forecastValues),
          mae: metrics.calculateMAE(fold.testValues, forecastValues),
          r2: metrics.calculateR2(fold.testValues, forecastValues),
          mase: metrics.calculateMASE(fold.testValues, forecastValues),
          smape: metrics.calculateSMAPE(fold.testValues, forecastValues),
          bias: metrics.calculateBias(fold.testValues, forecastValues)
        };
        
        // Add to fold results
        foldResult.methodResults[method] = {
          metrics: foldMetrics,
          forecasts: forecastValues
        };
        
        // Add to method results
        results.methods[method].foldMetrics.push(foldMetrics);
      } catch (error) {
        // Handle errors in forecasting
        foldResult.methodResults[method] = {
          error: error.message,
          forecasts: []
        };
      }
    }
    
    // Add fold result
    results.foldResults.push(foldResult);
  }
  
  // Calculate average metrics for each method
  for (const method of methods) {
    const methodResult = results.methods[method];
    
    // Skip if no valid fold metrics
    if (methodResult.foldMetrics.length === 0) continue;
    
    // Calculate average for each metric
    for (const metricName of results.metrics) {
      const validMetrics = methodResult.foldMetrics
        .map(fm => fm[metricName])
        .filter(val => val !== null && !isNaN(val));
      
      if (validMetrics.length > 0) {
        methodResult.averageMetrics[metricName] = _.mean(validMetrics);
      }
    }
  }
  
  // Determine best method based on MAPE (or RMSE if MAPE not available)
  const methodsWithValidMetrics = methods.filter(method => 
    results.methods[method].averageMetrics.mape !== null || 
    results.methods[method].averageMetrics.rmse !== null
  );
  
  if (methodsWithValidMetrics.length > 0) {
    // Try to use MAPE first
    let bestMethod = _.minBy(
      methodsWithValidMetrics, 
      method => results.methods[method].averageMetrics.mape !== null ? 
        results.methods[method].averageMetrics.mape : Infinity
    );
    
    // If no valid MAPE, use RMSE
    if (results.methods[bestMethod].averageMetrics.mape === null) {
      bestMethod = _.minBy(
        methodsWithValidMetrics, 
        method => results.methods[method].averageMetrics.rmse !== null ? 
          results.methods[method].averageMetrics.rmse : Infinity
      );
    }
    
    results.bestMethod = bestMethod;
  }
  
  return results;
}

/**
 * Create folds for time series cross-validation
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {number} minTrainSize - Minimum training set size
 * @param {number} horizon - Forecast horizon
 * @param {number} numFolds - Number of folds
 * @returns {Array} - Array of fold objects
 */
function createTimeSeriesCVFolds(timeValues, values, minTrainSize, horizon, numFolds) {
  const folds = [];
  const n = values.length;
  
  // Calculate total test size
  const totalTestSize = horizon * numFolds;
  
  // Ensure we have enough data
  if (n < minTrainSize + totalTestSize) {
    throw new Error('Not enough data for the specified parameters');
  }
  
  // Starting index for the first test set
  const firstTestIndex = n - totalTestSize;
  
  // Create folds
  for (let i = 0; i < numFolds; i++) {
    const testStartIndex = firstTestIndex + i * horizon;
    const testEndIndex = testStartIndex + horizon;
    
    // Create fold
    folds.push({
      trainTimeValues: timeValues.slice(0, testStartIndex),
      trainValues: values.slice(0, testStartIndex),
      testTimeValues: timeValues.slice(testStartIndex, testEndIndex),
      testValues: values.slice(testStartIndex, testEndIndex)
    });
  }
  
  return folds;
}

/**
 * Perform nested cross-validation for hyperparameter tuning
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Data frequency
 * @param {Object} options - Cross-validation options
 * @returns {Object} - Cross-validation results with optimal hyperparameters
 */
function performNestedCV(timeValues, values, frequency, options = {}) {
  // This is a more advanced implementation that would do hyperparameter tuning
  // For now, we'll just call the regular CV
  return performTimeSeriesCV(timeValues, values, frequency, options);
}

module.exports = {
  performTimeSeriesCV,
  createTimeSeriesCVFolds,
  performNestedCV
};
