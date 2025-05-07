const { v4: uuidv4 } = require('uuid');
const { TimelineEvent, sequelize, User, FinancialDataset, DataTransformation } = require('../database/models');
const logger = require('../utils/logger');
const timeUtil = require('../utils/timeUtil');

/**
 * Timeline event types/steps that match the frontend timeline
 */
const TIMELINE_STEPS = {
  DATA_INGESTION: { step: 1, title: 'Data Ingestion', description: 'Upload and initial parsing of raw financial data' },
  NLP_PROCESSING: { step: 2, title: 'Natural Language Processing', description: 'Interpretation of user commands in everyday language' },
  DATA_TRANSFORMATION: { step: 3, title: 'Data Transformation', description: 'Execution of the interpreted commands on the dataset' },
  DATA_VALIDATION: { step: 4, title: 'Data Validation', description: 'Ensure data quality after transformation' },
  VECTOR_EMBEDDING: { step: 5, title: 'Vector Embedding', description: 'Semantic representation of financial data' },
  PATTERN_ANALYSIS: { step: 6, title: 'Pattern Analysis', description: 'Detecting financial patterns and anomalies' },
  INSIGHT_GENERATION: { step: 7, title: 'Insight Generation', description: 'AI-powered insights from the processed data' },
  VISUALIZATION_PREP: { step: 8, title: 'Visualization Preparation', description: 'Formatting data for interactive visualizations' }
};

/**
 * Create a new timeline session for tracking a data preparation process
 * @param {string} userId - User ID
 * @param {string} datasetId - Optional dataset ID
 * @returns {string} - Session ID for tracking the timeline events
 */
exports.createTimelineSession = (userId) => {
  // Generate a unique session ID
  return uuidv4();
};

/**
 * Start tracking a timeline step
 * @param {Object} params - Event parameters
 * @param {string} params.userId - User ID
 * @param {string} params.sessionId - Session ID
 * @param {string} params.stepKey - Step key from TIMELINE_STEPS
 * @param {string} params.datasetId - Optional dataset ID
 * @param {string} params.transformationId - Optional transformation ID
 * @param {Object} params.details - Optional details about the step
 * @param {Object} params.metadata - Optional additional metadata
 * @returns {Promise<Object>} - Created timeline event
 */
exports.startTimelineStep = async (params) => {
  try {
    const { 
      userId, 
      sessionId, 
      stepKey, 
      datasetId = null, 
      transformationId = null, 
      details = null, 
      metadata = null 
    } = params;

    if (!userId || !sessionId || !stepKey) {
      throw new Error('Missing required parameters for timeline tracking');
    }

    if (!TIMELINE_STEPS[stepKey]) {
      throw new Error(`Invalid step key: ${stepKey}`);
    }

    const step = TIMELINE_STEPS[stepKey];

    // Create a new timeline event
    const event = await TimelineEvent.create({
      userId,
      datasetId,
      transformationId,
      sessionId,
      step: step.step,
      title: step.title,
      description: step.description,
      details,
      status: 'in_progress',
      startTime: new Date(),
      metadata
    });

    logger.info(`Started timeline step: ${step.title}`, { 
      userId, 
      sessionId, 
      step: step.step 
    });

    return event;
  } catch (error) {
    logger.error('Error starting timeline step:', { error });
    throw error;
  }
};

/**
 * Complete a timeline step
 * @param {Object} params - Event parameters
 * @param {string} params.eventId - Event ID from startTimelineStep
 * @param {Object} params.details - Updated details about the step
 * @param {string} params.status - Status (completed, failed)
 * @param {Object} params.metadata - Updated additional metadata
 * @returns {Promise<Object>} - Updated timeline event
 */
exports.completeTimelineStep = async (params) => {
  try {
    const { 
      eventId, 
      details = null, 
      status = 'completed', 
      metadata = null 
    } = params;

    if (!eventId) {
      throw new Error('Missing event ID for timeline tracking');
    }

    // Find the event
    const event = await TimelineEvent.findByPk(eventId);

    if (!event) {
      throw new Error(`Timeline event not found: ${eventId}`);
    }

    // Calculate duration
    const endTime = new Date();
    const duration = endTime - new Date(event.startTime);

    // Update the event
    const updatedEvent = await event.update({
      status,
      endTime,
      duration,
      details: details || event.details,
      metadata: metadata ? { ...event.metadata, ...metadata } : event.metadata
    });

    logger.info(`Completed timeline step: ${event.title}`, { 
      userId: event.userId, 
      sessionId: event.sessionId, 
      step: event.step,
      duration: timeUtil.formatDuration(duration),
      status
    });

    return updatedEvent;
  } catch (error) {
    logger.error('Error completing timeline step:', { error });
    throw error;
  }
};

/**
 * Log a complete timeline step in one function call
 * @param {Object} params - All parameters from startTimelineStep plus duration
 * @returns {Promise<Object>} - Created timeline event
 */
exports.logTimelineStep = async (params) => {
  try {
    const { 
      userId, 
      sessionId, 
      stepKey, 
      datasetId = null, 
      transformationId = null, 
      details = null, 
      metadata = null,
      duration = null,
      status = 'completed'
    } = params;

    if (!userId || !sessionId || !stepKey) {
      throw new Error('Missing required parameters for timeline tracking');
    }

    if (!TIMELINE_STEPS[stepKey]) {
      throw new Error(`Invalid step key: ${stepKey}`);
    }

    const step = TIMELINE_STEPS[stepKey];
    
    const startTime = new Date();
    let endTime = null;
    
    if (duration) {
      // If duration is provided, calculate the end time by adding duration to start time
      endTime = new Date(startTime.getTime() + duration);
    } else {
      // Otherwise, set end time to the same as start time
      endTime = new Date(startTime);
    }

    // Create a complete timeline event
    const event = await TimelineEvent.create({
      userId,
      datasetId,
      transformationId,
      sessionId,
      step: step.step,
      title: step.title,
      description: step.description,
      details,
      status,
      duration: duration || 0,
      startTime,
      endTime,
      metadata
    });

    logger.info(`Logged timeline step: ${step.title}`, { 
      userId, 
      sessionId, 
      step: step.step,
      duration: timeUtil.formatDuration(duration || 0),
      status
    });

    return event;
  } catch (error) {
    logger.error('Error logging timeline step:', { error });
    throw error;
  }
};

/**
 * Get all timeline events for a specific session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} - Timeline events
 */
exports.getSessionTimeline = async (sessionId) => {
  try {
    const events = await TimelineEvent.findAll({
      where: { sessionId },
      order: [['step', 'ASC'], ['startTime', 'ASC']],
      include: [
        {
          model: FinancialDataset,
          as: 'dataset',
          attributes: ['id', 'name', 'description']
        },
        {
          model: DataTransformation,
          as: 'transformation',
          attributes: ['id', 'name', 'operation']
        }
      ]
    });

    return events;
  } catch (error) {
    logger.error('Error retrieving session timeline:', { error, sessionId });
    throw error;
  }
};

/**
 * Get all timeline sessions for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, offset)
 * @returns {Promise<Array>} - Timeline sessions with summary information
 */
exports.getUserTimelineSessions = async (userId, options = {}) => {
  const { limit = 10, offset = 0 } = options;
  
  try {
    // Find all distinct session IDs for the user
    const sessions = await TimelineEvent.findAll({
      attributes: [
        'sessionId', 
        [sequelize.fn('MIN', sequelize.col('startTime')), 'startTime'],
        [sequelize.fn('MAX', sequelize.col('endTime')), 'endTime'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'eventCount']
      ],
      where: { userId },
      group: ['sessionId'],
      order: [[sequelize.fn('MAX', sequelize.col('endTime')), 'DESC']],
      limit,
      offset,
      raw: true
    });

    // For each session, get the dataset information if available
    const sessionsWithDetails = await Promise.all(sessions.map(async (session) => {
      // Get the first event that has a dataset ID
      const datasetEvent = await TimelineEvent.findOne({
        where: { 
          sessionId: session.sessionId,
          datasetId: { [sequelize.Op.ne]: null }
        },
        include: [
          {
            model: FinancialDataset,
            as: 'dataset',
            attributes: ['id', 'name']
          }
        ]
      });

      // Get completion status
      const allSteps = await TimelineEvent.count({
        where: { sessionId: session.sessionId }
      });
      
      const completedSteps = await TimelineEvent.count({
        where: { 
          sessionId: session.sessionId,
          status: 'completed'
        }
      });
      
      const totalDuration = await TimelineEvent.sum('duration', {
        where: { sessionId: session.sessionId }
      });

      return {
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        eventCount: session.eventCount,
        datasetId: datasetEvent?.datasetId || null,
        datasetName: datasetEvent?.dataset?.name || 'Unnamed Dataset',
        completionRate: allSteps > 0 ? (completedSteps / allSteps) * 100 : 0,
        totalDuration: totalDuration || 0
      };
    }));

    return sessionsWithDetails;
  } catch (error) {
    logger.error('Error retrieving user timeline sessions:', { error, userId });
    throw error;
  }
};

/**
 * Get statistics about timeline processing
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Timeline statistics
 */
exports.getTimelineStatistics = async (userId) => {
  try {
    const totalSessions = await TimelineEvent.count({
      attributes: ['sessionId'],
      where: { userId },
      group: ['sessionId'],
      distinct: true
    });

    const totalSessionsCount = totalSessions.length;
    
    // Average duration per step
    const stepDurations = await TimelineEvent.findAll({
      attributes: [
        'step',
        'title',
        [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration'],
        [sequelize.fn('MIN', sequelize.col('duration')), 'minDuration'],
        [sequelize.fn('MAX', sequelize.col('duration')), 'maxDuration']
      ],
      where: { 
        userId,
        duration: { [sequelize.Op.gt]: 0 }
      },
      group: ['step', 'title'],
      order: [['step', 'ASC']],
      raw: true
    });

    // Success rate per step
    const stepSuccessRates = await Promise.all(Object.values(TIMELINE_STEPS).map(async (step) => {
      const totalSteps = await TimelineEvent.count({
        where: { 
          userId,
          step: step.step
        }
      });
      
      const successfulSteps = await TimelineEvent.count({
        where: { 
          userId,
          step: step.step,
          status: 'completed'
        }
      });
      
      return {
        step: step.step,
        title: step.title,
        totalCount: totalSteps,
        successCount: successfulSteps,
        successRate: totalSteps > 0 ? (successfulSteps / totalSteps) * 100 : 0
      };
    }));

    // Average time for complete end-to-end process
    const sessionDurations = await TimelineEvent.findAll({
      attributes: [
        'sessionId',
        [sequelize.fn('MIN', sequelize.col('startTime')), 'startTime'],
        [sequelize.fn('MAX', sequelize.col('endTime')), 'endTime']
      ],
      where: { userId },
      group: ['sessionId'],
      raw: true
    });

    const sessionDurationTimes = sessionDurations.map(session => {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      return end - start;
    });

    const avgSessionDuration = sessionDurationTimes.length > 0 
      ? sessionDurationTimes.reduce((sum, duration) => sum + duration, 0) / sessionDurationTimes.length 
      : 0;

    return {
      totalSessions: totalSessionsCount,
      stepDurations,
      stepSuccessRates,
      avgSessionDuration
    };
  } catch (error) {
    logger.error('Error retrieving timeline statistics:', { error, userId });
    throw error;
  }
};

/**
 * Revert to a specific timeline event
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {string} params.sessionId - Session ID
 * @param {string} params.eventId - Event ID to revert to
 * @returns {Promise<Object>} - Result with reverted state and metadata
 */
exports.revertToTimelineEvent = async (params) => {
  try {
    const { userId, sessionId, eventId } = params;
    
    if (!userId || !sessionId || !eventId) {
      throw new Error('Missing required parameters for timeline reversion');
    }
    
    // Find the event
    const event = await TimelineEvent.findByPk(eventId, {
      include: [
        {
          model: FinancialDataset,
          as: 'dataset',
          attributes: ['id', 'name']
        },
        {
          model: DataTransformation,
          as: 'transformation',
          attributes: ['id', 'name', 'operation', 'parameters', 'originalDataHash', 'resultPreview']
        }
      ]
    });
    
    if (!event) {
      throw new Error(`Timeline event not found: ${eventId}`);
    }
    
    // Ensure the event belongs to the user and session
    if (event.userId !== userId || event.sessionId !== sessionId) {
      throw new Error('Unauthorized access to timeline event');
    }
    
    // Get all events in the session
    const allEvents = await TimelineEvent.findAll({
      where: { sessionId },
      order: [['step', 'ASC'], ['startTime', 'ASC']],
      include: [
        {
          model: DataTransformation,
          as: 'transformation',
          attributes: ['id', 'status']
        }
      ]
    });
    
    // Find all events that came after the target event
    const laterEvents = allEvents.filter(e => 
      (e.step > event.step) || 
      (e.step === event.step && new Date(e.startTime) > new Date(event.startTime))
    );
    
    // Mark later events as undone
    for (const laterEvent of laterEvents) {
      await laterEvent.update({ status: 'undone' });
      
      // If the event has an associated transformation, mark it as undone too
      if (laterEvent.transformation) {
        await laterEvent.transformation.update({ status: 'undone' });
      }
    }
    
    // If the event is a data transformation, get the transformation state
    let transformationData = null;
    let datasetId = event.datasetId;
    
    if (event.step <= 3 && event.transformation) {
      // If reverting to DATA_INGESTION or NLP_PROCESSING or DATA_TRANSFORMATION
      transformationData = event.transformation.resultPreview;
    } else if (event.step > 3) {
      // If reverting to a later step, find the last data transformation
      const lastTransformation = allEvents.find(e => 
        e.step === 3 && e.status !== 'undone'
      );
      
      if (lastTransformation && lastTransformation.transformation) {
        transformationData = lastTransformation.transformation.resultPreview;
      }
    }
    
    // Create a new timeline event to log the reversion
    const reversionEvent = await exports.logTimelineStep({
      userId,
      sessionId,
      stepKey: 'DATA_TRANSFORMATION', // Reversion is a kind of transformation
      datasetId,
      details: {
        operation: 'revert',
        revertedToEvent: eventId,
        revertedToStep: event.step,
        revertedToTitle: event.title,
        undoneEvents: laterEvents.length
      },
      metadata: {
        isReversion: true,
        originalEventId: eventId
      }
    });
    
    // Return the result
    return {
      revertedToEvent: event,
      undoneEvents: laterEvents.length,
      transformationData,
      datasetId,
      reversionEvent
    };
  } catch (error) {
    logger.error('Error reverting to timeline event:', { error });
    throw error;
  }
};

// Export TIMELINE_STEPS so it can be used elsewhere
exports.TIMELINE_STEPS = TIMELINE_STEPS;
