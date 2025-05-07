const weaviate = require('weaviate-ts-client');
const OpenAI = require('openai');
const { retry, batchProcess } = require('../utils/retryUtil');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

// Weaviate configuration
const weaviateConfig = {
  scheme: process.env.WEAVIATE_SCHEME || 'http',
  host: process.env.WEAVIATE_HOST || 'localhost:8080',
};

// Connection management
let clientInstance = null;

/**
 * Get Weaviate client with connection pooling
 */
const getClient = async () => {
  if (clientInstance) {
    return clientInstance;
  }

  try {
    logger.info('Initializing Weaviate client connection');
    clientInstance = weaviate.client(weaviateConfig);
    
    // Test connection
    await clientInstance.schema.getter().do();
    logger.info('Weaviate connection established successfully');
    
    return clientInstance;
  } catch (error) {
    logger.error('Error connecting to Weaviate:', { error });
    clientInstance = null;
    throw new Error(`Failed to connect to Weaviate: ${error.message}`);
  }
};

/**
 * Initialize financial schema in Weaviate with error handling and retries
 */
exports.initializeFinancialSchema = async () => {
  try {
    const client = await getClient();

    // Retry the operation with exponential backoff
    return await retry(async () => {
      // Check if class already exists
      const exists = await client.schema.exists('FinancialDocument');
      if (exists) {
        logger.info('FinancialDocument class already exists');
        return true;
      }

      const classObj = {
        class: 'FinancialDocument',
        description: 'Financial documents and transactions',
        vectorizer: 'none', // We'll provide our own vectors
        properties: [
          {
            name: 'content',
            dataType: ['text'],
            description: 'The content of the financial document'
          },
          {
            name: 'documentType',
            dataType: ['string'],
            description: 'Type of financial document (invoice, statement, etc.)'
          },
          {
            name: 'amount',
            dataType: ['number'],
            description: 'Monetary amount associated with the document'
          },
          {
            name: 'date',
            dataType: ['date'],
            description: 'Date of the transaction or document'
          },
          {
            name: 'category',
            dataType: ['string'],
            description: 'Financial category (revenue, expense, etc.)'
          },
          {
            name: 'entities',
            dataType: ['string[]'],
            description: 'Extracted entities like company names, accounts, etc.'
          },
          {
            name: 'userId',
            dataType: ['string'],
            description: 'ID of the user who owns this document'
          },
          {
            name: 'metadata',
            dataType: ['object'],
            description: 'Additional metadata about the document'
          }
        ]
      };

      await client.schema.classCreator().withClass(classObj).do();
      logger.info('FinancialDocument class created successfully');
      return true;
    }, 3, 1000);
  } catch (error) {
    logger.error('Failed to initialize schema after retries:', { error });
    throw error;
  }
};

/**
 * Initialize financial metrics schema in Weaviate
 */
exports.initializeFinancialMetricsSchema = async () => {
  try {
    const client = await getClient();

    return await retry(async () => {
      // Check if class already exists
      const exists = await client.schema.exists('FinancialMetric');
      if (exists) {
        logger.info('FinancialMetric class already exists');
        return true;
      }

      const classObj = {
        class: 'FinancialMetric',
        description: 'Financial metrics and KPIs',
        vectorizer: 'none',
        properties: [
          {
            name: 'name',
            dataType: ['string'],
            description: 'Name of the financial metric'
          },
          {
            name: 'description',
            dataType: ['text'],
            description: 'Description of what the metric represents'
          },
          {
            name: 'value',
            dataType: ['number'],
            description: 'Current value of the metric'
          },
          {
            name: 'unit',
            dataType: ['string'],
            description: 'Unit of measurement (%, $, etc.)'
          },
          {
            name: 'period',
            dataType: ['string'],
            description: 'Time period the metric covers'
          },
          {
            name: 'category',
            dataType: ['string'],
            description: 'Category of the metric (profitability, liquidity, etc.)'
          },
          {
            name: 'trend',
            dataType: ['number'],
            description: 'Trend direction and magnitude'
          },
          {
            name: 'userId',
            dataType: ['string'],
            description: 'ID of the user who owns this metric'
          }
        ]
      };

      await client.schema.classCreator().withClass(classObj).do();
      logger.info('FinancialMetric class created successfully');
      return true;
    }, 3, 1000);
  } catch (error) {
    logger.error('Failed to initialize metrics schema after retries:', { error });
    throw error;
  }
};

/**
 * Generate embeddings for financial text with caching
 */
const embeddingCache = new Map();

exports.generateFinancialEmbedding = async (text) => {
  // Simple hash function for caching
  const generateHash = (data) => {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  };
  
  const hash = generateHash(text);
  
  // Check cache
  if (embeddingCache.has(hash)) {
    logger.debug('Using cached embedding for text');
    return embeddingCache.get(hash);
  }
  
  try {
    return await retry(async () => {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });
      
      const embedding = response.data[0].embedding;
      
      // Cache the result (limit cache size)
      if (embeddingCache.size > 1000) {
        // Remove a random key
        const keys = Array.from(embeddingCache.keys());
        embeddingCache.delete(keys[0]);
      }
      embeddingCache.set(hash, embedding);
      
      return embedding;
    }, 3, 1000);
  } catch (error) {
    logger.error('Error generating embedding:', { error });
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Store financial document in vector database with batch support
 */
exports.storeFinancialDocument = async (document) => {
  try {
    const client = await getClient();
    
    // Generate embedding for the document content
    const embedding = await exports.generateFinancialEmbedding(document.content);
    
    // Create the document object for Weaviate
    const documentObject = {
      class: 'FinancialDocument',
      properties: {
        content: document.content,
        documentType: document.documentType || 'unknown',
        amount: document.amount || null,
        date: document.date || null,
        category: document.category || null,
        entities: document.entities || [],
        userId: document.userId || null,
        metadata: document.metadata || {}
      },
      vector: embedding
    };
    
    // Store in Weaviate
    const result = await retry(async () => {
      return client.data.creator()
        .withClassName('FinancialDocument')
        .withProperties(documentObject.properties)
        .withVector(documentObject.vector)
        .do();
    }, 3, 1000);
    
    logger.info(`Document stored with ID: ${result.id}`);
    return result;
  } catch (error) {
    logger.error('Error storing document:', { error });
    throw new Error(`Failed to store document: ${error.message}`);
  }
};

/**
 * Store multiple financial documents in batch
 */
exports.storeBatchDocuments = async (documents) => {
  try {
    // Process documents in batches
    return await batchProcess(documents, exports.storeFinancialDocument, {
      batchSize: 10,
      concurrency: 3,
      delayBetweenBatches: 1000
    });
  } catch (error) {
    logger.error('Error in batch document storage:', { error });
    throw error;
  }
};

/**
 * Search for similar financial documents
 */
exports.searchSimilarDocuments = async (query, limit = 5, filters = {}) => {
  try {
    const client = await getClient();
    
    // Generate embedding for the query
    const queryEmbedding = await exports.generateFinancialEmbedding(query);
    
    // Build filter based on provided criteria
    let whereFilter = null;
    
    if (Object.keys(filters).length > 0) {
      const filterConditions = [];
      
      if (filters.userId) {
        filterConditions.push({
          path: ["userId"],
          operator: "Equal",
          valueString: filters.userId
        });
      }
      
      if (filters.documentType) {
        filterConditions.push({
          path: ["documentType"],
          operator: "Equal",
          valueString: filters.documentType
        });
      }
      
      if (filters.category) {
        filterConditions.push({
          path: ["category"],
          operator: "Equal",
          valueString: filters.category
        });
      }
      
      if (filters.dateFrom && filters.dateTo) {
        filterConditions.push({
          path: ["date"],
          operator: "GreaterThanEqual",
          valueDate: filters.dateFrom
        });
        
        filterConditions.push({
          path: ["date"],
          operator: "LessThanEqual",
          valueDate: filters.dateTo
        });
      }
      
      whereFilter = {
        operator: "And",
        operands: filterConditions
      };
    }
    
    // Search Weaviate
    const result = await retry(async () => {
      const graphqlQuery = client.graphql
        .get()
        .withClassName('FinancialDocument')
        .withFields('content documentType amount date category entities userId metadata _additional { certainty }')
        .withNearVector({
          vector: queryEmbedding,
          certainty: 0.7
        })
        .withLimit(limit);
      
      // Add filter if specified
      if (whereFilter) {
        graphqlQuery.withWhere(whereFilter);
      }
      
      return graphqlQuery.do();
    }, 3, 1000);
    
    return result.data.Get.FinancialDocument;
  } catch (error) {
    logger.error('Error searching documents:', { error });
    throw error;
  }
};

/**
 * Extract financial entities from text
 */
exports.extractFinancialEntities = async (text) => {
  try {
    const systemPrompt = `You are a financial entity extraction system. Extract key financial entities from the following text including:
    - Company names
    - Account numbers
    - Monetary amounts
    - Dates
    - Categories (income, expense, asset, liability)
    
    Return the result as a JSON object with these keys: companies, accounts, amounts, dates, categories.`;
    
    const response = await retry(async () => {
      return openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      });
    }, 3, 1000);
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error('Error extracting entities:', { error });
    throw error;
  }
};

/**
 * Get financial insights from stored documents
 */
exports.getFinancialInsights = async (query, context = null, userId = null) => {
  try {
    // Search for relevant documents
    const filters = userId ? { userId } : {};
    const relevantDocs = await exports.searchSimilarDocuments(query, 5, filters);
    
    // Prepare context for insights generation
    const docsContext = relevantDocs.map(doc => 
      `Document Type: ${doc.documentType}
      Amount: ${doc.amount}
      Category: ${doc.category}
      Content: ${doc.content}`
    ).join('\n\n');
    
    const systemPrompt = `You are a financial intelligence assistant. Based on the following financial documents and context, provide insights, trends, and recommendations.`;
    
    const userPrompt = `
    Query: ${query}
    
    Relevant Documents:
    ${docsContext}
    
    ${context ? `Additional Context: ${context}` : ''}
    
    Please provide:
    1. Key insights based on the data
    2. Any trends you notice
    3. Recommendations for action
    4. Potential risks or opportunities
    `;
    
    const response = await retry(async () => {
      return openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
    }, 3, 1000);
    
    return response.choices[0].message.content;
  } catch (error) {
    logger.error('Error generating insights:', { error });
    throw error;
  }
};

/**
 * Update document metadata
 */
exports.updateDocumentMetadata = async (documentId, metadata) => {
  try {
    const client = await getClient();
    
    const result = await retry(async () => {
      return client.data.merger()
        .withId(documentId)
        .withClassName('FinancialDocument')
        .withProperties(metadata)
        .do();
    }, 3, 1000);
    
    return result;
  } catch (error) {
    logger.error('Error updating document:', { error });
    throw error;
  }
};

/**
 * Delete document from vector database
 */
exports.deleteDocument = async (documentId) => {
  try {
    const client = await getClient();
    
    await retry(async () => {
      await client.data.deleter()
        .withId(documentId)
        .withClassName('FinancialDocument')
        .do();
    }, 3, 1000);
    
    logger.info(`Document deleted: ${documentId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting document:', { error });
    throw error;
  }
};

/**
 * Check Weaviate health status
 */
exports.checkHealth = async () => {
  try {
    const client = await getClient();
    
    const result = await retry(async () => {
      return client.misc.metaGetter().do();
    }, 3, 1000);
    
    return {
      status: 'healthy',
      version: result.version,
      hostname: weaviateConfig.host
    };
  } catch (error) {
    logger.error('Weaviate health check failed:', { error });
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};