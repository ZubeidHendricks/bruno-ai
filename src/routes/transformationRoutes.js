const express = require('express');
const router = express.Router();
const transformationController = require('../controllers/transformationController');
const { authenticateToken } = require('../middlewares/auth');

// Get all transformations
router.get('/', transformationController.getAllTransformations);

// Get transformations for a dataset
router.get('/datasets/:id', transformationController.getDatasetTransformations);

// Process transformation request
router.post('/chat/transform', transformationController.processTransformation);

module.exports = router;
