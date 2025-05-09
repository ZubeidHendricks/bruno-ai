const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

// Get dashboard data
router.get('/', dashboardController.getDashboardData);

module.exports = router;
