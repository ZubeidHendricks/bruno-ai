/**
 * Utility function to retry operations with exponential backoff
 * @param {Function} operation - Function to retry
 * @param {Number} maxRetries - Maximum number of retries
 * @param {Number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Result of the operation
 */
exports.retry = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
      lastError = error;
      
      // Skip delay on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
};

/**
 * Converts a generic function to return a promise that resolves after a delay
 * @param {Function} fn - Function to wrap
 * @param {Number} delay - Delay in milliseconds
 * @returns {Function} - Function that returns a delayed promise
 */
exports.withDelay = (fn, delay = 1000) => {
  return (...args) => new Promise((resolve) => {
    setTimeout(() => {
      resolve(fn(...args));
    }, delay);
  });
};

/**
 * Batch processing helper - processes items in batches with concurrency control
 * @param {Array} items - Items to process
 * @param {Function} processFn - Function to process each item
 * @param {Object} options - Options (batchSize, concurrency, delay)
 * @returns {Promise<Array>} - Results from processing
 */
exports.batchProcess = async (items, processFn, options = {}) => {
  const {
    batchSize = 10,
    concurrency = 3,
    delayBetweenBatches = 1000
  } = options;
  
  const results = [];
  
  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process each batch with concurrency
    const batchPromises = [];
    for (let j = 0; j < batch.length; j += concurrency) {
      const concurrentBatch = batch.slice(j, j + concurrency);
      
      const concurrentPromises = concurrentBatch.map(item => {
        try {
          return Promise.resolve(processFn(item));
        } catch (error) {
          console.error('Error processing item:', error);
          return Promise.resolve(null);
        }
      });
      
      const batchResults = await Promise.all(concurrentPromises);
      results.push(...batchResults);
      
      // Small delay between concurrent batches
      if (j + concurrency < batch.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Delay between batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  return results.filter(result => result !== null);
};