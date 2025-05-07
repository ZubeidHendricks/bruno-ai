/**
 * Simple logger utility for consistent logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get current environment log level
const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL || 'INFO';
  return LOG_LEVELS[envLevel] || LOG_LEVELS.INFO;
};

// Format log message with timestamp and metadata
const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  
  // Add environment information
  const environment = process.env.NODE_ENV || 'development';
  
  let logObject = {
    timestamp,
    level,
    environment,
    message
  };
  
  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    logObject.meta = meta;
  }
  
  return logObject;
};

// Stringify error objects
const stringifyError = (error) => {
  if (!(error instanceof Error)) return error;
  
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error.code && { code: error.code }),
    ...(error.statusCode && { statusCode: error.statusCode })
  };
};

// Logger implementation
const logger = {
  error: (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.ERROR) {
      // Handle error objects in meta
      if (meta.error) {
        meta.error = stringifyError(meta.error);
      }
      
      console.error(JSON.stringify(formatLogMessage('ERROR', message, meta)));
    }
  },
  
  warn: (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.WARN) {
      console.warn(JSON.stringify(formatLogMessage('WARN', message, meta)));
    }
  },
  
  info: (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.INFO) {
      console.info(JSON.stringify(formatLogMessage('INFO', message, meta)));
    }
  },
  
  debug: (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.DEBUG) {
      console.debug(JSON.stringify(formatLogMessage('DEBUG', message, meta)));
    }
  },
  
  // Log API request/response for debugging
  logApiCall: (req, res, responseTime) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.DEBUG) {
      const meta = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.headers['user-agent'],
        contentLength: res.getHeader('content-length') || 0
      };
      
      logger.debug(`API ${req.method} ${req.originalUrl} completed in ${responseTime}ms with status ${res.statusCode}`, meta);
    }
  }
};

module.exports = logger;