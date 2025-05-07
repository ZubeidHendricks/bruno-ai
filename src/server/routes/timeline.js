const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const timelineService = require('../../services/timelineService');
const dataTransformationService = require('../../services/dataTransformationService');
const logger = require('../../utils/logger');

/**
 * @route GET /api/timeline/sessions
 * @desc Get timeline sessions for the authenticated user
 * @access Private
 */
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const sessions = await timelineService.getUserTimelineSessions(
      req.user.id, 
      { 
        limit: parseInt(limit), 
        offset: parseInt(offset) 
      }
    );
    
    res.json({
      success: true,
      data: sessions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error retrieving timeline sessions:', { error });
    res.status(500).json({
      error: 'Failed to retrieve timeline sessions',
      message: error.message
    });
  }
});

/**
 * @route GET /api/timeline/sessions/:sessionId
 * @desc Get timeline events for a specific session
 * @access Private
 */
router.get('/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const events = await timelineService.getSessionTimeline(sessionId);
    
    // Check if events belong to the authenticated user
    if (events.length > 0 && events[0].userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this timeline'
      });
    }
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error retrieving timeline events:', { error });
    res.status(500).json({
      error: 'Failed to retrieve timeline events',
      message: error.message
    });
  }
});

/**
 * @route GET /api/timeline/statistics
 * @desc Get timeline statistics for the authenticated user
 * @access Private
 */
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const statistics = await timelineService.getTimelineStatistics(req.user.id);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error retrieving timeline statistics:', { error });
    res.status(500).json({
      error: 'Failed to retrieve timeline statistics',
      message: error.message
    });
  }
});

/**
 * @route POST /api/timeline/sessions
 * @desc Create a new timeline session
 * @access Private
 */
router.post('/sessions', authenticate, async (req, res) => {
  try {
    const sessionId = timelineService.createTimelineSession(req.user.id);
    
    res.json({
      success: true,
      data: { sessionId }
    });
  } catch (error) {
    logger.error('Error creating timeline session:', { error });
    res.status(500).json({
      error: 'Failed to create timeline session',
      message: error.message
    });
  }
});

/**
 * @route POST /api/timeline/events
 * @desc Log a timeline event
 * @access Private
 */
router.post('/events', authenticate, async (req, res) => {
  try {
    const { 
      sessionId, 
      stepKey, 
      datasetId, 
      transformationId,
      details,
      metadata,
      duration,
      status 
    } = req.body;
    
    if (!sessionId || !stepKey) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Session ID and step key are required'
      });
    }
    
    const event = await timelineService.logTimelineStep({
      userId: req.user.id,
      sessionId,
      stepKey,
      datasetId,
      transformationId,
      details,
      metadata,
      duration,
      status
    });
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error logging timeline event:', { error });
    res.status(500).json({
      error: 'Failed to log timeline event',
      message: error.message
    });
  }
});

/**
 * @route POST /api/timeline/events/start
 * @desc Start a timeline event
 * @access Private
 */
router.post('/events/start', authenticate, async (req, res) => {
  try {
    const { 
      sessionId, 
      stepKey, 
      datasetId, 
      transformationId,
      details,
      metadata 
    } = req.body;
    
    if (!sessionId || !stepKey) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Session ID and step key are required'
      });
    }
    
    const event = await timelineService.startTimelineStep({
      userId: req.user.id,
      sessionId,
      stepKey,
      datasetId,
      transformationId,
      details,
      metadata
    });
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error starting timeline event:', { error });
    res.status(500).json({
      error: 'Failed to start timeline event',
      message: error.message
    });
  }
});

/**
 * @route POST /api/timeline/events/:eventId/complete
 * @desc Complete a timeline event
 * @access Private
 */
router.post('/events/:eventId/complete', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { details, status, metadata } = req.body;
    
    const event = await timelineService.completeTimelineStep({
      eventId,
      details,
      status,
      metadata
    });
    
    // Ensure the event belongs to the authenticated user
    if (event.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to modify this event'
      });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error completing timeline event:', { error });
    res.status(500).json({
      error: 'Failed to complete timeline event',
      message: error.message
    });
  }
});

/**
 * @route POST /api/timeline/revert
 * @desc Revert to a specific timeline event
 * @access Private
 */
router.post('/revert', authenticate, async (req, res) => {
  try {
    const { sessionId, eventId } = req.body;
    
    if (!sessionId || !eventId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Session ID and event ID are required'
      });
    }
    
    const result = await timelineService.revertToTimelineEvent({
      userId: req.user.id,
      sessionId,
      eventId
    });
    
    res.json({
      success: true,
      data: result,
      message: `Successfully reverted to ${result.revertedToEvent.title} step. ${result.undoneEvents} later events were undone.`
    });
  } catch (error) {
    logger.error('Error reverting to timeline event:', { error });
    res.status(500).json({
      error: 'Failed to revert to timeline event',
      message: error.message
    });
  }
});

module.exports = router;