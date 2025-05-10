/**
 * Transform Features
 * Creates features based on mathematical transformations of time series
 */
const _ = require('lodash');

/**
 * Generate transform features for time series
 * @param {Array} values - Array of numeric values
 * @returns {Array} - Array of transform feature objects
 */
function generateTransformFeatures(values) {
  const features = [];
  const n = values.length;
  
  // Calculate min and max for normalization
  const minValue = Math.min(...values.filter(v => v !== null && !isNaN(v)));
  const maxValue = Math.max(...values.filter(v => v !== null && !isNaN(v)));
  
  // Log transform (for positive values)
  const logValues = Array(n).fill(null);
  
  for (let i = 0; i < n; i++) {
    if (values[i] > 0) {
      logValues[i] = Math.log(values[i]);
    }
  }
  
  features.push({
    name: 'log_transform',
    type: 'numerical',
    values: logValues,
    description: 'Natural logarithm transformation (log(x))'
  });
  
  // Square root transform (for non-negative values)
  const sqrtValues = Array(n).fill(null);
  
  for (let i = 0; i < n; i++) {
    if (values[i] >= 0) {
      sqrtValues[i] = Math.sqrt(values[i]);
    }
  }
  
  features.push({
    name: 'sqrt_transform',
    type: 'numerical',
    values: sqrtValues,
    description: 'Square root transformation (sqrt(x))'
  });
  
  // Normalized values (min-max scaling)
  const normalizedValues = Array(n).fill(null);
  
  if (maxValue > minValue) {
    for (let i = 0; i < n; i++) {
      if (values[i] !== null && !isNaN(values[i])) {
        normalizedValues[i] = (values[i] - minValue) / (maxValue - minValue);
      }
    }
  }
  
  features.push({
    name: 'normalized_value',
    type: 'numerical',
    values: normalizedValues,
    description: 'Min-max normalized value (scaled to 0-1 range)'
  });
  
  // Z-score standardization
  const mean = _.mean(values.filter(v => v !== null && !isNaN(v)));
  const std = Math.sqrt(
    values.filter(v => v !== null && !isNaN(v))
      .reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 
      values.filter(v => v !== null && !isNaN(v)).length
  );
  
  const zScoreValues = Array(n).fill(null);
  
  if (std > 0) {
    for (let i = 0; i < n; i++) {
      if (values[i] !== null && !isNaN(values[i])) {
        zScoreValues[i] = (values[i] - mean) / std;
      }
    }
  }
  
  features.push({
    name: 'z_score',
    type: 'numerical',
    values: zScoreValues,
    description: 'Z-score standardization ((x - mean) / std)'
  });
  
  // Power transform
  const powers = [0.5, 2, 3];
  
  for (const power of powers) {
    const powerValues = Array(n).fill(null);
    
    for (let i = 0; i < n; i++) {
      if (values[i] !== null && !isNaN(values[i])) {
        // For negative values, we can only use odd powers
        if (values[i] < 0 && power % 1 === 0 && power % 2 === 1) {
          powerValues[i] = -Math.pow(Math.abs(values[i]), power);
        } else if (values[i] >= 0 || (power % 1 === 0 && power % 2 === 1)) {
          powerValues[i] = Math.pow(values[i], power);
        }
      }
    }
    
    features.push({
      name: `power_${power.toString().replace('.', '_')}`,
      type: 'numerical',
      values: powerValues,
      description: `Power transformation (x^${power})`
    });
  }
  
  // Box-Cox-like transform (only for positive values)
  // y = ((x^lambda) - 1) / lambda if lambda != 0, log(x) if lambda = 0
  const lambdas = [0, 0.5, 2];
  
  for (const lambda of lambdas) {
    const boxCoxValues = Array(n).fill(null);
    
    for (let i = 0; i < n; i++) {
      if (values[i] > 0) {
        if (lambda === 0) {
          boxCoxValues[i] = Math.log(values[i]);
        } else {
          boxCoxValues[i] = (Math.pow(values[i], lambda) - 1) / lambda;
        }
      }
    }
    
    features.push({
      name: `box_cox_${lambda.toString().replace('.', '_')}`,
      type: 'numerical',
      values: boxCoxValues,
      description: `Box-Cox-like transformation with lambda=${lambda}`
    });
  }
  
  return features;
}

module.exports = {
  generateTransformFeatures
};
