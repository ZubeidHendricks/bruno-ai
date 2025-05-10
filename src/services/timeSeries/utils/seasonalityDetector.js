/**
 * Seasonality Detector
 * Detects seasonal patterns in time series data
 */
const _ = require('lodash');

/**
 * Detect seasonal period in time series data
 * @param {Array} values - Array of values
 * @param {string} frequency - Detected data frequency
 * @returns {number} - Detected seasonal period
 */
function detectSeasonalPeriod(values, frequency) {
  // Default periods based on frequency
  switch (frequency) {
    case 'daily':
      return 7; // Weekly seasonality
    case 'weekly':
      return 4; // Monthly seasonality
    case 'monthly':
      return 12; // Yearly seasonality
    case 'quarterly':
      return 4; // Yearly seasonality
    default:
      // Try to detect from autocorrelations
      if (values.length >= 24) {
        const maxLag = Math.min(24, Math.floor(values.length / 3));
        const autocorrelations = [];
        
        for (let lag = 1; lag <= maxLag; lag++) {
          autocorrelations.push({
            lag,
            corr: calculateAutocorrelation(values, lag)
          });
        }
        
        // Find peak autocorrelation (excluding lag 1)
        const peakAcf = _.maxBy(autocorrelations.slice(1), 'corr');
        
        if (peakAcf && peakAcf.corr > 0.3) {
          return peakAcf.lag;
        }
      }
      
      // Default to a reasonable period if detection fails
      return Math.min(7, Math.floor(values.length / 3));
  }
}

/**
 * Calculate autocorrelation at a specific lag
 * @param {Array} values - Array of values
 * @param {number} lag - Lag for autocorrelation
 * @returns {number} - Autocorrelation coefficient
 */
function calculateAutocorrelation(values, lag) {
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
}

module.exports = {
  detectSeasonalPeriod,
  calculateAutocorrelation
};
