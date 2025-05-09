const { Sequelize } = require('sequelize');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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
      
      // Mock revenue trend data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      const revenueTrend = months.map(month => ({
        month,
        revenue: 40000 + Math.random() * 45000
      }));
      
      // Mock expenses by category data
      const expensesByCategory = [
        { name: 'Salaries', value: 120000, color: '#3b82f6' },
        { name: 'Marketing', value: 45000, color: '#10b981' },
        { name: 'Equipment', value: 25000, color: '#f59e0b' },
        { name: 'Rent', value: 18000, color: '#ef4444' },
        { name: 'Other', value: 7677, color: '#6366f1' }
      ];
      
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
      return res.status(200).json({
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
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
};
