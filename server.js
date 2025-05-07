require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const models = require('./src/database/models');
const OpenAI = require('openai');
const Papa = require('papaparse');
const crypto = require('crypto');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Directory for data storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

// Database connection
const config = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bruno_ai_db',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: false
};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// ===== API ROUTES =====

// Get all datasets
app.get('/api/datasets', async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Get dataset by ID with data
app.get('/api/datasets/:id', async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Get all transformations
app.get('/api/transformations', async (req, res) => {
  try {
    const transformations = await models.DataTransformation.findAll({
      include: [{
        model: models.FinancialDataset,
        attributes: ['name', 'description']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(transformations);
  } catch (error) {
    console.error('Error fetching transformations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transformations for a dataset
app.get('/api/datasets/:id/transformations', async (req, res) => {
  try {
    const transformations = await models.DataTransformation.findAll({
      where: {
        datasetId: req.params.id
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(transformations);
  } catch (error) {
    console.error('Error fetching dataset transformations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process user transformation request
app.post('/api/chat/transform', async (req, res) => {
  try {
    const { message, datasetId, userId = 1 } = req.body;
    
    // Fetch dataset
    const dataset = await models.FinancialDataset.findByPk(datasetId);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    // Read the CSV data
    const filePath = path.join(DATA_DIR, dataset.storageKey);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dataset file not found' });
    }
    
    const csvData = fs.readFileSync(filePath, 'utf8');
    const parsedData = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    // Generate interpretation using OpenAI
    const systemPrompt = `You are an AI assistant specialized in interpreting financial data transformation requests. 
    Analyze the user's request and provide:
    1. The intended operation (merge, filter, sort, remove duplicates, etc.)
    2. The data columns involved
    3. Any specific conditions or parameters
    Format your response as a JSON object with the following structure:
    {
      "intent": string,
      "operation": string,
      "columns": array,
      "conditions": object,
      "explanation": string
    }`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" }
    });
    
    const interpretation = JSON.parse(response.choices[0].message.content);
    
    // Perform the actual transformation
    let transformedData = parsedData.data;
    let transformMessage = "";
    
    switch (interpretation.operation) {
      case 'filter':
        const column = interpretation.conditions?.column;
        const value = interpretation.conditions?.value;
        
        if (column && value) {
          transformedData = parsedData.data.filter(row => 
            String(row[column]).toLowerCase() === String(value).toLowerCase()
          );
          transformMessage = `Filtered data where ${column} equals "${value}"`;
        } else {
          transformMessage = "Couldn't perform filtering due to missing conditions";
        }
        break;
        
      case 'sort':
        const sortColumn = interpretation.columns[0];
        const order = interpretation.conditions?.order || 'asc';
        
        if (sortColumn) {
          transformedData = [...parsedData.data].sort((a, b) => {
            if (order.toLowerCase() === 'asc') {
              return a[sortColumn] > b[sortColumn] ? 1 : -1;
            } else {
              return a[sortColumn] < b[sortColumn] ? 1 : -1;
            }
          });
          transformMessage = `Sorted data by ${sortColumn} in ${order} order`;
        } else {
          transformMessage = "Couldn't perform sorting due to missing column";
        }
        break;
        
      case 'remove_duplicates':
        const dedupeColumns = interpretation.columns || Object.keys(parsedData.data[0] || {});
        
        transformedData = [];
        const seen = new Set();
        
        parsedData.data.forEach(row => {
          const key = dedupeColumns.map(col => row[col]).join('|');
          if (!seen.has(key)) {
            seen.add(key);
            transformedData.push(row);
          }
        });
        
        transformMessage = `Removed duplicates based on columns: ${dedupeColumns.join(', ')}`;
        break;
        
      case 'calculate':
        // Handle aggregation calculations
        if (interpretation.conditions?.type === 'aggregate' && interpretation.conditions?.groupBy) {
          const groupBy = interpretation.conditions.groupBy;
          const metrics = interpretation.conditions.metrics || [];
          
          // Group data
          const groups = {};
          parsedData.data.forEach(row => {
            const key = row[groupBy];
            if (!groups[key]) {
              groups[key] = [];
            }
            groups[key].push(row);
          });
          
          // Calculate aggregates
          transformedData = Object.keys(groups).map(key => {
            const group = groups[key];
            const result = { [groupBy]: key };
            
            metrics.forEach(metric => {
              const values = group.map(item => parseFloat(item[metric.column])).filter(val => !isNaN(val));
              
              switch (metric.function) {
                case 'sum':
                  result[`sum_${metric.column}`] = values.reduce((a, b) => a + b, 0);
                  break;
                case 'average':
                  result[`avg_${metric.column}`] = values.reduce((a, b) => a + b, 0) / values.length;
                  break;
                case 'min':
                  result[`min_${metric.column}`] = Math.min(...values);
                  break;
                case 'max':
                  result[`max_${metric.column}`] = Math.max(...values);
                  break;
                case 'count':
                  result[`count_${metric.column}`] = values.length;
                  break;
              }
            });
            
            return result;
          });
          
          transformMessage = `Calculated aggregations grouped by ${groupBy}`;
        } else {
          transformMessage = "Couldn't perform calculation due to missing conditions";
        }
        break;
        
      default:
        transformMessage = `Operation ${interpretation.operation} not implemented`;
        break;
    }
    
    // Store the transformation in the database
    const transformation = await models.DataTransformation.create({
      name: interpretation.intent,
      operation: interpretation.operation,
      parameters: JSON.stringify(interpretation.conditions || {}),
      originalDataHash: dataset.dataHash,
      resultPreview: JSON.stringify(transformedData.slice(0, 5)),
      status: 'completed',
      executionTime: 1000, // Mock execution time
      userId,
      datasetId: dataset.id
    });
    
    // Track in timeline
    await models.TimelineEvent.create({
      userId,
      sessionId: `session_${Date.now()}`,
      stepKey: 'DATA_TRANSFORMATION',
      datasetId: dataset.id,
      details: JSON.stringify({
        operation: interpretation.operation,
        resultRowCount: transformedData.length
      }),
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: transformMessage,
      interpretation,
      transformation,
      data: transformedData,
      rowCount: {
        original: parsedData.data.length,
        transformed: transformedData.length
      }
    });
  } catch (error) {
    console.error('Error processing transformation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload a file
app.post('/api/upload', async (req, res) => {
  try {
    const { fileData, fileName, userId = 1 } = req.body;
    
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
    
    const parsedData = Papa.parse(fileContentString, {
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
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    // Get real data from the database
    const datasets = await models.FinancialDataset.findAll();
    const transformations = await models.DataTransformation.findAll();
    const documents = await models.FinancialDocument.findAll();
    const timeline = await models.TimelineEvent.findAll({
      order: [['timestamp', 'DESC']],
      limit: 10
    });
    
    // Generate KPIs based on actual database data
    const kpis = [
      { 
        title: 'Total Datasets', 
        value: datasets.length.toString(), 
        change: 15.3 
      },
      { 
        title: 'Data Transformations', 
        value: transformations.length.toString(), 
        change: 22.5 
      },
      { 
        title: 'Total Rows Processed', 
        value: datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0).toString(), 
        change: 8.7 
      },
      { 
        title: 'Documents Analyzed', 
        value: documents.length.toString(), 
        change: 12.4 
      }
    ];
    
    // Revenue data from the actual database
    // Read revenue dataset file if it exists
    let revenueTrend = [];
    const revenueDataset = datasets.find(d => d.name.includes('Revenue'));
    
    if (revenueDataset) {
      const filePath = path.join(DATA_DIR, revenueDataset.storageKey);
      if (fs.existsSync(filePath)) {
        const csvData = fs.readFileSync(filePath, 'utf8');
        const parsedData = Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Group by month/date
        const revenueByMonth = {};
        parsedData.data.forEach(row => {
          const date = new Date(row.Date);
          const month = date.toLocaleString('default', { month: 'short' });
          
          if (!revenueByMonth[month]) {
            revenueByMonth[month] = 0;
          }
          
          revenueByMonth[month] += parseFloat(row.Revenue) || 0;
        });
        
        // Format for chart
        revenueTrend = Object.keys(revenueByMonth).map(month => ({
          month,
          revenue: revenueByMonth[month]
        }));
      }
    }
    
    // If no revenue data found, use mock data
    if (revenueTrend.length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      revenueTrend = months.map(month => ({
        month,
        revenue: 40000 + Math.random() * 45000
      }));
    }
    
    // Expense data from the actual database
    let expensesByCategory = [];
    const expenseDataset = datasets.find(d => d.name.includes('Expense'));
    
    if (expenseDataset) {
      const filePath = path.join(DATA_DIR, expenseDataset.storageKey);
      if (fs.existsSync(filePath)) {
        const csvData = fs.readFileSync(filePath, 'utf8');
        const parsedData = Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Group by category
        const expenseByCategory = {};
        parsedData.data.forEach(row => {
          if (!expenseByCategory[row.Category]) {
            expenseByCategory[row.Category] = 0;
          }
          
          expenseByCategory[row.Category] += parseFloat(row.Amount) || 0;
        });
        
        // Format for chart with colors
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];
        expensesByCategory = Object.keys(expenseByCategory).map((category, index) => ({
          name: category,
          value: expenseByCategory[category],
          color: colors[index % colors.length]
        }));
      }
    }
    
    // If no expense data found, use mock data
    if (expensesByCategory.length === 0) {
      expensesByCategory = [
        { name: 'Salaries', value: 120000, color: '#3b82f6' },
        { name: 'Marketing', value: 45000, color: '#10b981' },
        { name: 'Equipment', value: 25000, color: '#f59e0b' },
        { name: 'Rent', value: 18000, color: '#ef4444' },
        { name: 'Other', value: 7677, color: '#6366f1' }
      ];
    }
    
    // AI-Generated insights based on actual data
    const insights = [
      {
        text: `Your data includes ${datasets.length} datasets with a total of ${datasets.reduce((sum, d) => sum + d.rowCount, 0)} rows of financial information.`,
        impact: 'positive',
        confidence: 95
      },
      {
        text: `You've performed ${transformations.length} data transformations, with ${transformations.filter(t => t.operation === 'filter').length} filters and ${transformations.filter(t => t.operation === 'sort').length} sorts.`,
        impact: 'positive',
        confidence: 92
      },
      {
        text: `The most recent transformation was "${transformations[0]?.name || 'None yet'}" performed on ${transformations[0]?.createdAt ? new Date(transformations[0].createdAt).toLocaleDateString() : 'N/A'}.`,
        impact: 'neutral',
        confidence: 100
      }
    ];
    
    // Anomalies based on actual data
    let anomalies = [];
    
    // Check for expense anomalies if expense data exists
    if (expensesByCategory.length > 0) {
      const highestExpense = expensesByCategory.reduce((max, cat) => cat.value > max.value ? cat : max, { value: 0 });
      const averageExpense = expensesByCategory.reduce((sum, cat) => sum + cat.value, 0) / expensesByCategory.length;
      
      if (highestExpense.value > averageExpense * 2) {
        anomalies.push({
          title: `Unusually high ${highestExpense.name} expenses`,
          description: `${highestExpense.name} expenses are ${Math.round((highestExpense.value / averageExpense - 1) * 100)}% higher than the average category expense.`,
          date: new Date().toLocaleDateString()
        });
      }
    }
    
    // Check for timeline anomalies
    if (timeline.length > 0) {
      const lastEvent = timeline[0];
      if (lastEvent.stepKey === 'DATA_TRANSFORMATION' && JSON.parse(lastEvent.details).resultRowCount === 0) {
        anomalies.push({
          title: 'Transformation returned no results',
          description: 'Your most recent transformation filter may be too restrictive as it returned 0 rows.',
          date: new Date(lastEvent.timestamp).toLocaleDateString()
        });
      }
    }
    
    // If no anomalies found, use mock data
    if (anomalies.length === 0) {
      anomalies = [
        {
          title: 'Unusual expense pattern',
          description: 'Equipment expenses increased by 240% in August compared to the 6-month average.',
          date: 'Aug 28, 2024'
        },
        {
          title: 'Customer payment anomaly',
          description: 'Customer XYZ has missed their payment schedule for 3 consecutive months.',
          date: 'Sep 15, 2024'
        }
      ];
    }
    
    // Return the dashboard data
    res.json({
      kpis,
      revenueTrend,
      expensesByCategory,
      insights,
      anomalies,
      recentActivity: timeline.map(event => ({
        id: event.id,
        action: event.stepKey,
        details: JSON.parse(event.details),
        timestamp: event.timestamp
      }))
    });
    
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await models.User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // For demo purposes, we're not comparing hashed passwords
    // In production, you'd use bcrypt.compare(password, user.password)
    
    // Create a simple token (not secure for production)
    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    const searchResults = [];
    
    // Search in datasets
    const datasets = await models.FinancialDataset.findAll({
      where: Sequelize.literal(`name ILIKE '%${query}%' OR description ILIKE '%${query}%'`),
      limit: 5
    });
    
    datasets.forEach(dataset => {
      searchResults.push({
        id: `dataset-${dataset.id}`,
        type: 'dataset',
        title: dataset.name,
        description: dataset.description,
        url: `/datasets/${dataset.id}`
      });
    });
    
    // Search in documents
    const documents = await models.FinancialDocument.findAll({
      where: Sequelize.literal(`name ILIKE '%${query}%' OR content ILIKE '%${query}%'`),
      limit: 5
    });
    
    documents.forEach(document => {
      searchResults.push({
        id: `document-${document.id}`,
        type: 'document',
        title: document.name,
        description: document.content.substring(0, 100) + '...',
        url: `/documents/${document.id}`
      });
    });
    
    // Search in transformations
    const transformations = await models.DataTransformation.findAll({
      where: Sequelize.literal(`name ILIKE '%${query}%'`),
      include: [{
        model: models.FinancialDataset,
        attributes: ['name']
      }],
      limit: 5
    });
    
    transformations.forEach(transformation => {
      searchResults.push({
        id: `transformation-${transformation.id}`,
        type: 'transformation',
        title: transformation.name,
        description: `Transformation on ${transformation.FinancialDataset.name}`,
        url: `/datasets/${transformation.datasetId}`
      });
    });
    
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: error.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, async () => {
  const connected = await testConnection();
  if (connected) {
    console.log(`Server running on port ${PORT} with database connection`);
  } else {
    console.warn(`Server running on port ${PORT} WITHOUT database connection`);
  }
});
