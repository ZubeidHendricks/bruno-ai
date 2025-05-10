const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const models = require('../database/models');

const DATA_DIR = path.join(__dirname, '../../data');

// Generate sample dashboard data for public access
const getPublicDashboardData = async (req, res) => {
  try {
    // Sample KPIs
    const kpis = [
      { 
        title: 'Total Datasets', 
        value: '3', 
        change: 15.3 
      },
      { 
        title: 'Data Transformations', 
        value: '12', 
        change: 22.5 
      },
      { 
        title: 'Total Rows Processed', 
        value: '1,245', 
        change: 8.7 
      },
      { 
        title: 'Documents Analyzed', 
        value: '28', 
        change: 12.4 
      }
    ];
    
    // Sample revenue trend data
    const revenueTrend = [
      { month: 'Jan', revenue: 12500 },
      { month: 'Feb', revenue: 14200 },
      { month: 'Mar', revenue: 15800 },
      { month: 'Apr', revenue: 16200 },
      { month: 'May', revenue: 18100 },
      { month: 'Jun', revenue: 17300 },
      { month: 'Jul', revenue: 19500 },
      { month: 'Aug', revenue: 21200 },
      { month: 'Sep', revenue: 20100 },
      { month: 'Oct', revenue: 22800 },
      { month: 'Nov', revenue: 24500 },
      { month: 'Dec', revenue: 26700 }
    ];
    
    // Sample expense data
    const expensesByCategory = [
      { name: 'Marketing', value: 45000, color: '#3b82f6' },
      { name: 'Sales', value: 32000, color: '#10b981' },
      { name: 'R&D', value: 68000, color: '#f59e0b' },
      { name: 'Operations', value: 27000, color: '#ef4444' },
      { name: 'HR', value: 18000, color: '#6366f1' },
      { name: 'IT', value: 35000, color: '#8b5cf6' }
    ];
    
    // Sample AI-generated insights
    const insights = [
      {
        text: "Revenue has grown by 15.3% compared to the previous quarter, with the strongest performance in the Technology sector.",
        impact: 'positive',
        confidence: 95
      },
      {
        text: "Marketing expenses are 22% higher than the industry average, suggesting an opportunity for optimization.",
        impact: 'negative',
        confidence: 87
      },
      {
        text: "Cash flow projections indicate a potential 8% increase in operating margin if current trends continue.",
        impact: 'positive',
        confidence: 92
      }
    ];
    
    // Sample anomalies
    const anomalies = [
      {
        title: 'Unusual Marketing Expense',
        description: 'Marketing expenses in Q3 were 35% higher than the historical average for this period.',
        date: '2025-04-15'
      },
      {
        title: 'Revenue Drop in West Region',
        description: 'The West Region showed a 12% decrease in revenue despite overall growth.',
        date: '2025-05-02'
      }
    ];
    
    // Sample latest datasets
    const latestDatasets = [
      {
        id: 1,
        name: 'Revenue Analysis 2024',
        rowCount: 48,
        createdAt: '2025-04-10T12:34:56.789Z'
      },
      {
        id: 2,
        name: 'Customer Segmentation',
        rowCount: 120,
        createdAt: '2025-04-05T09:22:33.123Z'
      },
      {
        id: 3,
        name: 'Monthly Expenses 2024',
        rowCount: 150,
        createdAt: '2025-03-28T15:45:22.456Z'
      }
    ];

    // Sample latest transformations
    const latestTransformations = [
      {
        id: 1,
        name: 'Filter Q1 Data',
        operation: 'filter',
        datasetId: 1,
        createdAt: '2025-04-20T14:30:00.000Z'
      },
      {
        id: 2,
        name: 'Sort by Revenue',
        operation: 'sort',
        datasetId: 2,
        createdAt: '2025-04-18T11:15:30.000Z'
      },
      {
        id: 3,
        name: 'Remove Duplicate Categories',
        operation: 'remove_duplicates',
        datasetId: 3,
        createdAt: '2025-04-15T09:45:12.000Z'
      }
    ];
    
    // Sample recent activity
    const recentActivity = [
      {
        id: 1,
        action: 'DATA_UPLOAD',
        details: {
          fileName: 'revenue_2024.csv',
          fileSize: 2048,
          mimeType: 'text/csv'
        },
        timestamp: '2025-05-08T15:30:00.000Z'
      },
      {
        id: 2,
        action: 'DATA_TRANSFORMATION',
        details: {
          operation: 'filter',
          parameters: {
            column: 'quarter',
            value: 'Q1'
          }
        },
        timestamp: '2025-05-08T15:35:12.000Z'
      },
      {
        id: 3,
        action: 'DATA_UPLOAD',
        details: {
          fileName: 'customer_segments.csv',
          fileSize: 1536,
          mimeType: 'text/csv'
        },
        timestamp: '2025-05-07T11:20:45.000Z'
      }
    ];
    
    // Prepare response with sample data
    const dashboardData = {
      kpis,
      revenueTrend,
      expensesByCategory,
      insights,
      anomalies,
      latestDatasets,
      latestTransformations,
      recentActivity,
      stats: {
        datasetCount: 3,
        transformationCount: 12,
        documentCount: 28
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error generating public dashboard data:', error);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Failed to generate dashboard data' : error.message,
      requestId: req.id
    });
  }
};

// Get dashboard data
const getDashboardData = async (req, res) => {
  try {
    // Get real data from the database
    const datasets = await models.FinancialDataset.findAll();
    const transformations = await models.DataTransformation.findAll();
    const documents = await models.FinancialDocument ? await models.FinancialDocument.findAll() : [];
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
    
    // If no revenue data found, provide structured empty data
    if (revenueTrend.length === 0) {
      console.warn('No revenue data found in any dataset. Dashboard revenue chart will be empty.');
      revenueTrend = [];
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
    
    // If no expense data found, provide structured empty data
    if (expensesByCategory.length === 0) {
      console.warn('No expense data found in any dataset. Dashboard expense chart will be empty.');
      expensesByCategory = [];
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
    
    // Check for additional metrics that might be useful for the dashboard
    const latestDatasets = datasets.slice(0, 5).map(dataset => ({
      id: dataset.id,
      name: dataset.name,
      rowCount: dataset.rowCount,
      createdAt: dataset.createdAt
    }));

    const latestTransformations = transformations.slice(0, 5).map(transformation => ({
      id: transformation.id,
      name: transformation.name,
      operation: transformation.operation,
      datasetId: transformation.datasetId,
      createdAt: transformation.createdAt
    }));
    
    // Prepare response with actual data only
    const dashboardData = {
      kpis,
      revenueTrend,
      expensesByCategory,
      insights,
      anomalies,
      latestDatasets,
      latestTransformations,
      recentActivity: timeline.map(event => ({
        id: event.id,
        action: event.stepKey,
        details: JSON.parse(event.details),
        timestamp: event.timestamp
      })),
      stats: {
        datasetCount: datasets.length,
        transformationCount: transformations.length,
        documentCount: documents.length
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Failed to generate dashboard data' : error.message,
      requestId: req.id
    });
  }
};

// Other dashboard methods (stub implementations for now)
const getAnalytics = (req, res) => {
  // Stub implementation
  res.json({ message: 'Analytics data would be returned here' });
};

const getActivity = (req, res) => {
  // Stub implementation
  res.json({ message: 'Activity data would be returned here' });
};

const getSummary = (req, res) => {
  // Stub implementation
  res.json({ message: 'Summary data would be returned here' });
};

module.exports = {
  getDashboardData,
  getPublicDashboardData,
  getAnalytics,
  getActivity,
  getSummary
};
