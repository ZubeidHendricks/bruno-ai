const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const crypto = require('crypto');
const xlsx = require('xlsx');
const models = require('../database/models');

const DATA_DIR = path.join(__dirname, '../../data');

// Get all datasets
const getAllDatasets = async (req, res) => {
  try {
    const datasets = await models.FinancialDataset.findAll({
      attributes: ['id', 'name', 'description', 'format', 'rowCount', 'createdAt'],
      include: [{
        model: models.User,
        attributes: ['username', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(datasets);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Failed to fetch datasets' : error.message,
      requestId: req.id
    });
  }
};

// Get dataset by ID with data
const getDatasetById = async (req, res) => {
  try {
    const dataset = await models.FinancialDataset.findByPk(req.params.id, {
      include: [{
        model: models.DataTransformation,
        order: [['createdAt', 'DESC']]
      }]
    });
    
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    // Read the actual CSV data
    const filePath = path.join(DATA_DIR, dataset.storageKey);
    
    if (fs.existsSync(filePath)) {
      const csvData = fs.readFileSync(filePath, 'utf8');
      const parsedData = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      // Add parsed data to response
      dataset.dataValues.data = parsedData.data;
      
      // Generate preview metadata for columns
      const preview = Object.keys(parsedData.data[0] || {}).map(key => {
        const values = parsedData.data.map(row => row[key]).filter(val => val !== null && val !== '');
        return {
          column: key,
          type: dataset.columns ? 
            JSON.parse(dataset.columns).find(col => col.name === key)?.type || 'string' 
            : 'string',
          sample: values.slice(0, 3).join(', ')
        };
      });
      
      dataset.dataValues.preview = preview;
    } else {
      dataset.dataValues.data = [];
      dataset.dataValues.preview = [];
    }
    
    res.json(dataset);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Failed to fetch dataset' : error.message,
      requestId: req.id
    });
  }
};

// Upload a base64 encoded file
const uploadBase64File = async (req, res) => {
  try {
    const { fileData, fileName, userId = 1 } = req.body;
    
    // Validate input
    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'File data and file name are required' });
    }
    
    // Create directory if it doesn't exist
    const userDir = path.join(DATA_DIR, `user_${userId}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Generate a hash for the file
    const hash = crypto.createHash('md5').update(fileData || '').digest('hex');
    
    // Create hash directory
    const hashDir = path.join(userDir, hash);
    if (!fs.existsSync(hashDir)) {
      fs.mkdirSync(hashDir, { recursive: true });
    }
    
    // Save the file
    const filePath = path.join(hashDir, fileName);
    const fileContent = fileData.split(',')[1] ? 
      Buffer.from(fileData.split(',')[1], 'base64') : 
      Buffer.from(fileData, 'base64');
    
    fs.writeFileSync(filePath, fileContent);
    
    // Parse the file to get columns and row count
    const fileBuffer = fs.readFileSync(filePath);
    const fileContentString = fileBuffer.toString('utf8');
    
    try {
      const parsedData = Papa.parse(fileContentString, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        error: (error) => {
          throw new Error(`CSV parsing error: ${error.message}`);
        }
      });
      
      if (parsedData.errors && parsedData.errors.length > 0) {
        const errorMessage = parsedData.errors.map(e => e.message).join(', ');
        throw new Error(`CSV parsing errors: ${errorMessage}`);
      }
      
      if (!parsedData.data || parsedData.data.length === 0) {
        throw new Error('No data found in the CSV file or header is missing');
      }
      
      // Generate column metadata
      const columns = Object.keys(parsedData.data[0] || {}).map(key => {
        // Detect column type
        const values = parsedData.data.map(row => row[key]).filter(val => val != null);
        let type = 'string';
        
        if (values.length > 0) {
          if (values.every(val => !isNaN(val))) {
            type = 'number';
          } else if (values.every(val => !isNaN(Date.parse(val)))) {
            type = 'date';
          }
        }
        
        return {
          name: key,
          type
        };
      });
      
      // Create the dataset record
      const dataset = await models.FinancialDataset.create({
        name: fileName,
        description: `Dataset uploaded from ${fileName}`,
        sourceType: 'upload',
        format: 'csv',
        columns: JSON.stringify(columns),
        rowCount: parsedData.data.length,
        dataHash: hash,
        storageKey: `user_${userId}/${hash}/${fileName}`,
        userId
      });
      
      // Track in timeline
      await models.TimelineEvent.create({
        userId,
        sessionId: `session_${Date.now()}`,
        stepKey: 'DATA_UPLOAD',
        datasetId: dataset.id,
        details: JSON.stringify({
          fileName,
          fileSize: fileContent.length,
          mimeType: 'text/csv'
        }),
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        dataset,
        preview: parsedData.data.slice(0, 5)
      });
    } catch (parsingError) {
      // Clean up the file if parsing failed
      try {
        fs.unlinkSync(filePath);
        if (fs.readdirSync(hashDir).length === 0) {
          fs.rmdirSync(hashDir);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file after parsing failure:', cleanupError);
      }
      
      throw parsingError;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id
    });
  }
};

// Upload a multipart file
const uploadMultipartFile = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.body.userId || 1;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Generate a hash for the file
    const fileBuffer = fs.readFileSync(file.path);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    
    // Create hash directory
    const hashDir = path.join(DATA_DIR, `user_${userId}`, hash);
    if (!fs.existsSync(hashDir)) {
      fs.mkdirSync(hashDir, { recursive: true });
    }
    
    // Move file to permanent location
    const newFilePath = path.join(hashDir, file.originalname);
    fs.renameSync(file.path, newFilePath);
    
    // Parse file based on type
    let parsedData;
    let fileFormat;
    
    try {
      if (file.originalname.endsWith('.csv')) {
        // Parse CSV
        const csvData = fs.readFileSync(newFilePath, 'utf8');
        parsedData = Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          error: (error) => {
            throw new Error(`CSV parsing error: ${error.message}`);
          }
        });
        fileFormat = 'csv';
      } else if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
        // Parse Excel
        const workbook = xlsx.readFile(newFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedData = {
          data: xlsx.utils.sheet_to_json(worksheet)
        };
        fileFormat = 'excel';
      } else if (file.originalname.endsWith('.json')) {
        // Parse JSON
        const jsonData = fs.readFileSync(newFilePath, 'utf8');
        const jsonParsed = JSON.parse(jsonData);
        parsedData = {
          data: Array.isArray(jsonParsed) ? jsonParsed : [jsonParsed]
        };
        fileFormat = 'json';
      } else {
        throw new Error('Unsupported file format');
      }
      
      if (!parsedData.data || parsedData.data.length === 0) {
        throw new Error('No data found in the file');
      }
      
      // Generate column metadata
      const columns = Object.keys(parsedData.data[0] || {}).map(key => {
        // Detect column type
        const values = parsedData.data.map(row => row[key]).filter(val => val != null);
        let type = 'string';
        
        if (values.length > 0) {
          if (values.every(val => !isNaN(val))) {
            type = 'number';
          } else if (values.every(val => !isNaN(Date.parse(val)))) {
            type = 'date';
          }
        }
        
        return {
          name: key,
          type
        };
      });
      
      // Create the dataset record
      const dataset = await models.FinancialDataset.create({
        name: file.originalname,
        description: `Dataset uploaded from ${file.originalname}`,
        sourceType: 'upload',
        format: fileFormat,
        columns: JSON.stringify(columns),
        rowCount: parsedData.data.length,
        dataHash: hash,
        storageKey: `user_${userId}/${hash}/${file.originalname}`,
        userId
      });
      
      // Track in timeline
      await models.TimelineEvent.create({
        userId,
        sessionId: `session_${Date.now()}`,
        stepKey: 'DATA_UPLOAD',
        datasetId: dataset.id,
        details: JSON.stringify({
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        }),
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        dataset,
        preview: parsedData.data.slice(0, 5)
      });
    } catch (parsingError) {
      // Clean up the file if parsing failed
      try {
        fs.unlinkSync(newFilePath);
        if (fs.readdirSync(hashDir).length === 0) {
          fs.rmdirSync(hashDir);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file after parsing failure:', cleanupError);
      }
      
      throw parsingError;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
};

// Export transformed data
const exportDataset = async (req, res) => {
  try {
    const { format = 'csv', transformationId } = req.body;
    const datasetId = req.params.id;
    
    // Fetch dataset
    const dataset = await models.FinancialDataset.findByPk(datasetId);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    // Read the dataset file
    const filePath = path.join(DATA_DIR, dataset.storageKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dataset file not found' });
    }
    
    let data;
    
    if (transformationId) {
      // Get transformation details
      const transformation = await models.DataTransformation.findByPk(transformationId);
      if (!transformation) {
        return res.status(404).json({ error: 'Transformation not found' });
      }
      
      // Read the original data
      const csvData = fs.readFileSync(filePath, 'utf8');
      const parsedData = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      // Re-apply the transformation
      const operation = transformation.operation;
      const parameters = JSON.parse(transformation.parameters);
      
      switch (operation) {
        case 'filter':
          const column = parameters.column;
          const value = parameters.value;
          
          if (column && value) {
            data = parsedData.data.filter(row => 
              String(row[column]).toLowerCase() === String(value).toLowerCase()
            );
          } else {
            data = parsedData.data;
          }
          break;
          
        case 'sort':
          const sortColumn = parameters.column;
          const order = parameters.order || 'asc';
          
          if (sortColumn) {
            data = [...parsedData.data].sort((a, b) => {
              if (order.toLowerCase() === 'asc') {
                return a[sortColumn] > b[sortColumn] ? 1 : -1;
              } else {
                return a[sortColumn] < b[sortColumn] ? 1 : -1;
              }
            });
          } else {
            data = parsedData.data;
          }
          break;
          
        case 'remove_duplicates':
          const dedupeColumns = parameters.columns || Object.keys(parsedData.data[0] || {});
          
          data = [];
          const seen = new Set();
          
          parsedData.data.forEach(row => {
            const key = dedupeColumns.map(col => row[col]).join('|');
            if (!seen.has(key)) {
              seen.add(key);
              data.push(row);
            }
          });
          break;
          
        default:
          data = parsedData.data;
          break;
      }
    } else {
      // No transformation specified, just export the original data
      const csvData = fs.readFileSync(filePath, 'utf8');
      const parsedData = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      data = parsedData.data;
    }
    
    // Format the data according to requested format
    let exportData;
    let contentType;
    let fileName;
    
    switch (format.toLowerCase()) {
      case 'csv':
        exportData = Papa.unparse(data);
        contentType = 'text/csv';
        fileName = `${dataset.name.replace(/\\s+/g, '_')}_export.csv`;
        break;
        
      case 'json':
        exportData = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileName = `${dataset.name.replace(/\\s+/g, '_')}_export.json`;
        break;
        
      case 'excel':
        // Create a new workbook
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Data');
        
        // Write to buffer
        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        exportData = excelBuffer;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `${dataset.name.replace(/\\s+/g, '_')}_export.xlsx`;
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported export format' });
    }
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Send the data
    res.send(exportData);
    
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Failed to export data' : error.message,
      requestId: req.id
    });
  }
};

module.exports = {
  getAllDatasets,
  getDatasetById,
  uploadBase64File,
  uploadMultipartFile,
  exportDataset
};
