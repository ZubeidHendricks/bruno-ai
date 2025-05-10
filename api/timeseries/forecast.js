// Vercel serverless function for time series forecasting
const cors = require('../../api-vercel/middleware/cors');
const auth = require('../../api-vercel/middleware/auth');
const errorHandler = require('../../api-vercel/middleware/errorHandler');
require('dotenv').config();

module.exports = async (req, res) => {
  // Handle CORS
  if (cors(req, res)) return;

  // Authenticate user
  if (!auth(req, res)) return;

  // Only accept POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeValues, values, frequency, options } = req.body;

    // Validate input
    if (!timeValues || !values || !Array.isArray(timeValues) || !Array.isArray(values)) {
      return res.status(400).json({ error: 'Valid time values and data values arrays are required' });
    }

    if (timeValues.length !== values.length) {
      return res.status(400).json({ error: 'Time values and data values arrays must have the same length' });
    }

    // Here you would implement actual forecasting logic
    // For now, return mock forecast data
    const horizon = options?.horizon || 6;
    const method = options?.method || 'auto';
    
    // Generate forecast dates (future dates)
    const lastDate = new Date(timeValues[timeValues.length - 1]);
    const forecastDates = [];
    for (let i = 1; i <= horizon; i++) {
      const newDate = new Date(lastDate);
      if (frequency === 'monthly') {
        newDate.setMonth(lastDate.getMonth() + i);
      } else if (frequency === 'weekly') {
        newDate.setDate(lastDate.getDate() + (i * 7));
      } else if (frequency === 'daily') {
        newDate.setDate(lastDate.getDate() + i);
      } else {
        // Default to monthly
        newDate.setMonth(lastDate.getMonth() + i);
      }
      forecastDates.push(newDate.toISOString().split('T')[0]);
    }

    // Generate forecast values (with slight upward trend and noise)
    const lastValue = values[values.length - 1];
    const forecastValues = [];
    for (let i = 1; i <= horizon; i++) {
      // Add some trend and noise for realistic forecasts
      const trend = lastValue * 0.02 * i;
      const noise = lastValue * 0.05 * (Math.random() - 0.5);
      forecastValues.push(Math.round(lastValue + trend + noise));
    }

    // Return results
    res.status(200).json({
      method,
      frequency,
      horizon,
      forecast: {
        dates: forecastDates,
        values: forecastValues
      },
      metrics: {
        mape: Math.round(Math.random() * 500) / 100, // Random MAPE between 0 and 5
        rmse: Math.round(Math.random() * lastValue * 0.2),
        mae: Math.round(Math.random() * lastValue * 0.15)
      },
      originalData: {
        dates: timeValues,
        values: values
      }
    });
  } catch (error) {
    errorHandler(error, res);
  }
};
