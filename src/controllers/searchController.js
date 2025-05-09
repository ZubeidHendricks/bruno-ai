const { Sequelize } = require('sequelize');
const models = require('../database/models');

// Search across datasets, transformations, and documents
const search = async (req, res) => {
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
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Search failed' : error.message,
      requestId: req.id
    });
  }
};

module.exports = {
  search
};
