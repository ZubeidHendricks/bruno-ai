const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const models = require('../database/models');
const openai = require('../config/openai');

const DATA_DIR = path.join(__dirname, '../../data');

// Get all transformations
const getAllTransformations = async (req, res) => {
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
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Failed to fetch transformations' : error.message,
      requestId: req.id
    });
  }
};

// Get transformations for a dataset
const getDatasetTransformations = async (req, res) => {
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
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Failed to fetch transformations' : error.message,
      requestId: req.id
    });
  }
};

// Process user transformation request
const processTransformation = async (req, res) => {
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
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Failed to process transformation' 
        : error.message,
      requestId: req.id
    });
  }
};

module.exports = {
  getAllTransformations,
  getDatasetTransformations,
  processTransformation
};
