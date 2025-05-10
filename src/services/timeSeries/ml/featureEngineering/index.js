/**
 * Feature Engineering for Time Series
 * Generates features that help improve forecasting accuracy
 */
const timeFeatures = require('./timeFeatures');
const lagFeatures = require('./lagFeatures');
const statisticalFeatures = require('./statisticalFeatures');
const transformFeatures = require('./transformFeatures');
const externalFeatures = require('./externalFeatures');

/**
 * Generate all features for time series data
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Detected data frequency
 * @param {Object} options - Feature engineering options
 * @returns {Array} - Generated features
 */
async function generateFeatures(timeValues, values, frequency, options = {}) {
  // Combine all features
  const features = [
    ...timeFeatures.extractTimeFeatures(timeValues, frequency),
    ...lagFeatures.generateLagFeatures(values, options.maxLag),
    ...statisticalFeatures.generateStatisticalFeatures(values, frequency),
    ...transformFeatures.generateTransformFeatures(values)
  ];

  // Add external features if requested
  if (options.includeExternalFeatures && options.externalFeatureConfig) {
    const externalFeats = await externalFeatures.fetchExternalFeatures(
      timeValues, 
      frequency, 
      options.externalFeatureConfig
    );
    features.push(...externalFeats);
  }

  return features;
}

module.exports = {
  generateFeatures,
  timeFeatures,
  lagFeatures,
  statisticalFeatures,
  transformFeatures,
  externalFeatures
};
