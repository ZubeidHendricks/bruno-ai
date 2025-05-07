/**
 * Timeline tracking utility for Bruno AI
 * Provides wrapper functions to automatically track data processing steps
 */
const { v4: uuidv4 } = require('uuid');
const timelineService = require('../services/timelineService');
const logger = require('./logger');

// Current active sessions map (userId -> sessionId)
const activeSessions = new Map();

/**
 * Get or create a timeline session for a user
 * @param {string} userId - User ID
 * @returns {string} - Session ID
 */
const getOrCreateSession = (userId) => {
  if (!activeSessions.has(userId)) {
    const sessionId = timelineService.createTimelineSession(userId);
    activeSessions.set(userId, sessionId);
    return sessionId;
  }
  return activeSessions.get(userId);
};

/**
 * Reset the active session for a user
 * @param {string} userId - User ID
 * @returns {string} - New session ID
 */
exports.resetSession = (userId) => {
  const sessionId = timelineService.createTimelineSession(userId);
  activeSessions.set(userId, sessionId);
  logger.info('Reset timeline session', { userId, sessionId });
  return sessionId;
};

/**
 * Track a timeline step
 * @param {Object} params - Step parameters
 * @param {string} params.userId - User ID
 * @param {string} params.stepKey - Step key from timelineService.TIMELINE_STEPS
 * @param {string} params.datasetId - Optional dataset ID
 * @param {string} params.transformationId - Optional transformation ID
 * @param {Object} params.details - Optional details about the step
 * @param {Object} params.metadata - Optional additional metadata
 * @returns {Promise<Object>} - Created timeline event
 */
exports.trackStep = async (params) => {
  const { 
    userId, 
    stepKey, 
    datasetId = null, 
    transformationId = null, 
    details = null, 
    metadata = null 
  } = params;

  if (!userId || !stepKey) {
    logger.warn('Missing required parameters for timeline tracking');
    return null;
  }

  try {
    const sessionId = getOrCreateSession(userId);
    
    const event = await timelineService.logTimelineStep({
      userId,
      sessionId,
      stepKey,
      datasetId,
      transformationId,
      details,
      metadata
    });
    
    return event;
  } catch (error) {
    logger.error('Error tracking timeline step:', { error, stepKey });
    // Non-critical error - don't throw, just return null
    return null;
  }
};

/**
 * Track an asynchronous timeline step (with start and complete events)
 * @param {Object} params - Step parameters (same as trackStep)
 * @param {Function} operation - Async operation to execute between start and complete
 * @returns {Promise<any>} - Result of the operation
 */
exports.trackAsyncStep = async (params, operation) => {
  const { 
    userId, 
    stepKey, 
    datasetId = null, 
    transformationId = null, 
    details = null, 
    metadata = null 
  } = params;

  if (!userId || !stepKey) {
    logger.warn('Missing required parameters for async timeline tracking');
    return operation();
  }

  try {
    const sessionId = getOrCreateSession(userId);
    
    // Start the timeline step
    const event = await timelineService.startTimelineStep({
      userId,
      sessionId,
      stepKey,
      datasetId,
      transformationId,
      details,
      metadata
    });
    
    try {
      // Execute the operation
      const result = await operation();
      
      // Complete the timeline step
      await timelineService.completeTimelineStep({
        eventId: event.id,
        status: 'completed',
        details: {
          ...(details || {}),
          result: typeof result === 'object' ? 'Operation completed successfully' : result
        }
      });
      
      return result;
    } catch (operationError) {
      // Mark the timeline step as failed
      await timelineService.completeTimelineStep({
        eventId: event.id,
        status: 'failed',
        details: {
          ...(details || {}),
          error: operationError.message
        }
      });
      
      // Re-throw the error
      throw operationError;
    }
  } catch (trackingError) {
    logger.error('Error in async timeline tracking:', { error: trackingError, stepKey });
    // If tracking fails, still try to execute the operation
    return operation();
  }
};

/**
 * Decorator function to automatically track an async method
 * @param {string} stepKey - Step key from timelineService.TIMELINE_STEPS
 * @returns {Function} - Decorator function
 */
exports.trackMethod = (stepKey) => {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      // Assume first argument might be userId or context object with userId
      const userId = typeof args[0] === 'string' 
        ? args[0] 
        : (args[0]?.userId || (this.userId ? this.userId : null));
      
      if (!userId) {
        return originalMethod.apply(this, args);
      }
      
      return exports.trackAsyncStep(
        { userId, stepKey },
        () => originalMethod.apply(this, args)
      );
    };
    
    return descriptor;
  };
};

/**
 * Track a complete data processing session
 * This is a specialized method to track a full session with all 8 steps
 * @param {Object} params - Session parameters
 * @param {string} params.userId - User ID
 * @param {string} params.datasetId - Dataset ID
 * @param {Object} params.data - Data being processed
 * @param {Object} params.operations - Operations to perform
 * @returns {Promise<Object>} - Processing result
 */
exports.trackFullProcessingSession = async (params) => {
  const { userId, datasetId, data, operations } = params;
  
  if (!userId || !datasetId || !data || !operations) {
    throw new Error('Missing required parameters for full processing session tracking');
  }
  
  // Create a new session
  const sessionId = exports.resetSession(userId);
  
  try {
    // 1. Data Ingestion
    const dataDetails = {
      filename: data.filename || 'unknown',
      size: data.size || 0,
      rowCount: data.rowCount || 0,
      columnCount: Object.keys(data[0] || {}).length
    };
    
    await timelineService.logTimelineStep({
      userId,
      sessionId,
      stepKey: 'DATA_INGESTION',
      datasetId,
      details: dataDetails
    });
    
    // 2. Natural Language Processing
    let nlpResult = null;
    if (operations.nlpProcessing) {
      nlpResult = await exports.trackAsyncStep(
        {
          userId,
          sessionId,
          stepKey: 'NLP_PROCESSING',
          datasetId
        },
        operations.nlpProcessing
      );
    }
    
    // 3. Data Transformation
    let transformedData = null;
    if (operations.dataTransformation) {
      transformedData = await exports.trackAsyncStep(
        {
          userId,
          sessionId,
          stepKey: 'DATA_TRANSFORMATION',
          datasetId,
          details: {
            operation: nlpResult?.operation || 'transform',
            parameters: nlpResult?.parameters || {}
          }
        },
        operations.dataTransformation
      );
    }
    
    // 4. Data Validation
    if (operations.dataValidation) {
      await exports.trackAsyncStep(
        {
          userId,
          sessionId,
          stepKey: 'DATA_VALIDATION',
          datasetId
        },
        operations.dataValidation
      );
    }
    
    // 5. Vector Embedding
    let vectorResult = null;
    if (operations.vectorEmbedding) {
      vectorResult = await exports.trackAsyncStep(
        {
          userId,
          sessionId,
          stepKey: 'VECTOR_EMBEDDING',
          datasetId
        },
        operations.vectorEmbedding
      );
    }
    
    // 6. Pattern Analysis
    let patterns = null;
    if (operations.patternAnalysis) {
      patterns = await exports.trackAsyncStep(
        {
          userId,
          sessionId,
          stepKey: 'PATTERN_ANALYSIS',
          datasetId
        },
        operations.patternAnalysis
      );
    }
    
    // 7. Insight Generation
    let insights = null;
    if (operations.insightGeneration) {
      insights = await exports.trackAsyncStep(
        {
          userId,
          sessionId,
          stepKey: 'INSIGHT_GENERATION',
          datasetId,
          details: {
            patternCount: patterns?.length || 0
          }
        },
        operations.insightGeneration
      );
    }
    
    // 8. Visualization Preparation
    let visualizationData = null;
    if (operations.visualizationPrep) {
      visualizationData = await exports.trackAsyncStep(
        {
          userId,
          sessionId,
          stepKey: 'VISUALIZATION_PREP',
          datasetId
        },
        operations.visualizationPrep
      );
    }
    
    // Return the final result
    return {
      sessionId,
      data: transformedData,
      vectorResult,
      patterns,
      insights,
      visualizationData
    };
  } catch (error) {
    logger.error('Error in full processing session:', { error, sessionId });
    throw error;
  }
};

// Export the timeline step constants for easy reference
exports.TIMELINE_STEPS = timelineService.TIMELINE_STEPS;
