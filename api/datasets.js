const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Import models
const models = require('../src/database/models');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET all datasets
  if (req.method === 'GET') {
    try {
      const datasets = await models.FinancialDataset.findAll({
        attributes: ['id', 'name', 'description', 'format', 'rowCount', 'createdAt'],
        include: [{
          model: models.User,
          attributes: ['username', 'email']
        }],
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json(datasets);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // POST to upload a new dataset
  if (req.method === 'POST') {
    try {
      const { fileData, fileName, userId = 1 } = req.body;
      
      // For Vercel, we'll store the CSV content in the database directly
      // instead of writing to file system
      
      // Generate a hash for the file
      const crypto = require('crypto');
      const hash = crypto.createHash('md5').update(fileData || '').digest('hex');
      
      // Parse CSV data
      const base64Content = fileData.split(',')[1];
      const csvContent = Buffer.from(base64Content, 'base64').toString('utf8');
      
      const parsedData = Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
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
        storageKey: `${userId}/${hash}/${fileName}`,
        userId,
        fileContent: csvContent // Store the actual CSV content
      });
      
      // Track in timeline
      await models.TimelineEvent.create({
        userId,
        sessionId: `session_${Date.now()}`,
        stepKey: 'DATA_UPLOAD',
        datasetId: dataset.id,
        details: JSON.stringify({
          fileName,
          fileSize: csvContent.length,
          mimeType: 'text/csv'
        }),
        timestamp: new Date()
      });
      
      return res.status(200).json({
        success: true,
        dataset,
        preview: parsedData.data.slice(0, 5)
      });
    } catch (error) {
      console.error('Error uploading dataset:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
};
