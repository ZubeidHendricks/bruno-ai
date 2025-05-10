/**
 * Time-based Feature Extraction
 * Extracts calendar and time-based features from timestamps
 */
const moment = require('moment');

/**
 * Extract time-based features from time values
 * @param {Array} timeValues - Array of time values
 * @param {string} frequency - Data frequency
 * @returns {Array} - Array of time feature objects
 */
function extractTimeFeatures(timeValues, frequency) {
  const features = [];
  
  // Create moment objects from time values
  const momentDates = timeValues.map(t => moment(t));
  
  // Basic time features for all frequencies
  features.push({
    name: 'day_of_week',
    type: 'categorical',
    values: momentDates.map(d => d.day()),
    description: 'Day of week (0-6, 0 is Sunday)'
  });
  
  features.push({
    name: 'day_of_month',
    type: 'numerical',
    values: momentDates.map(d => d.date()),
    description: 'Day of month (1-31)'
  });
  
  features.push({
    name: 'month',
    type: 'categorical',
    values: momentDates.map(d => d.month()),
    description: 'Month of year (0-11, 0 is January)'
  });
  
  features.push({
    name: 'quarter',
    type: 'categorical',
    values: momentDates.map(d => d.quarter()),
    description: 'Quarter of year (1-4)'
  });
  
  features.push({
    name: 'year',
    type: 'numerical',
    values: momentDates.map(d => d.year()),
    description: 'Year'
  });
  
  // Add frequency-specific features
  if (frequency === 'daily' || frequency === 'weekly') {
    features.push({
      name: 'is_weekend',
      type: 'binary',
      values: momentDates.map(d => d.day() === 0 || d.day() === 6 ? 1 : 0),
      description: 'Is weekend (1) or weekday (0)'
    });
    
    features.push({
      name: 'is_holiday',
      type: 'binary',
      values: detectHolidays(momentDates),
      description: 'Is public holiday (1) or not (0)'
    });
  }
  
  if (frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') {
    features.push({
      name: 'month_sin',
      type: 'numerical',
      values: momentDates.map(d => Math.sin(2 * Math.PI * d.month() / 12)),
      description: 'Sine transformation of month for cyclical pattern'
    });
    
    features.push({
      name: 'month_cos',
      type: 'numerical',
      values: momentDates.map(d => Math.cos(2 * Math.PI * d.month() / 12)),
      description: 'Cosine transformation of month for cyclical pattern'
    });
  }
  
  if (frequency === 'daily') {
    features.push({
      name: 'day_of_week_sin',
      type: 'numerical',
      values: momentDates.map(d => Math.sin(2 * Math.PI * d.day() / 7)),
      description: 'Sine transformation of day of week for cyclical pattern'
    });
    
    features.push({
      name: 'day_of_week_cos',
      type: 'numerical',
      values: momentDates.map(d => Math.cos(2 * Math.PI * d.day() / 7)),
      description: 'Cosine transformation of day of week for cyclical pattern'
    });
  }
  
  return features;
}

/**
 * Detect holidays in date array (simplified implementation)
 * For production use, consider using a proper holiday calendar library
 * @param {Array} momentDates - Array of moment date objects
 * @returns {Array} - Array of binary values (1 for holiday, 0 for non-holiday)
 */
function detectHolidays(momentDates) {
  // This is a simplified implementation
  // For production, use a proper holiday calendar like date-holidays
  
  return momentDates.map(date => {
    const month = date.month();
    const day = date.date();
    
    // Check for common holidays (US-centric example)
    // New Year's Day
    if (month === 0 && day === 1) return 1;
    
    // Independence Day
    if (month === 6 && day === 4) return 1;
    
    // Christmas
    if (month === 11 && day === 25) return 1;
    
    // Add more holidays as needed
    
    return 0;
  });
}

module.exports = {
  extractTimeFeatures
};
