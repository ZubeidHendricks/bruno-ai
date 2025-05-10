/**
 * Statistical Feature Generation
 * Creates features based on statistical properties of time series
 */
const _ = require('lodash');
const seasonalityDetector = require('../../utils/seasonalityDetector');

/**
 * Generate statistical features for time series
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Data frequency
 * @returns {Array} - Array of statistical feature objects
 */
function generateStatisticalFeatures(values, frequency) {
  const features = [];
  const n = values.length;
  
  // Exit if not enough data
  if (n < 5) return features;
  
  // Detect seasonality
  const seasonalPeriod = seasonalityDetector.detectSeasonalPeriod(values, frequency);
  
  // Rolling statistics
  const windowSizes = [5, 10, seasonalPeriod].filter(w => w < n / 2);
  
  for (const window of windowSizes) {
    // Rolling mean
    const rollingMean = Array(n).fill(null);
    
    // Rolling standard deviation
    const rollingStd = Array(n).fill(null);
    
    // Rolling min
    const rollingMin = Array(n).fill(null);
    
    // Rolling max
    const rollingMax = Array(n).fill(null);
    
    // Calculate rolling statistics
    for (let i = window - 1; i < n; i++) {
      const windowValues = values.slice(i - window + 1, i + 1);
      rollingMean[i] = _.mean(windowValues);
      
      // Standard deviation
      const mean = rollingMean[i];
      rollingStd[i] = Math.sqrt(
        windowValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window
      );
      
      rollingMin[i] = Math.min(...windowValues);
      rollingMax[i] = Math.max(...windowValues);
    }
    
    features.push({
      name: `rolling_mean_${window}`,
      type: 'numerical',
      values: rollingMean,
      description: `Rolling mean with window size ${window}`
    });
    
    features.push({
      name: `rolling_std_${window}`,
      type: 'numerical',
      values: rollingStd,
      description: `Rolling standard deviation with window size ${window}`
    });
    
    features.push({
      name: `rolling_min_${window}`,
      type: 'numerical',
      values: rollingMin,
      description: `Rolling minimum with window size ${window}`
    });
    
    features.push({
      name: `rolling_max_${window}`,
      type: 'numerical',
      values: rollingMax,
      description: `Rolling maximum with window size ${window}`
    });
  }
  
  // Seasonal features
  if (seasonalPeriod > 1 && seasonalPeriod * 2 <= n) {
    // Previous season value
    const seasonalLag = Array(n).fill(null);
    
    for (let i = seasonalPeriod; i < n; i++) {
      seasonalLag[i] = values[i - seasonalPeriod];
    }
    
    features.push({
      name: `seasonal_lag_${seasonalPeriod}`,
      type: 'numerical',
      values: seasonalLag,
      description: `Value from same period in previous season (period: ${seasonalPeriod})`
    });
    
    // Seasonal difference
    const seasonalDiff = Array(n).fill(null);
    
    for (let i = seasonalPeriod; i < n; i++) {
      seasonalDiff[i] = values[i] - values[i - seasonalPeriod];
    }
    
    features.push({
      name: `seasonal_diff_${seasonalPeriod}`,
      type: 'numerical',
      values: seasonalDiff,
      description: `Difference from same period in previous season (period: ${seasonalPeriod})`
    });
    
    // Seasonal percentage change
    const seasonalPct = Array(n).fill(null);
    
    for (let i = seasonalPeriod; i < n; i++) {
      if (values[i - seasonalPeriod] !== 0) {
        seasonalPct[i] = (values[i] - values[i - seasonalPeriod]) / Math.abs(values[i - seasonalPeriod]);
      } else {
        seasonalPct[i] = 0;
      }
    }
    
    features.push({
      name: `seasonal_pct_change_${seasonalPeriod}`,
      type: 'numerical',
      values: seasonalPct,
      description: `Percentage change from same period in previous season (period: ${seasonalPeriod})`
    });
  }
  
  // Add expanding window statistics (cumulative)
  const expandingMean = Array(n).fill(null);
  const expandingStd = Array(n).fill(null);
  
  for (let i = 0; i < n; i++) {
    const windowValues = values.slice(0, i + 1);
    expandingMean[i] = _.mean(windowValues);
    
    if (i > 0) {
      const mean = expandingMean[i];
      expandingStd[i] = Math.sqrt(
        windowValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (i + 1)
      );
    }
  }
  
  features.push({
    name: 'expanding_mean',
    type: 'numerical',
    values: expandingMean,
    description: 'Expanding window mean (cumulative mean)'
  });
  
  features.push({
    name: 'expanding_std',
    type: 'numerical',
    values: expandingStd,
    description: 'Expanding window standard deviation (cumulative std)'
  });
  
  return features;
}

module.exports = {
  generateStatisticalFeatures
};
