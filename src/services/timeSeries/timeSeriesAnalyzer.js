/**
 * Time Series Analyzer
 * Analyzes time series data to detect frequency, trends, seasonality, and anomalies
 */
const _ = require('lodash');
const moment = require('moment');
const logger = require('../../utils/logger');

/**
 * Analyze time series data
 * @param {Array} data - Array of data points with time and value fields
 * @param {string} timeColumn - Name of the column containing time data
 * @param {string} valueColumn - Name of the column containing value data
 * @returns {Object} - Analysis results
 */
exports.analyzeTimeSeries = async (data, timeColumn, valueColumn) => {
  try {
    // Sort data by time
    const sortedData = _.sortBy(data, row => moment(row[timeColumn]).valueOf());
    
    // Extract time and values
    const timeValues = sortedData.map(row => row[timeColumn]);
    const values = sortedData.map(row => parseFloat(row[valueColumn])).filter(val => !isNaN(val));
    
    if (values.length < 3) {
      throw new Error('Insufficient data points for analysis. At least 3 valid points required.');
    }
    
    // Calculate metadata
    const metadata = {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      meanValue: _.mean(values),
      medianValue: calculateMedian(values),
      stdDev: calculateStdDev(values)
    };
    
    // Detect time frequency
    const frequency = detectTimeFrequency(timeValues);
    
    // Analyze trend
    const trend = analyzeTrend(values);
    
    // Analyze seasonality
    const seasonality = analyzeSeasonality(timeValues, values, frequency);
    
    // Detect anomalies
    const anomalies = detectAnomaliesStatistical(timeValues, values);
    
    // Detect change points
    const changePoints = detectChangePoints(timeValues, values);
    
    return {
      timeValues,
      values,
      frequency,
      trend,
      seasonality,
      anomalies,
      changePoints,
      metadata
    };
  } catch (error) {
    logger.error('Error in time series analysis:', { error });
    throw error;
  }
};

/**
 * Detect the frequency of time series data
 * @param {Array} timeValues - Array of time values
 * @returns {string} - Detected frequency (daily, weekly, monthly, quarterly, yearly)
 */
const detectTimeFrequency = (timeValues) => {
  if (timeValues.length < 2) return 'unknown';
  
  // Convert to moment objects and sort
  const momentDates = timeValues.map(t => moment(t)).sort((a, b) => a - b);
  
  // Calculate differences between consecutive dates in days
  const diffDays = [];
  for (let i = 1; i < momentDates.length; i++) {
    diffDays.push(momentDates[i].diff(momentDates[i-1], 'days'));
  }
  
  // Find the most common difference
  const frequencyMap = _.countBy(diffDays);
  const mostCommonDiff = parseInt(_.maxBy(Object.keys(frequencyMap), key => frequencyMap[key]));
  
  // Determine frequency based on most common difference
  if (mostCommonDiff <= 1) return 'daily';
  if (mostCommonDiff <= 3) return 'daily'; // Might be business days
  if (mostCommonDiff >= 6 && mostCommonDiff <= 8) return 'weekly';
  if (mostCommonDiff >= 28 && mostCommonDiff <= 31) return 'monthly';
  if (mostCommonDiff >= 89 && mostCommonDiff <= 92) return 'quarterly';
  if (mostCommonDiff >= 364 && mostCommonDiff <= 366) return 'yearly';
  
  return 'irregular';
};

/**
 * Analyze trend in time series data
 * @param {Array} values - Array of numeric values
 * @returns {Object} - Trend analysis
 */
exports.analyzeTrend = analyzeTrend;
function analyzeTrend(values) {
  if (values.length < 2) return { type: 'unknown', strength: 0 };
  
  // Compute linear regression
  const n = values.length;
  const x = [...Array(n).keys()]; // 0, 1, 2, ...
  
  // Calculate slope and intercept
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += values[i];
    sumXY += x[i] * values[i];
    sumXX += x[i] * x[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  
  let totalSS = 0;
  let residualSS = 0;
  
  for (let i = 0; i < n; i++) {
    totalSS += Math.pow(values[i] - yMean, 2);
    residualSS += Math.pow(values[i] - (intercept + slope * x[i]), 2);
  }
  
  const rSquared = 1 - (residualSS / totalSS);
  
  // Determine trend direction and strength
  const trendType = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
  
  return {
    type: trendType,
    slope,
    intercept,
    rSquared,
    strength: Math.abs(rSquared) // Absolute value as an indicator of trend strength
  };
}

/**
 * Analyze seasonality in time series data
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Detected data frequency
 * @returns {Object} - Seasonality analysis
 */
exports.analyzeSeasonality = analyzeSeasonality;
function analyzeSeasonality(timeValues, values, frequency) {
  // Determine appropriate seasonality period based on frequency
  let seasonalityPeriod = 0;
  
  switch (frequency) {
    case 'daily':
      seasonalityPeriod = 7; // Weekly seasonality
      break;
    case 'weekly':
      seasonalityPeriod = 4; // Monthly seasonality
      break;
    case 'monthly':
      seasonalityPeriod = 12; // Yearly seasonality
      break;
    case 'quarterly':
      seasonalityPeriod = 4; // Yearly seasonality
      break;
    default:
      seasonalityPeriod = Math.min(7, Math.floor(values.length / 3));
  }
  
  // Not enough data for seasonality detection
  if (values.length < seasonalityPeriod * 2) {
    return {
      detected: false,
      period: null,
      strength: 0,
      reason: 'Insufficient data for seasonality detection'
    };
  }
  
  // Calculate autocorrelation at seasonal lag
  const autocorrelation = calculateAutocorrelation(values, seasonalityPeriod);
  
  // Strength of seasonality (from 0 to 1)
  const seasonalStrength = Math.abs(autocorrelation);
  
  return {
    detected: seasonalStrength > 0.3, // Threshold for seasonality detection
    period: seasonalityPeriod,
    strength: seasonalStrength,
    autocorrelation,
    periodUnit: frequency === 'daily' ? 'days' : 
                frequency === 'weekly' ? 'weeks' : 
                frequency === 'monthly' ? 'months' : 'periods'
  };
}

/**
 * Calculate autocorrelation at a specific lag
 * @param {Array} values - Array of values
 * @param {number} lag - Lag for autocorrelation
 * @returns {number} - Autocorrelation coefficient
 */
const calculateAutocorrelation = (values, lag) => {
  if (values.length <= lag) return 0;
  
  const mean = _.mean(values);
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < values.length - lag; i++) {
    numerator += (values[i] - mean) * (values[i + lag] - mean);
  }
  
  for (let i = 0; i < values.length; i++) {
    denominator += Math.pow(values[i] - mean, 2);
  }
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
};

/**
 * Detect anomalies in time series using Z-score method
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {number} threshold - Z-score threshold (default: 3)
 * @returns {Array} - Detected anomalies
 */
exports.detectAnomaliesStatistical = detectAnomaliesStatistical;
function detectAnomaliesStatistical(timeValues, values, threshold = 3) {
  if (values.length < 5) return [];
  
  const mean = _.mean(values);
  const stdDev = calculateStdDev(values);
  
  const anomalies = [];
  
  for (let i = 0; i < values.length; i++) {
    const zScore = Math.abs((values[i] - mean) / stdDev);
    
    if (zScore > threshold) {
      anomalies.push({
        index: i,
        timestamp: timeValues[i],
        value: values[i],
        zScore,
        direction: values[i] > mean ? 'positive' : 'negative'
      });
    }
  }
  
  return anomalies;
}

/**
 * Detect anomalies using IQR method
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {number} multiplier - IQR multiplier (default: 1.5)
 * @returns {Array} - Detected anomalies
 */
exports.detectAnomaliesIQR = (timeValues, values, multiplier = 1.5) => {
  if (values.length < 5) return [];
  
  // Calculate quartiles
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;
  
  const anomalies = [];
  
  for (let i = 0; i < values.length; i++) {
    if (values[i] < lowerBound || values[i] > upperBound) {
      anomalies.push({
        index: i,
        timestamp: timeValues[i],
        value: values[i],
        bound: values[i] < lowerBound ? lowerBound : upperBound,
        direction: values[i] < lowerBound ? 'negative' : 'positive'
      });
    }
  }
  
  return anomalies;
};

/**
 * Detect anomalies using moving average method
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {number} window - Window size for moving average
 * @param {number} threshold - Threshold multiplier for deviation
 * @returns {Array} - Detected anomalies
 */
exports.detectAnomaliesMovingAverage = (timeValues, values, window = 5, threshold = 2) => {
  if (values.length < window * 2) return [];
  
  const anomalies = [];
  
  for (let i = window; i < values.length; i++) {
    // Calculate moving average and standard deviation
    const windowValues = values.slice(i - window, i);
    const ma = _.mean(windowValues);
    const maStdDev = calculateStdDev(windowValues);
    
    const deviation = Math.abs(values[i] - ma);
    
    if (deviation > threshold * maStdDev) {
      anomalies.push({
        index: i,
        timestamp: timeValues[i],
        value: values[i],
        movingAverage: ma,
        deviation,
        direction: values[i] > ma ? 'positive' : 'negative'
      });
    }
  }
  
  return anomalies;
};

/**
 * Detect change points in time series data
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @returns {Array} - Detected change points
 */
exports.detectChangePoints = detectChangePoints;
function detectChangePoints(timeValues, values) {
  if (values.length < 10) return [];
  
  const changePoints = [];
  const windowSize = Math.max(5, Math.floor(values.length / 10));
  
  // Simple change point detection using moving window means
  for (let i = windowSize; i < values.length - windowSize; i++) {
    const leftWindow = values.slice(i - windowSize, i);
    const rightWindow = values.slice(i, i + windowSize);
    
    const leftMean = _.mean(leftWindow);
    const rightMean = _.mean(rightWindow);
    
    // Calculate variance for both windows
    const leftVar = calculateVariance(leftWindow);
    const rightVar = calculateVariance(rightWindow);
    
    // Calculate combined variance
    const combinedVar = Math.sqrt((leftVar + rightVar) / 2);
    
    // Calculate t-statistic for mean difference
    const tStat = Math.abs(leftMean - rightMean) / (combinedVar * Math.sqrt(2 / windowSize));
    
    // Threshold for significant change
    if (tStat > 2.0) {
      changePoints.push({
        index: i,
        timestamp: timeValues[i],
        value: values[i],
        leftMean,
        rightMean,
        percentChange: ((rightMean - leftMean) / leftMean) * 100,
        tStatistic: tStat
      });
      
      // Skip ahead to avoid detecting the same change point multiple times
      i += Math.floor(windowSize / 2);
    }
  }
  
  return changePoints;
}

/**
 * Calculate median of an array of values
 * @param {Array} values - Array of numbers
 * @returns {number} - Median value
 */
function calculateMedian(values) {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
}

/**
 * Calculate standard deviation of an array of values
 * @param {Array} values - Array of numbers
 * @returns {number} - Standard deviation
 */
function calculateStdDev(values) {
  if (values.length <= 1) return 0;
  
  const mean = _.mean(values);
  const variance = calculateVariance(values, mean);
  
  return Math.sqrt(variance);
}

/**
 * Calculate variance of an array of values
 * @param {Array} values - Array of numbers
 * @param {number} mean - Mean value (optional, will calculate if not provided)
 * @returns {number} - Variance
 */
function calculateVariance(values, mean = null) {
  if (values.length <= 1) return 0;
  
  const avg = mean !== null ? mean : _.mean(values);
  
  const sumSquaredDiffs = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0);
  
  return sumSquaredDiffs / (values.length - 1); // Using n-1 for sample variance
}

/**
 * Check if a time series is stationary
 * @param {Array} values - Array of numeric values
 * @returns {Object} - Stationarity test results
 */
exports.testStationarity = (values) => {
  if (values.length < 10) {
    return { 
      isStationary: false, 
      reason: 'Insufficient data points for stationarity test'
    };
  }
  
  // Split the series into two halves
  const midpoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);
  
  // Compare mean and variance of the two halves
  const firstMean = _.mean(firstHalf);
  const secondMean = _.mean(secondHalf);
  
  const firstVar = calculateVariance(firstHalf);
  const secondVar = calculateVariance(secondHalf);
  
  // Calculate percentage changes
  const meanChange = Math.abs((secondMean - firstMean) / firstMean) * 100;
  const varChange = Math.abs((secondVar - firstVar) / firstVar) * 100;
  
  // Thresholds for non-stationarity
  const meanThreshold = 10; // 10% change in mean
  const varThreshold = 30;  // 30% change in variance
  
  const isStationary = meanChange < meanThreshold && varChange < varThreshold;
  
  return {
    isStationary,
    meanChange,
    varChange,
    firstMean,
    secondMean,
    firstVar,
    secondVar,
    reason: isStationary ? 'Series appears stationary' : 
            meanChange >= meanThreshold ? 'Non-stationary due to changing mean' :
            'Non-stationary due to changing variance'
  };
};
