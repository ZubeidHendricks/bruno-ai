const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

// Public endpoint - no authentication required
router.get('/public', dashboardController.getPublicDashboardData);

// Protected routes
router.get('/', authenticateToken, dashboardController.getDashboardData);
router.get('/analytics', authenticateToken, dashboardController.getAnalytics);
router.get('/activity', authenticateToken, dashboardController.getActivity);
router.get('/summary', authenticateToken, dashboardController.getSummary);

module.exports = router;