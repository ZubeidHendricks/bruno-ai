const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const { authenticateToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Get all datasets
router.get('/', datasetController.getAllDatasets);

// Get dataset by ID
router.get('/:id', datasetController.getDatasetById);

// Upload a base64 encoded file
router.post('/upload', datasetController.uploadBase64File);

// Upload a multipart file
router.post('/files/upload', upload.single('file'), datasetController.uploadMultipartFile);

// Export transformed data
router.post('/:id/export', datasetController.exportDataset);

module.exports = router;
