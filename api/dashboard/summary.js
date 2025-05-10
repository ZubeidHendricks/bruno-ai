// Vercel serverless function for dashboard summary
const cors = require('../../api-vercel/middleware/cors');
const auth = require('../../api-vercel/middleware/auth');
const errorHandler = require('../../api-vercel/middleware/errorHandler');
const { sequelize } = require('../../api-vercel/config/database');
require('dotenv').config();

module.exports = async (req, res) => {
  // Handle CORS
  if (cors(req, res)) return;

  // Authenticate user
  if (!auth(req, res)) return;

  // Only accept GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from token
    const userId = req.user.id;

    // Sample dashboard data - replace with actual queries
    const dashboardData = {
      user: req.user,
      stats: {
        datasets: 5,
        transformations: 12,
        insights: 8,
        lastActivity: new Date().toISOString()
      },
      recentActivity: [
        {
          id: 1,
          action: 'Uploaded dataset',
          date: new Date(Date.now() - 3600000).toISOString(),
          details: 'Sales_Q1_2025.xlsx'
        },
        {
          id: 2,
          action: 'Created transformation',
          date: new Date(Date.now() - 7200000).toISOString(),
          details: 'Sales by Region'
        },
        {
          id: 3,
          action: 'Generated forecast',
          date: new Date(Date.now() - 86400000).toISOString(),
          details: 'Revenue Forecast Q2 2025'
        }
      ],
      keyMetrics: [
        {
          name: 'Total Revenue',
          value: '$1,245,000',
          change: '+5.7%',
          trend: 'up'
        },
        {
          name: 'Customer Acquisition Cost',
          value: '$482',
          change: '-2.3%',
          trend: 'down'
        },
        {
          name: 'Average Deal Size',
          value: '$28,350',
          change: '+1.2%',
          trend: 'up'
        }
      ]
    };

    // Return dashboard data
    res.status(200).json(dashboardData);
  } catch (error) {
    errorHandler(error, res);
  }
};
