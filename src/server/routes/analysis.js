const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const financialAnalysisService = require('../../services/financialAnalysisService');
const logger = require('../../utils/logger');

/**
 * Analyze financial trends
 */
router.post('/trends', authenticate, async (req, res) => {
  try {
    const { data, timeColumn, valueColumn } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Valid data array is required' });
    }
    
    if (!timeColumn || !valueColumn) {
      return res.status(400).json({ error: 'Time and value columns are required' });
    }
    
    const trends = financialAnalysisService.analyzeFinancialTrends(data, timeColumn, valueColumn);
    
    res.json({
      success: true,
      trends
    });
  } catch (error) {
    logger.error('Error analyzing trends:', { error });
    res.status(500).json({
      error: 'Trend analysis failed',
      message: error.message
    });
  }
});

/**
 * Generate financial insights
 */
router.post('/insights', authenticate, async (req, res) => {
  try {
    const { data, metrics } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Financial data is required' });
    }
    
    const insights = await financialAnalysisService.generateFinancialInsights(data, metrics);
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    logger.error('Error generating insights:', { error });
    res.status(500).json({
      error: 'Insight generation failed',
      message: error.message
    });
  }
});

/**
 * Analyze cash flow
 */
router.post('/cash-flow', authenticate, async (req, res) => {
  try {
    const { cashFlowData } = req.body;
    
    if (!cashFlowData) {
      return res.status(400).json({ error: 'Cash flow data is required' });
    }
    
    const analysis = financialAnalysisService.analyzeCashFlow(cashFlowData);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Error analyzing cash flow:', { error });
    res.status(500).json({
      error: 'Cash flow analysis failed',
      message: error.message
    });
  }
});

/**
 * Calculate financial ratios
 */
router.post('/ratios', authenticate, async (req, res) => {
  try {
    const { financialData } = req.body;
    
    if (!financialData) {
      return res.status(400).json({ error: 'Financial data is required' });
    }
    
    const ratios = financialAnalysisService.calculateFinancialRatios(financialData);
    
    res.json({
      success: true,
      ratios
    });
  } catch (error) {
    logger.error('Error calculating ratios:', { error });
    res.status(500).json({
      error: 'Ratio calculation failed',
      message: error.message
    });
  }
});

/**
 * Perform scenario analysis
 */
router.post('/scenarios', authenticate, async (req, res) => {
  try {
    const { baseScenario, scenarios } = req.body;
    
    if (!baseScenario || !scenarios || !Array.isArray(scenarios)) {
      return res.status(400).json({ error: 'Base scenario and scenarios array are required' });
    }
    
    const results = financialAnalysisService.performScenarioAnalysis(baseScenario, scenarios);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error('Error analyzing scenarios:', { error });
    res.status(500).json({
      error: 'Scenario analysis failed',
      message: error.message
    });
  }
});

/**
 * Analyze financial statements
 */
router.post('/statements', authenticate, async (req, res) => {
  try {
    const { statements } = req.body;
    
    if (!statements || typeof statements !== 'object') {
      return res.status(400).json({ error: 'Financial statements are required' });
    }
    
    const analysis = await financialAnalysisService.analyzeFinancialStatements(statements);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Error analyzing statements:', { error });
    res.status(500).json({
      error: 'Statement analysis failed',
      message: error.message
    });
  }
});

/**
 * Build financial dashboard
 */
router.post('/dashboard', authenticate, async (req, res) => {
  try {
    const { data, period } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Valid data array is required' });
    }
    
    const dashboard = financialAnalysisService.buildFinancialDashboard(data, period);
    
    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    logger.error('Error building dashboard:', { error });
    res.status(500).json({
      error: 'Dashboard building failed',
      message: error.message
    });
  }
});

module.exports = router;