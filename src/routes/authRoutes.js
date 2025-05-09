const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

// Authentication routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/users/:id', authenticateToken, authController.getUserProfile);

module.exports = router;
