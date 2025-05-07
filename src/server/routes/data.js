const express = require('express');
const router = express.Router();
const Papa = require('papaparse');
const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { authenticate } = require('../../middleware/auth');
const { 
  interpretUserIntent, 
  processDataTransformation,
  exportTransformedData,
  undoLastOperation,
  getTransformationHistory,
  getUserDatasets,
  getSuggestedTransformations
} = require('../../services/dataTransformationService');
const {
  storeFinancialDocument,
  searchSimilarDocuments,
  extractFinancialEntities
} = require('../../services/vectorDatabaseService');
const logger = require('../../utils/logger');

// Ensure upload and processed directories exist
const createDirectories = async () => {
  try {
    await fs.mkdir('uploads', { recursive: true });
    await fs.mkdir('processed', { recursive: true });
  } catch (error) {
    logger.error('Error creating directories:', { error });
  }
};

createDirectories();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to limit file types
const fileFilter = (req, file, cb) => {
  // Accept only CSV, Excel, and JSON files
  const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload CSV, Excel, or JSON files.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload file endpoint
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Generate file hash for tracking
    const fileBuffer = await fs.readFile(req.file.path);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    
    // Basic validation of file content
    let preview = [];
    let rowCount = 0;
    let columns = [];
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (ext === '.csv') {
      const fileContent = fileBuffer.toString('utf-8');
      
      const parseResult = Papa.parse(fileContent, {
        header: true,
        preview: 5, // Only read first 5 rows for preview
        skipEmptyLines: true
      });
      
      preview = parseResult.data;
      columns = parseResult.meta.fields;
      
      // Count total rows - re-parse with smaller chunk size for large files
      const countResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          rowCount = result.data.length;
        }
      });
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.read(fileBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get all data
      const data = XLSX.utils.sheet_to_json(worksheet);
      rowCount = data.length;
      
      // Get preview
      preview = data.slice(0, 5);
      
      // Get columns
      if (data.length > 0) {
        columns = Object.keys(data[0]);
      }
    } else if (ext === '.json') {
      const fileContent = fileBuffer.toString('utf-8');
      const data = JSON.parse(fileContent);
      
      if (Array.isArray(data)) {
        rowCount = data.length;
        preview = data.slice(0, 5);
        
        if (data.length > 0) {
          columns = Object.keys(data[0]);
        }
      } else {
        // Handle non-array JSON
        preview = [data];
        columns = Object.keys(data);
        rowCount = 1;
      }
    }
    
    res.json({
      success: true,
      file: {
        id: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        hash: fileHash,
        type: req.file.mimetype
      },
      preview,
      rowCount,
      columns
    });
  } catch (error) {
    logger.error('Error uploading file:', { error });
    res.status(500).json({
      error: 'File upload failed',
      message: error.message
    });
  }
});

// Process uploaded data
router.post('/process', authenticate, async (req, res) => {
  try {
    const { fileId, transformation, options = {} } = req.body;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Read file
    const filePath = path.join('uploads', fileId);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    let data;
    const ext = path.extname(fileId).toLowerCase();
    
    // Parse file based on extension
    if (ext === '.csv') {
      data = Papa.parse(fileContent, { header: true, dynamicTyping: true }).data;
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.read(fileContent, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (ext === '.json') {
      data = JSON.parse(fileContent);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    // Apply transformation if provided
    let processedData = data;
    if (transformation) {
      // Process the data transformation here
      try {
        const transformationResult = await processDataTransformation(
          transformation, 
          [{ name: fileId, content: fileContent }], 
          req.user.id
        );
        processedData = transformationResult.data;
      } catch (transformError) {
        logger.error('Transformation error:', { error: transformError });
        return res.status(500).json({
          error: 'Data transformation failed',
          message: transformError.message
        });
      }
    }

    // Generate preview
    const preview = processedData.slice(0, 10);
    const summary = {
      rowCount: processedData.length,
      columnCount: Object.keys(processedData[0] || {}).length,
      columns: Object.keys(processedData[0] || {})
    };

    res.json({
      success: true,
      data: options.fullData ? processedData : undefined,
      preview,
      summary
    });
  } catch (error) {
    logger.error('Error processing data:', { error });
    res.status(500).json({
      error: 'Data processing failed',
      message: error.message
    });
  }
});

// Extract financial entities from data
router.post('/extract-entities', authenticate, async (req, res) => {
  try {
    const { text, dataRows } = req.body;
    
    let entitiesToExtract = [];
    
    if (text) {
      entitiesToExtract.push(text);
    }
    
    if (dataRows && Array.isArray(dataRows)) {
      entitiesToExtract.push(...dataRows.map(row => JSON.stringify(row)));
    }
    
    if (entitiesToExtract.length === 0) {
      return res.status(400).json({ error: 'No data provided for entity extraction' });
    }
    
    const extractedEntities = [];
    
    for (const item of entitiesToExtract) {
      const entities = await extractFinancialEntities(item);
      extractedEntities.push(entities);
    }
    
    // Combine and deduplicate entities
    const combinedEntities = {
      companies: [...new Set(extractedEntities.flatMap(e => e.companies || []))],
      accounts: [...new Set(extractedEntities.flatMap(e => e.accounts || []))],
      amounts: [...new Set(extractedEntities.flatMap(e => e.amounts || []))],
      dates: [...new Set(extractedEntities.flatMap(e => e.dates || []))],
      categories: [...new Set(extractedEntities.flatMap(e => e.categories || []))]
    };
    
    res.json({
      success: true,
      entities: combinedEntities
    });
  } catch (error) {
    logger.error('Entity extraction failed:', { error });
    res.status(500).json({
      error: 'Entity extraction failed',
      message: error.message
    });
  }
});

// Search for similar documents
router.post('/search', authenticate, async (req, res) => {
  try {
    const { query, limit = 5, threshold = 0.7, filters = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Add user ID to filters for security
    const searchFilters = {
      ...filters,
      userId: req.user.id
    };
    
    const results = await searchSimilarDocuments(query, limit, searchFilters);
    
    // Filter by threshold if needed
    const filteredResults = results.filter(result => 
      (result._additional?.certainty || result.score || 1) >= threshold
    );
    
    res.json({
      success: true,
      results: filteredResults,
      count: filteredResults.length
    });
  } catch (error) {
    logger.error('Search failed:', { error });
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// Store document in vector database
router.post('/store', authenticate, async (req, res) => {
  try {
    const { document } = req.body;
    
    if (!document || !document.content) {
      return res.status(400).json({ error: 'Document content is required' });
    }
    
    // Add user ID to document for security
    const documentWithUser = {
      ...document,
      userId: req.user.id
    };
    
    const result = await storeFinancialDocument(documentWithUser);
    
    res.json({
      success: true,
      documentId: result.id
    });
  } catch (error) {
    logger.error('Storage failed:', { error });
    res.status(500).json({
      error: 'Storage failed',
      message: error.message
    });
  }
});

// Export processed data
router.post('/export', authenticate, async (req, res) => {
  try {
    const { data, format = 'csv', filename = 'export' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    
    let exportData;
    let contentType;
    let fileExtension;
    
    switch (format) {
      case 'csv':
        exportData = Papa.unparse(data);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        exportData = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        exportData = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
      default:
        return res.status(400).json({ error: 'Unsupported export format' });
    }
    
    // Save to processed folder
    const exportFilename = `${filename}_${Date.now()}.${fileExtension}`;
    const exportPath = path.join('processed', exportFilename);
    
    await fs.writeFile(exportPath, exportData);
    
    res.json({
      success: true,
      filename: exportFilename,
      downloadUrl: `/api/data/download/${exportFilename}`
    });
  } catch (error) {
    logger.error('Export failed:', { error });
    res.status(500).json({
      error: 'Export failed',
      message: error.message
    });
  }
});

// Download exported file
router.get('/download/:filename', authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('processed', filename);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const ext = path.extname(filename).toLowerCase();
    let contentType;
    
    switch (ext) {
      case '.csv':
        contentType = 'text/csv';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Download failed:', { error });
    res.status(500).json({
      error: 'Download failed',
      message: error.message
    });
  }
});

// Get interpretation of user request
router.post('/interpret', authenticate, async (req, res) => {
  try {
    const { userInput } = req.body;
    
    if (!userInput) {
      return res.status(400).json({ error: 'User input is required' });
    }
    
    const interpretation = await interpretUserIntent(userInput);
    
    res.json({
      success: true,
      interpretation
    });
  } catch (error) {
    logger.error('Interpretation failed:', { error });
    res.status(500).json({
      error: 'Interpretation failed',
      message: error.message
    });
  }
});

// Undo last operation
router.post('/undo', authenticate, async (req, res) => {
  try {
    const { datasetId } = req.body;
    
    if (!datasetId) {
      return res.status(400).json({ error: 'Dataset ID is required' });
    }
    
    const result = await undoLastOperation(req.user.id, datasetId);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Undo failed:', { error });
    res.status(500).json({
      error: 'Undo failed',
      message: error.message
    });
  }
});

// Get transformation history
router.get('/history/:datasetId', authenticate, async (req, res) => {
  try {
    const { datasetId } = req.params;
    
    if (!datasetId) {
      return res.status(400).json({ error: 'Dataset ID is required' });
    }
    
    const history = await getTransformationHistory(req.user.id, datasetId);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('History retrieval failed:', { error });
    res.status(500).json({
      error: 'History retrieval failed',
      message: error.message
    });
  }
});

// Get user datasets
router.get('/datasets', authenticate, async (req, res) => {
  try {
    const datasets = await getUserDatasets(req.user.id);
    
    res.json({
      success: true,
      datasets
    });
  } catch (error) {
    logger.error('Datasets retrieval failed:', { error });
    res.status(500).json({
      error: 'Datasets retrieval failed',
      message: error.message
    });
  }
});

// Get suggested transformations based on data
router.post('/suggest', authenticate, async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Data array is required' });
    }
    
    const suggestions = await getSuggestedTransformations(data);
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    logger.error('Suggestions failed:', { error });
    res.status(500).json({
      error: 'Suggestions failed',
      message: error.message
    });
  }
});

module.exports = router;