const { Sequelize } = require('sequelize');
const Papa = require('papaparse');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

  // GET all transformations
  if (req.method === 'GET') {
    try {
      const transformations = await models.DataTransformation.findAll({
        include: [{
          model: models.FinancialDataset,
          attributes: ['name', 'description']
        }],
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json(transformations);
    } catch (error) {
      console.error('Error fetching transformations:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // POST to process a transformation
  if (req.method === 'POST') {
    try {
      const { message, datasetId, userId = 1 } = req.body;
      
      // Fetch dataset
      const dataset = await models.FinancialDataset.findByPk(datasetId);
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }
      
      // Since we're on Vercel, we'll read data from the database instead of the file system
      const csvContent = dataset.fileContent;
      if (!csvContent) {
        return res.status(404).json({ error: 'Dataset content not found' });
      }
      
      // Parse CSV data
      const parsedData = Papa.parse(csvContent, {
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
      
      return res.status(200).json({
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
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
};
