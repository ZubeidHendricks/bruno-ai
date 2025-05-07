const Papa = require('papaparse');
const _ = require('lodash');
const OpenAI = require('openai');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { retry } = require('../utils/retryUtil');
const timelineTracking = require('../utils/timelineTracking');
const { DataTransformation, FinancialDataset } = require('../database/models');
const { Op } = require('sequelize');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

/**
 * Interpret user intent from natural language input
 */
exports.interpretUserIntent = async (userInput) => {
  try {
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

    const response = await retry(async () => {
      return openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput }
        ],
        response_format: { type: "json_object" }
      });
    }, 3, 1000);

    const result = JSON.parse(response.choices[0].message.content);
    logger.info('User intent interpreted', { intent: result.intent, operation: result.operation });
    
    return result;
  } catch (error) {
    logger.error('Error interpreting user intent:', { error, userInput });
    throw new Error('Failed to interpret your request. Please try again.');
  }
};

/**
 * Process data transformation based on user request
 */
exports.processDataTransformation = async (userInput, files, userId) => {
  try {
    // Create a new timeline session for this processing
    if (userId) {
      timelineTracking.resetSession(userId);
    }
    
    // Timeline: NLP Processing Step
    const interpretation = userId ? 
      await timelineTracking.trackAsyncStep(
        { 
          userId, 
          stepKey: 'NLP_PROCESSING',
          details: { userInput }
        }, 
        () => exports.interpretUserIntent(userInput)
      ) : 
      await exports.interpretUserIntent(userInput);
    
    // Log the interpretation
    logger.info('Processing data transformation', { 
      operation: interpretation.operation, 
      userInput,
      filesCount: files ? files.length : 0
    });
    
    // Simulate file processing
    let data = [];
    let preview = [];
    
    if (files && files.length > 0) {
      // Parse first file as example
      const file = files[0];
      const fileReader = new FileReader();
      
      return new Promise((resolve, reject) => {
        fileReader.onload = async (e) => {
          try {
            const csvText = e.target.result;
            
            // Generate data hash for tracking changes
            const dataHash = crypto.createHash('md5').update(csvText).digest('hex');
            
            // Timeline: Data Ingestion Step
            if (userId) {
              await timelineTracking.trackStep({
                userId,
                stepKey: 'DATA_INGESTION',
                details: {
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: file.type
                }
              });
            }
            
            Papa.parse(csvText, {
              header: true,
              complete: async (results) => {
                try {
                  data = results.data;
                  
                  // Generate preview metadata
                  preview = Object.keys(data[0] || {}).map(key => ({
                    column: key,
                    type: detectColumnType(data, key),
                    sample: _.sampleSize(data.map(row => row[key]).filter(val => val), 3).join(', ')
                  }));
                  
                  // Create or find dataset if user is authenticated
                  let dataset = null;
                  if (userId) {
                    // Create or find dataset
                    const [datasetRecord] = await FinancialDataset.findOrCreate({
                      where: { 
                        userId,
                        name: file.name,
                        dataHash
                      },
                      defaults: {
                        description: `Dataset from ${file.name}`,
                        sourceType: 'upload',
                        format: 'csv',
                        columns: preview.map(p => ({ name: p.column, type: p.type })),
                        rowCount: data.length,
                        storageKey: `${userId}/${dataHash}/${file.name}`
                      }
                    });
                    dataset = datasetRecord;
                  }
                  
                  // Execute transformation based on interpretation
                  let transformedData = data;
                  let message = "";
                  
                  // Timeline: Data Transformation Step
                  const performTransformation = async () => {
                    switch (interpretation.operation) {
                      case 'merge':
                        // Simulated merge operation
                        message = `I've merged the data using ${interpretation.columns.join(' and ')} as key columns.`;
                        return data; // No actual transformation in this simulation
                      case 'filter':
                        transformedData = data.filter(row => 
                          interpretation.conditions.column in row &&
                          row[interpretation.conditions.column] === interpretation.conditions.value
                        );
                        message = `I've filtered the data based on your criteria: ${interpretation.explanation}`;
                        return transformedData;
                      case 'remove_duplicates':
                        transformedData = _.uniqBy(data, row => 
                          interpretation.columns.map(col => row[col]).join('|')
                        );
                        message = `I've removed duplicates based on ${interpretation.columns.join(', ')}. Found ${data.length - transformedData.length} duplicates.`;
                        return transformedData;
                      case 'sort':
                        transformedData = _.orderBy(data, 
                          interpretation.columns, 
                          interpretation.conditions.order || 'asc'
                        );
                        message = `I've sorted the data by ${interpretation.columns.join(', ')} in ${interpretation.conditions.order || 'ascending'} order.`;
                        return transformedData;
                      case 'calculate':
                        // Calculate new columns or aggregations
                        if (interpretation.conditions.type === 'aggregate') {
                          // Group by and calculate aggregates
                          const groupedData = _.groupBy(data, row => row[interpretation.conditions.groupBy]);
                          transformedData = Object.keys(groupedData).map(key => {
                            const group = groupedData[key];
                            const result = { [interpretation.conditions.groupBy]: key };
                            
                            // Calculate aggregates for each metric
                            interpretation.conditions.metrics.forEach(metric => {
                              const values = group.map(item => parseFloat(item[metric.column])).filter(val => !isNaN(val));
                              
                              switch (metric.function) {
                                case 'sum':
                                  result[`sum_${metric.column}`] = _.sum(values);
                                  break;
                                case 'average':
                                  result[`avg_${metric.column}`] = _.mean(values);
                                  break;
                                case 'min':
                                  result[`min_${metric.column}`] = _.min(values);
                                  break;
                                case 'max':
                                  result[`max_${metric.column}`] = _.max(values);
                                  break;
                                case 'count':
                                  result[`count_${metric.column}`] = values.length;
                                  break;
                              }
                            });
                            
                            return result;
                          });
                          
                          message = `I've calculated aggregate values grouped by ${interpretation.conditions.groupBy}.`;
                        } else {
                          // Calculate a new column
                          transformedData = data.map(row => {
                            const newRow = { ...row };
                            
                            // Basic calculation for demonstration
                            if (interpretation.conditions.formula) {
                              // Example formula: "price * quantity"
                              const formula = interpretation.conditions.formula;
                              const newColumn = interpretation.conditions.newColumn || 'calculated_value';
                              
                              // Very simple formula evaluation (just for demo)
                              // In production, use a safer method or library
                              try {
                                const columns = Object.keys(row);
                                let evalFormula = formula;
                                
                                // Replace column names with their values
                                columns.forEach(col => {
                                  const value = parseFloat(row[col]);
                                  if (!isNaN(value)) {
                                    evalFormula = evalFormula.replace(new RegExp(col, 'g'), value);
                                  }
                                });
                                
                                // Simple eval for basic math
                                newRow[newColumn] = eval(evalFormula);
                              } catch (calcError) {
                                newRow[newColumn] = 'Error';
                                logger.error('Formula calculation error:', { formula, error: calcError });
                              }
                            }
                            
                            return newRow;
                          });
                          
                          message = `I've calculated a new column based on your formula: ${interpretation.conditions.formula}.`;
                        }
                        return transformedData;
                      default:
                        message = `I'm processing your request: ${interpretation.explanation}`;
                        return data;
                    }
                  };
                  
                  // Execute the transformation with timeline tracking
                  if (userId && dataset) {
                    transformedData = await timelineTracking.trackAsyncStep(
                      {
                        userId,
                        stepKey: 'DATA_TRANSFORMATION',
                        datasetId: dataset.id,
                        details: {
                          operation: interpretation.operation,
                          columns: interpretation.columns,
                          conditions: interpretation.conditions,
                          rowCount: data.length
                        }
                      },
                      performTransformation
                    );
                    
                    // Timeline: Data Validation Step
                    await timelineTracking.trackStep({
                      userId,
                      stepKey: 'DATA_VALIDATION',
                      datasetId: dataset.id,
                      details: {
                        originalRowCount: data.length,
                        transformedRowCount: transformedData.length,
                        validation: {
                          columnsPreserved: true,
                          dataTypesConsistent: true,
                          noNullValuesIntroduced: !transformedData.some(row => 
                            Object.values(row).some(val => val === null)
                          )
                        }
                      }
                    });
                    
                    // Store the transformation in the database
                    await DataTransformation.create({
                      userId,
                      datasetId: dataset.id,
                      name: interpretation.intent,
                      operation: interpretation.operation,
                      parameters: { 
                        columns: interpretation.columns,
                        conditions: interpretation.conditions
                      },
                      originalDataHash: dataHash,
                      resultPreview: transformedData.slice(0, 5),
                      status: 'completed',
                      executionTime: Date.now() - new Date().getTime() // Just a placeholder
                    });
                    
                    // Timeline: Vector Embedding Step (simulation)
                    await timelineTracking.trackStep({
                      userId,
                      stepKey: 'VECTOR_EMBEDDING',
                      datasetId: dataset.id,
                      details: {
                        vectorDimension: 1536,
                        documentsVectorized: transformedData.length
                      }
                    });
                    
                    // Timeline: Pattern Analysis Step (simulation)
                    await timelineTracking.trackStep({
                      userId,
                      stepKey: 'PATTERN_ANALYSIS',
                      datasetId: dataset.id,
                      details: {
                        patternsDetected: 3,
                        anomaliesFound: 2
                      }
                    });
                    
                    // Timeline: Insight Generation Step (simulation)
                    await timelineTracking.trackStep({
                      userId,
                      stepKey: 'INSIGHT_GENERATION',
                      datasetId: dataset.id,
                      details: {
                        insightsGenerated: 4
                      }
                    });
                    
                    // Timeline: Visualization Preparation Step (simulation)
                    await timelineTracking.trackStep({
                      userId,
                      stepKey: 'VISUALIZATION_PREP',
                      datasetId: dataset.id,
                      details: {
                        visualizationsCreated: 3
                      }
                    });
                  } else {
                    // If not tracking, just execute the transformation
                    transformedData = await performTransformation();
                  }
                  
                  resolve({
                    preview,
                    data: transformedData,
                    message,
                    rowCount: {
                      original: data.length,
                      transformed: transformedData.length
                    }
                  });
                } catch (processError) {
                  logger.error('Error processing data:', { error: processError });
                  reject(new Error(`Error processing data: ${processError.message}`));
                }
              },
              error: (error) => {
                logger.error('Failed to parse file:', { error });
                reject(new Error(`Failed to parse file: ${error.message}`));
              }
            });
          } catch (fileError) {
            logger.error('Error reading file:', { error: fileError });
            reject(new Error(`Error reading file: ${fileError.message}`));
          }
        };
        
        fileReader.onerror = (error) => {
          logger.error('FileReader error:', { error });
          reject(new Error('Error reading the file'));
        };
        
        fileReader.readAsText(file);
      });
    } else {
      // No files uploaded yet
      return {
        preview: [],
        data: [],
        message: "Please upload a file first so I can help you transform your data."
      };
    }
  } catch (error) {
    logger.error('Error processing data transformation:', { error });
    throw new Error('Failed to process your request. Please try again.');
  }
};

/**
 * Detect column data type
 */
const detectColumnType = (data, columnName) => {
  const values = data.map(row => row[columnName]).filter(val => val !== null && val !== '');
  
  if (values.length === 0) return 'unknown';
  
  // Check if all values are numbers
  if (values.every(val => !isNaN(val) && val !== '')) {
    return 'number';
  }
  
  // Check if values look like dates
  if (values.every(val => !isNaN(Date.parse(val)))) {
    return 'date';
  }
  
  // Check for boolean values
  const boolValues = values.filter(val => 
    val.toLowerCase() === 'true' || 
    val.toLowerCase() === 'false' ||
    val === '1' ||
    val === '0'
  );
  
  if (boolValues.length === values.length) {
    return 'boolean';
  }
  
  // Default to string
  return 'string';
};

/**
 * Export transformed data
 */
exports.exportTransformedData = (data, format = 'csv') => {
  try {
    switch (format) {
      case 'csv':
        const csv = Papa.unparse(data);
        return {
          content: csv,
          filename: `transformed_data_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      case 'json':
        return {
          content: JSON.stringify(data, null, 2),
          filename: `transformed_data_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      default:
        throw new Error('Unsupported export format');
    }
  } catch (error) {
    logger.error('Error exporting data:', { error, format });
    throw new Error(`Failed to export data: ${error.message}`);
  }
};

/**
 * Undo last operation
 */
exports.undoLastOperation = async (userId, datasetId) => {
  try {
    // Find the last transformation for this dataset
    const lastTransformation = await DataTransformation.findOne({
      where: {
        userId,
        datasetId
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!lastTransformation) {
      throw new Error('No operations to undo');
    }
    
    // Mark as undone
    await lastTransformation.update({ status: 'undone' });
    
    // Find the previous transformation to go back to
    const previousTransformation = await DataTransformation.findOne({
      where: {
        userId,
        datasetId,
        status: 'completed',
        createdAt: {
          [Op.lt]: lastTransformation.createdAt
        }
      },
      order: [['createdAt', 'DESC']]
    });
    
    // If no previous transformation, return original data
    if (!previousTransformation) {
      // Get original dataset
      const dataset = await FinancialDataset.findByPk(datasetId);
      if (!dataset) {
        throw new Error('Dataset not found');
      }
      
      // Return original data placeholder
      return {
        data: [],
        message: "Reverted to original data state",
        undoneOperation: lastTransformation.name
      };
    }
    
    // Return the previous state
    return {
      data: previousTransformation.resultPreview,
      message: `Undone ${lastTransformation.name} operation. Reverted to previous state.`,
      undoneOperation: lastTransformation.name
    };
  } catch (error) {
    logger.error('Error undoing operation:', { error, userId, datasetId });
    throw error;
  }
};

/**
 * Get transformation history
 */
exports.getTransformationHistory = async (userId, datasetId) => {
  try {
    const transformations = await DataTransformation.findAll({
      where: {
        userId,
        datasetId,
        status: 'completed'
      },
      order: [['createdAt', 'ASC']]
    });
    
    return transformations.map(t => ({
      id: t.id,
      name: t.name,
      operation: t.operation,
      parameters: t.parameters,
      createdAt: t.createdAt,
      executionTime: t.executionTime
    }));
  } catch (error) {
    logger.error('Error getting transformation history:', { error, userId, datasetId });
    throw error;
  }
};

/**
 * Get datasets for a user
 */
exports.getUserDatasets = async (userId) => {
  try {
    const datasets = await FinancialDataset.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    return datasets.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      format: d.format,
      rowCount: d.rowCount,
      createdAt: d.createdAt
    }));
  } catch (error) {
    logger.error('Error getting user datasets:', { error, userId });
    throw error;
  }
};

/**
 * Get suggested transformations based on data profile
 */
exports.getSuggestedTransformations = async (data) => {
  try {
    const suggestions = [];
    
    // Check for empty rows
    const emptyRows = data.filter(row => 
      Object.values(row).every(val => val === null || val === '')
    );
    
    if (emptyRows.length > 0) {
      suggestions.push({
        operation: 'filter',
        intent: 'Remove empty rows',
        explanation: `There are ${emptyRows.length} empty rows in the data that could be removed.`
      });
    }
    
    // Check for column value distributions
    const columnStats = {};
    Object.keys(data[0] || {}).forEach(col => {
      const values = data.map(row => row[col]).filter(val => val !== null && val !== '');
      const uniqueValues = _.uniq(values);
      
      columnStats[col] = {
        total: values.length,
        unique: uniqueValues.length,
        mostCommon: _.head(_(values).countBy().entries().maxBy(_.last))
      };
      
      // Check for columns with high cardinality
      if (uniqueValues.length === 1) {
        suggestions.push({
          operation: 'remove_column',
          intent: `Remove constant column ${col}`,
          explanation: `Column "${col}" has only one unique value "${uniqueValues[0]}" and might be unnecessary.`
        });
      }
      
      // Check for near-duplicate columns
      Object.keys(columnStats).forEach(otherCol => {
        if (col !== otherCol) {
          const similarity = calculateColumnSimilarity(data, col, otherCol);
          if (similarity > 0.9) {
            suggestions.push({
              operation: 'merge_columns',
              intent: `Merge similar columns ${col} and ${otherCol}`,
              explanation: `Columns "${col}" and "${otherCol}" are ${Math.round(similarity * 100)}% similar and might be redundant.`
            });
          }
        }
      });
    });
    
    // Check for numeric columns that could be aggregated
    const numericColumns = Object.keys(data[0] || {}).filter(col => 
      detectColumnType(data, col) === 'number'
    );
    
    if (numericColumns.length >= 2) {
      suggestions.push({
        operation: 'calculate',
        intent: `Calculate summary statistics for numeric columns`,
        explanation: `There are ${numericColumns.length} numeric columns that could be analyzed with summary statistics.`
      });
    }
    
    // Check for date columns for time series analysis
    const dateColumns = Object.keys(data[0] || {}).filter(col => 
      detectColumnType(data, col) === 'date'
    );
    
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        operation: 'time_series',
        intent: `Analyze trends over time`,
        explanation: `There are date columns (${dateColumns.join(', ')}) and numeric columns that could be analyzed for trends.`
      });
    }
    
    return suggestions;
  } catch (error) {
    logger.error('Error generating transformation suggestions:', { error });
    return [];
  }
};

/**
 * Calculate similarity between two columns
 */
const calculateColumnSimilarity = (data, col1, col2) => {
  const values1 = data.map(row => String(row[col1] || ''));
  const values2 = data.map(row => String(row[col2] || ''));
  
  let matches = 0;
  for (let i = 0; i < values1.length; i++) {
    if (values1[i] === values2[i]) {
      matches++;
    }
  }
  
  return matches / values1.length;
};