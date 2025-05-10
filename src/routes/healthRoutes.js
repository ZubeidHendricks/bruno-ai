const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bruno AI API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;