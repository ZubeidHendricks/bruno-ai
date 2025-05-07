/**
 * Time utilities for Bruno AI financial platform
 * Provides formatting, parsing, and calculation functions for time-related operations
 */

const moment = require('moment');

/**
 * Format a date/time value with specified format
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} - Formatted date string
 */
exports.formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  return moment(date).format(format);
};

/**
 * Format a date for display in the UI with relative time
 * @param {Date|string|number} date - Date to format
 * @param {boolean} includeTime - Whether to include time in the result
 * @returns {string} - Formatted date string (e.g., "Today at 10:30 AM" or "Yesterday")
 */
exports.formatDateForDisplay = (date, includeTime = true) => {
  if (!date) return '';
  
  const momentDate = moment(date);
  const now = moment();
  
  if (momentDate.isSame(now, 'day')) {
    return includeTime ? `Today at ${momentDate.format('h:mm A')}` : 'Today';
  } else if (momentDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return includeTime ? `Yesterday at ${momentDate.format('h:mm A')}` : 'Yesterday';
  } else if (momentDate.isAfter(now.clone().subtract(7, 'days'))) {
    return includeTime ? 
      `${momentDate.format('dddd')} at ${momentDate.format('h:mm A')}` : 
      momentDate.format('dddd');
  } else if (momentDate.isSame(now, 'year')) {
    return momentDate.format(includeTime ? 'MMM D [at] h:mm A' : 'MMM D');
  } else {
    return momentDate.format(includeTime ? 'MMM D, YYYY [at] h:mm A' : 'MMM D, YYYY');
  }
};

/**
 * Calculate time elapsed since a given date
 * @param {Date|string|number} date - Start date
 * @returns {string} - Human-readable elapsed time (e.g., "5 minutes ago", "2 hours ago")
 */
exports.timeAgo = (date) => {
  if (!date) return '';
  return moment(date).fromNow();
};

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} durationMs - Duration in milliseconds
 * @param {boolean} precise - Whether to include milliseconds
 * @returns {string} - Formatted duration string (e.g. "2min 30s" or "1h 5min 10s")
 */
exports.formatDuration = (durationMs, precise = false) => {
  if (typeof durationMs !== 'number' || isNaN(durationMs)) {
    return '';
  }
  
  const MS_PER_SECOND = 1000;
  const MS_PER_MINUTE = MS_PER_SECOND * 60;
  const MS_PER_HOUR = MS_PER_MINUTE * 60;
  
  const hours = Math.floor(durationMs / MS_PER_HOUR);
  const minutes = Math.floor((durationMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((durationMs % MS_PER_MINUTE) / MS_PER_SECOND);
  const milliseconds = durationMs % MS_PER_SECOND;
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}min `;
  }
  
  if (precise) {
    if (seconds > 0 || minutes > 0 || hours > 0) {
      result += `${seconds}.${String(milliseconds).padStart(3, '0')}s`;
    } else {
      result += `${milliseconds}ms`;
    }
  } else {
    result += `${seconds}s`;
  }
  
  return result.trim();
};

/**
 * Parse a date string with flexible formatting
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
exports.parseDate = (dateString) => {
  if (!dateString) return null;
  
  const parsedDate = moment(dateString);
  if (parsedDate.isValid()) {
    return parsedDate.toDate();
  }
  
  // Try to parse various date formats
  const formats = [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY/MM/DD',
    'MMMM D, YYYY',
    'D MMMM YYYY',
    'MMM D, YYYY',
    'D MMM YYYY'
  ];
  
  for (const format of formats) {
    const attemptParse = moment(dateString, format, true);
    if (attemptParse