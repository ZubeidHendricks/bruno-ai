/**
 * Lag Feature Generation
 * Creates features based on lagged values of time series
 */
const _ = require('lodash');

/**
 * Generate lag features for time series
 * @param {Array} values - Array of numeric values
 * @param {number} maxLag - Maximum lag to generate (default 7)
 * @returns {Array} - Array of lag feature objects
 */
function generateLagFeatures(values, maxLag = 7) {
  const features = [];
  const n = values.length;
  
  // Limit max lag to reasonable value based on data size
  const actualMaxLag = Math.min(maxLag, Math.floor(n / 3));
  
  // Generate lag features
  for (let lag = 1; lag <= actualMaxLag; lag++) {
    const lagValues = Array(n).fill(null);
    
    // Fill lag values
    for (let i = lag; i < n; i++) {
      lagValues[i] = values[i - lag];
    }
    
    features.push({
      name: `lag_${lag}`,
      type: 'numerical',
      values: lagValues,
      description: `Value lagged by ${lag} periods`
    });
  }
  
  // Generate moving average features
  const windowSizes = [3, 5, 7].filter(w => w <= actualMaxLag);
  
  for (const window of windowSizes) {
    const maValues = Array(n).fill(null);
    
    // Calculate moving averages
    for (let i = window - 1; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < window; j++) {
        sum += values[i - j];
      }
      maValues[i] = sum / window;
    }
    
    features.push({
      name: `ma_${window}`,
      type: 'numerical',
      values: maValues,
      description: `Moving average with window size ${window}`
    });
  }
  
  // Generate diff features (period-over-period change)
  for (const lag of [1, 7, 30].filter(l => l <= actualMaxLag)) {
    const diffValues = Array(n).fill(null);
    
    for (let i = lag; i < n; i++) {
      diffValues[i] = values[i] - values[i - lag];
    }
    
    features.push({
      name: `diff_${lag}`,
      type: 'numerical',
      values: diffValues,
      description: `Difference from value ${lag} periods ago`
    });
    
    // Percentage change
    const pctValues = Array(n).fill(null);
    
    for (let i = lag; i < n; i++) {
      if (values[i - lag] !== 0) {
        pctValues[i] = (values[i] - values[i - lag]) / Math.abs(values[i - lag]);
      } else {
        pctValues[i] = 0;
      }
    }
    
    features.push({
      name: `pct_change_${lag}`,
      type: 'numerical',
      values: pctValues,
      description: `Percentage change from value ${lag} periods ago`
    });
  }
  
  return features;
}

module.exports = {
  generateLagFeatures
};
