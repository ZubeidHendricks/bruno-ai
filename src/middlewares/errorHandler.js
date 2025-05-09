const multer = require('multer');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum size limit of 10MB'
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred'
    : err.message;
  
  res.status(statusCode).json({
    error: errorMessage,
    requestId: req.id // Assuming request ID middleware is used
  });
};

module.exports = errorHandler;
