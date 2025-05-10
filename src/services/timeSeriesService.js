/**
 * Time Series Service
 * Main entry point for time series analysis and forecasting
 */
const logger = require('../utils/logger');
const timeSeriesAnalyzer = require('./timeSeries/timeSeriesAnalyzer');
const timeSeriesForecaster = require('./timeSeries/timeSeriesForecaster');
const timeSeriesDecomposer = require('./timeSeries/timeSeriesDecomposer');
const timeSeriesInsightGenerator = require('./timeSeries/timeSeriesInsightGenerator');
const timeSeriesVisualizer = require('./timeSeries/timeSeriesVisualizer');

/**
 * Analyze time series data with multiple forecasting methods
 * @param {Array} data - Array of data points with time and value fields
 * @param {string} timeColumn - Name of the column containing time data
 * @param {string} valueColumn - Name of the column containing value data
 * @param {Object} options - Additional options for analysis
 * @returns {Object} - Analysis results with forecasts
 */
exports.analyzeTimeSeries = async (data, timeColumn, valueColumn, options = {}) => {
  try {
    // Validate input data
    if (!data || !Array.isArray(data) || data.length < 5) {
      throw new Error('Insufficient data points for time series analysis. Minimum 5 points required.');
    }
    
    if (!timeColumn || !valueColumn) {
      throw new Error('Time and value columns must be specified.');
    }
    
    logger.info('Starting time series analysis', { 
      dataPoints: data.length, 
      timeColumn, 
      valueColumn 
    });
    
    // 1. Analyze basic time series properties
    const analysis = await timeSeriesAnalyzer.analyzeTimeSeries(data, timeColumn, valueColumn);
    
    // 2. Generate forecasts using multiple methods
    const forecasts = await timeSeriesForecaster.generateForecasts(
      analysis.timeValues,
      analysis.values,
      analysis.frequency,
      options
    );
    
    // 3. Decompose time series
    const decomposition = timeSeriesDecomposer.decomposeTimeSeries(
      analysis.timeValues,
      analysis.values,
      analysis.frequency
    );
    
    // 4. Generate insights
    const insights = await timeSeriesInsightGenerator.generateInsights({
      data,
      timeColumn,
      valueColumn,
      trend: analysis.trend,
      seasonality: analysis.seasonality,
      anomalies: analysis.anomalies,
      changePoints: analysis.changePoints,
      forecasts,
      decomposition
    });
    
    // 5. Create visualization specifications
    const visualizations = timeSeriesVisualizer.generateChartSpecs({
      data,
      timeColumn, 
      valueColumn,
      analysis,
      forecasts,
      decomposition
    });
    
    // Return comprehensive results
    return {
      frequency: analysis.frequency,
      trend: analysis.trend,
      seasonality: analysis.seasonality,
      anomalies: analysis.anomalies,
      changePoints: analysis.changePoints,
      decomposition,
      forecasts,
      insights,
      visualizations,
      metadata: {
        dataPoints: analysis.values.length,
        startDate: analysis.timeValues[0],
        endDate: analysis.timeValues[analysis.timeValues.length - 1],
        minValue: analysis.metadata.minValue,
        maxValue: analysis.metadata.maxValue,
        meanValue: analysis.metadata.meanValue,
        medianValue: analysis.metadata.medianValue
      }
    };
  } catch (error) {
    logger.error('Error analyzing time series:', { error });
    throw error;
  }
};

/**
 * Forecast time series data into the future
 * @param {Array} data - Array of data points with time and value fields
 * @param {string} timeColumn - Name of the column containing time data
 * @param {string} valueColumn - Name of the column containing value data 
 * @param {number} horizon - Number of periods to forecast
 * @param {string} method - Forecasting method to use
 * @param {Object} options - Additional forecasting options
 * @returns {Object} - Forecast results
 */
exports.forecastTimeSeries = async (data, timeColumn, valueColumn, horizon, method = 'auto', options = {}) => {
  try {
    // Validate input data
    if (!data || !Array.isArray(data) || data.length < 5) {
      throw new Error('Insufficient data points for forecasting. Minimum 5 points required.');
    }
    
    logger.info('Starting time series forecasting', { 
      dataPoints: data.length, 
      timeColumn, 
      valueColumn,
      horizon,
      method 
    });
    
    // 1. Perform basic analysis first to get frequencies and patterns
    const analysis = await timeSeriesAnalyzer.analyzeTimeSeries(data, timeColumn, valueColumn);
    
    // 2. Generate forecasts with the specified method or auto-select
    const forecasts = await timeSeriesForecaster.generateForecasts(
      analysis.timeValues,
      analysis.values,
      analysis.frequency,
      { ...options, horizon, method }
    );
    
    // 3. Generate confidence intervals for the forecasts
    const forecastsWithConfidence = timeSeriesForecaster.generateConfidenceIntervals(
      analysis.values,
      forecasts,
      options.confidenceLevel || 0.95
    );
    
    // 4. Generate visual specifications for the forecast
    const visualizations = timeSeriesVisualizer.generateForecastCharts({
      data,
      timeColumn,
      valueColumn,
      forecasts: forecastsWithConfidence
    });
    
    return {
      forecasts: forecastsWithConfidence,
      visualizations,
      metadata: {
        method: method === 'auto' ? forecasts.bestMethod : method,
        horizon,
        startDate: analysis.timeValues[0],
        endDate: analysis.timeValues[analysis.timeValues.length - 1],
        forecastStartDate: forecastsWithConfidence.horizonDates[0],
        forecastEndDate: forecastsWithConfidence.horizonDates[forecastsWithConfidence.horizonDates.length - 1]
      }
    };
  } catch (error) {
    logger.error('Error forecasting time series:', { error });
    throw error;
  }
};

/**
 * Compare multiple time series datasets
 * @param {Array} datasets - Array of dataset objects, each with data, timeColumn, valueColumn
 * @param {Object} options - Comparison options
 * @returns {Object} - Comparison results
 */
exports.compareTimeSeries = async (datasets, options = {}) => {
  try {
    if (!datasets || !Array.isArray(datasets) || datasets.length < 2) {
      throw new Error('At least two datasets are required for comparison.');
    }
    
    logger.info('Starting time series comparison', { 
      datasetCount: datasets.length
    });
    
    // 1. Analyze each dataset separately
    const analyses = [];
    for (const dataset of datasets) {
      const analysis = await timeSeriesAnalyzer.analyzeTimeSeries(
        dataset.data, 
        dataset.timeColumn, 
        dataset.valueColumn
      );
      analyses.push({
        name: dataset.name || `Series ${analyses.length + 1}`,
        analysis
      });
    }
    
    // 2. Compare trends, seasonality, and other metrics
    const comparison = {
      trendComparison: compareTrends(analyses),
      seasonalityComparison: compareSeasonality(analyses),
      correlationMatrix: calculateCorrelationMatrix(datasets)
    };
    
    // 3. Generate visualizations for comparison
    const visualizations = timeSeriesVisualizer.generateComparisonCharts(datasets, comparison);
    
    // 4. Generate insights about the comparison
    const insights = await timeSeriesInsightGenerator.generateComparisonInsights(datasets, comparison);
    
    return {
      datasets: analyses.map(item => ({
        name: item.name,
        frequency: item.analysis.frequency,
        trend: item.analysis.trend,
        seasonality: item.analysis.seasonality
      })),
      comparison,
      visualizations,
      insights
    };
  } catch (error) {
    logger.error('Error comparing time series:', { error });
    throw error;
  }
};

/**
 * Detect anomalies in time series data with various methods
 * @param {Array} data - Array of data points with time and value fields
 * @param {string} timeColumn - Name of the column containing time data
 * @param {string} valueColumn - Name of the column containing value data
 * @param {Object} options - Anomaly detection options
 * @returns {Object} - Detected anomalies
 */
exports.detectAnomalies = async (data, timeColumn, valueColumn, options = {}) => {
  try {
    // Validate input data
    if (!data || !Array.isArray(data) || data.length < 10) {
      throw new Error('Insufficient data points for anomaly detection. Minimum 10 points required.');
    }
    
    logger.info('Starting anomaly detection', { 
      dataPoints: data.length, 
      timeColumn, 
      valueColumn,
      method: options.method || 'statistical'
    });
    
    // 1. Analyze the time series first
    const analysis = await timeSeriesAnalyzer.analyzeTimeSeries(data, timeColumn, valueColumn);
    
    // 2. Detect anomalies using the specified method
    let anomalies;
    switch (options.method || 'statistical') {
      case 'statistical':
        anomalies = timeSeriesAnalyzer.detectAnomaliesStatistical(
          analysis.timeValues,
          analysis.values,
          options.threshold || 3 // Default Z-score threshold
        );
        break;
      case 'iqr':
        anomalies = timeSeriesAnalyzer.detectAnomaliesIQR(
          analysis.timeValues,
          analysis.values,
          options.multiplier || 1.5 // Default IQR multiplier
        );
        break;
      case 'moving_average':
        anomalies = timeSeriesAnalyzer.detectAnomaliesMovingAverage(
          analysis.timeValues,
          analysis.values,
          options.window || 5, // Default window size
          options.threshold || 2 // Default threshold
        );
        break;
      default:
        anomalies = timeSeriesAnalyzer.detectAnomaliesStatistical(
          analysis.timeValues,
          analysis.values,
          options.threshold || 3
        );
    }
    
    // 3. Generate visualizations for anomalies
    const visualizations = timeSeriesVisualizer.generateAnomalyCharts({
      data,
      timeColumn,
      valueColumn,
      anomalies
    });
    
    return {
      anomalies,
      visualizations,
      metadata: {
        method: options.method || 'statistical',
        totalAnomalies: anomalies.length,
        anomalyPercentage: (anomalies.length / data.length) * 100
      }
    };
  } catch (error) {
    logger.error('Error detecting anomalies:', { error });
    throw error;
  }
};

// Helper functions for comparison

/**
 * Compare trends between time series datasets
 * @param {Array} analyses - Array of analysis results
 * @returns {Object} - Trend comparison results
 */
const compareTrends = (analyses) => {
  const trends = analyses.map(a => a.analysis.trend);
  
  return {
    directions: trends.map(t => t.type),
    strengths: trends.map(t => t.strength),
    slopes: trends.map(t => t.slope),
    similarDirections: new Set(trends.map(t => t.type)).size === 1,
    maxDifference: Math.max(...trends.map(t => t.slope)) - Math.min(...trends.map(t => t.slope))
  };
};

/**
 * Compare seasonality between time series datasets
 * @param {Array} analyses - Array of analysis results
 * @returns {Object} - Seasonality comparison results
 */
const compareSeasonality = (analyses) => {
  const seasonalities = analyses.map(a => a.analysis.seasonality);
  
  return {
    detected: seasonalities.map(s => s.detected),
    periods: seasonalities.map(s => s.period),
    strengths: seasonalities.map(s => s.strength),
    similarPatterns: new Set(seasonalities.map(s => s.period)).size === 1,
    allSeasonal: seasonalities.every(s => s.detected)
  };
};

/**
 * Calculate correlation matrix between time series datasets
 * @param {Array} datasets - Array of dataset objects
 * @returns {Array} - Correlation matrix
 */
const calculateCorrelationMatrix = (datasets) => {
  const n = datasets.length;
  const matrix = Array(n).fill().map(() => Array(n).fill(0));
  
  // Calculate correlation for each pair of datasets
  for (let i = 0; i < n; i++) {
    // Self-correlation is always 1
    matrix[i][i] = 1;
    
    for (let j = i + 1; j < n; j++) {
      // Extract values for both datasets
      const iValues = datasets[i].data.map(row => parseFloat(row[datasets[i].valueColumn])).filter(val => !isNaN(val));
      const jValues = datasets[j].data.map(row => parseFloat(row[datasets[j].valueColumn])).filter(val => !isNaN(val));
      
      // Use the minimum length
      const minLength = Math.min(iValues.length, jValues.length);
      
      if (minLength < 5) {
        // Not enough data points for correlation
        matrix[i][j] = matrix[j][i] = null;
        continue;
      }
      
      // Calculate correlation
      const correlation = calculateCorrelation(
        iValues.slice(0, minLength),
        jValues.slice(0, minLength)
      );
      
      matrix[i][j] = matrix[j][i] = correlation;
    }
  }
  
  return matrix;
};

/**
 * Calculate correlation coefficient between two arrays
 * @param {Array} x - First array of values
 * @param {Array} y - Second array of values
 * @returns {number} - Correlation coefficient
 */
const calculateCorrelation = (x, y) => {
  const n = x.length;
  
  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate numerator and denominators
  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }
  
  if (xDenom === 0 || yDenom === 0) {
    return 0;
  }
  
  return numerator / Math.sqrt(xDenom * yDenom);
};
