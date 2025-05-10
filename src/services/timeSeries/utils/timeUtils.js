/**
 * Time Utilities for Time Series Analysis
 */
const moment = require('moment');

/**
 * Get default forecast horizon based on data frequency
 * @param {string} frequency - Detected data frequency
 * @returns {number} - Default forecast horizon
 */
function getDefaultHorizon(frequency) {
  switch (frequency) {
    case 'daily':
      return 7; // One week ahead
    case 'weekly':
      return 4; // One month ahead
    case 'monthly':
      return 6; // Six months ahead
    case 'quarterly':
      return 4; // One year ahead
    case 'yearly':
      return 3; // Three years ahead
    default:
      return 5; // Default
  }
}

/**
 * Get average time difference between time points
 * @param {Array} timeValues - Array of time values
 * @returns {number} - Average difference in days
 */
function getAverageTimeDiff(timeValues) {
  if (timeValues.length < 2) return 1;
  
  let totalDiff = 0;
  const momentDates = timeValues.map(t => moment(t));
  
  for (let i = 1; i < momentDates.length; i++) {
    totalDiff += momentDates[i].diff(momentDates[i-1], 'days');
  }
  
  return Math.max(1, Math.round(totalDiff / (momentDates.length - 1)));
}

/**
 * Generate future time points based on frequency
 * @param {string} lastTimePoint - Last observed time point
 * @param {string} frequency - Data frequency
 * @param {number} horizon - Forecast horizon
 * @param {Array} timeValues - Original time values (for irregular data)
 * @returns {Array} - Array of future time points
 */
function generateFutureTimePoints(lastTimePoint, frequency, horizon, timeValues = []) {
  const futureTimes = [];
  const lastTime = moment(lastTimePoint);
  
  for (let i = 1; i <= horizon; i++) {
    switch (frequency) {
      case 'daily':
        futureTimes.push(moment(lastTime).add(i, 'days').format('YYYY-MM-DD'));
        break;
      case 'weekly':
        futureTimes.push(moment(lastTime).add(i, 'weeks').format('YYYY-MM-DD'));
        break;
      case 'monthly':
        futureTimes.push(moment(lastTime).add(i, 'months').format('YYYY-MM-DD'));
        break;
      case 'quarterly':
        futureTimes.push(moment(lastTime).add(i * 3, 'months').format('YYYY-MM-DD'));
        break;
      case 'yearly':
        futureTimes.push(moment(lastTime).add(i, 'years').format('YYYY-MM-DD'));
        break;
      default:
        // For irregular data, assume the average gap between points
        const avgGap = getAverageTimeDiff(timeValues);
        futureTimes.push(moment(lastTime).add(i * avgGap, 'days').format('YYYY-MM-DD'));
    }
  }
  
  return futureTimes;
}

module.exports = {
  getDefaultHorizon,
  getAverageTimeDiff,
  generateFutureTimePoints
};
