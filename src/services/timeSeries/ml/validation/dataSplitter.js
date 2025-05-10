/**
 * Data Splitter for Time Series
 * Splits time series data while respecting temporal order
 */
const _ = require('lodash');

/**
 * Split time series data into training, validation, and test sets
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {Array} features - Array of feature objects
 * @param {Array} splitRatio - Ratio for train/validation/test split
 * @returns {Object} - Split data
 */
function splitTimeSeriesData(timeValues, values, features, splitRatio = [0.7, 0.15, 0.15]) {
  // Validate split ratio
  if (!Array.isArray(splitRatio) || splitRatio.length !== 3) {
    throw new Error('Split ratio must be an array with 3 values');
  }
  
  const sumRatio = splitRatio.reduce((a, b) => a + b, 0);
  if (Math.abs(sumRatio - 1) > 0.0001) {
    throw new Error('Split ratio must sum to 1');
  }
  
  const n = values.length;
  
  // Calculate split indices
  const trainEndIdx = Math.floor(n * splitRatio[0]);
  const valEndIdx = trainEndIdx + Math.floor(n * splitRatio[1]);
  
  // Split time values and values
  const trainTimeValues = timeValues.slice(0, trainEndIdx);
  const trainValues = values.slice(0, trainEndIdx);
  
  const validationTimeValues = timeValues.slice(trainEndIdx, valEndIdx);
  const validationValues = values.slice(trainEndIdx, valEndIdx);
  
  const testTimeValues = timeValues.slice(valEndIdx);
  const testValues = values.slice(valEndIdx);
  
  // Split features
  const trainFeatures = [];
  const validationFeatures = [];
  const testFeatures = [];
  
  for (const feature of features) {
    // Split feature values
    const trainFeatureValues = feature.values.slice(0, trainEndIdx);
    const validationFeatureValues = feature.values.slice(trainEndIdx, valEndIdx);
    const testFeatureValues = feature.values.slice(valEndIdx);
    
    // Create new feature objects for each split
    trainFeatures.push({
      ...feature,
      values: trainFeatureValues
    });
    
    validationFeatures.push({
      ...feature,
      values: validationFeatureValues
    });
    
    testFeatures.push({
      ...feature,
      values: testFeatureValues
    });
  }
  
  return {
    trainData: {
      timeValues: trainTimeValues,
      values: trainValues,
      features: trainFeatures
    },
    validationData: {
      timeValues: validationTimeValues,
      values: validationValues,
      features: validationFeatures
    },
    testData: {
      timeValues: testTimeValues,
      values: testValues,
      features: testFeatures
    }
  };
}

/**
 * Perform stratified split for time series
 * This preserves the distribution of values in each set
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {Array} features - Array of feature objects
 * @param {Array} splitRatio - Ratio for train/validation/test split
 * @returns {Object} - Split data
 */
function stratifiedSplitTimeSeriesData(timeValues, values, features, splitRatio = [0.7, 0.15, 0.15]) {
  // For time series, true stratification is challenging due to temporal dependencies
  // This is a simplified version that tries to preserve the distribution
  
  // First, create bins for the values
  const numBins = Math.min(10, Math.floor(values.length / 10));
  
  // Find min and max values
  const minValue = Math.min(...values.filter(v => v !== null && !isNaN(v)));
  const maxValue = Math.max(...values.filter(v => v !== null && !isNaN(v)));
  
  // Assign each point to a bin
  const bins = Array(numBins).fill().map(() => []);
  const binSize = (maxValue - minValue) / numBins;
  
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === null || isNaN(value)) continue;
    
    // Calculate bin index
    let binIndex = Math.floor((value - minValue) / binSize);
    if (binIndex === numBins) binIndex--; // Handle max value
    
    bins[binIndex].push(i);
  }
  
  // Now select indices from each bin according to the split ratio
  const trainIndices = [];
  const validationIndices = [];
  const testIndices = [];
  
  for (const bin of bins) {
    const trainCount = Math.floor(bin.length * splitRatio[0]);
    const valCount = Math.floor(bin.length * splitRatio[1]);
    
    // Sort bin indices to maintain temporal order
    const sortedBin = [...bin].sort((a, b) => a - b);
    
    trainIndices.push(...sortedBin.slice(0, trainCount));
    validationIndices.push(...sortedBin.slice(trainCount, trainCount + valCount));
    testIndices.push(...sortedBin.slice(trainCount + valCount));
  }
  
  // Sort indices to maintain temporal order
  trainIndices.sort((a, b) => a - b);
  validationIndices.sort((a, b) => a - b);
  testIndices.sort((a, b) => a - b);
  
  // Create the split datasets
  const trainTimeValues = trainIndices.map(i => timeValues[i]);
  const trainValues = trainIndices.map(i => values[i]);
  
  const validationTimeValues = validationIndices.map(i => timeValues[i]);
  const validationValues = validationIndices.map(i => values[i]);
  
  const testTimeValues = testIndices.map(i => timeValues[i]);
  const testValues = testIndices.map(i => values[i]);
  
  // Split features
  const trainFeatures = [];
  const validationFeatures = [];
  const testFeatures = [];
  
  for (const feature of features) {
    const trainFeatureValues = trainIndices.map(i => feature.values[i]);
    const validationFeatureValues = validationIndices.map(i => feature.values[i]);
    const testFeatureValues = testIndices.map(i => feature.values[i]);
    
    trainFeatures.push({
      ...feature,
      values: trainFeatureValues
    });
    
    validationFeatures.push({
      ...feature,
      values: validationFeatureValues
    });
    
    testFeatures.push({
      ...feature,
      values: testFeatureValues
    });
  }
  
  return {
    trainData: {
      timeValues: trainTimeValues,
      values: trainValues,
      features: trainFeatures
    },
    validationData: {
      timeValues: validationTimeValues,
      values: validationValues,
      features: validationFeatures
    },
    testData: {
      timeValues: testTimeValues,
      values: testValues,
      features: testFeatures
    }
  };
}

/**
 * Create rolling window splits for time series data
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {number} windowSize - Size of each window
 * @param {number} stride - Step size between windows
 * @returns {Array} - Array of window objects
 */
function createRollingWindows(timeValues, values, windowSize, stride = 1) {
  if (windowSize >= values.length) {
    throw new Error('Window size must be smaller than the data length');
  }
  
  const windows = [];
  
  for (let i = 0; i <= values.length - windowSize; i += stride) {
    windows.push({
      timeValues: timeValues.slice(i, i + windowSize),
      values: values.slice(i, i + windowSize),
      startIndex: i,
      endIndex: i + windowSize - 1
    });
  }
  
  return windows;
}

module.exports = {
  splitTimeSeriesData,
  stratifiedSplitTimeSeriesData,
  createRollingWindows
};
