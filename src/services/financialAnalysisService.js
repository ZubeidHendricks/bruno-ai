const _ = require('lodash');
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { retry } = require('../utils/retryUtil');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

/**
 * Analyze financial trends in data
 */
exports.analyzeFinancialTrends = (data, timeColumn, valueColumn) => {
  try {
    // Sort data by time
    const sortedData = _.sortBy(data, timeColumn);
    
    // Calculate key metrics
    const values = sortedData.map(item => parseFloat(item[valueColumn])).filter(val => !isNaN(val));
    const periods = sortedData.map(item => item[timeColumn]);
    
    if (values.length < 2) {
      logger.warn('Insufficient data for trend analysis', { 
        dataPoints: values.length, 
        timeColumn, 
        valueColumn 
      });
      
      return {
        trend: 'unknown',
        growthRate: 0,
        volatility: 0,
        forecast: null,
        patterns: { seasonal: false, cycles: [], anomalies: [] },
        summary: 'Insufficient data for trend analysis.'
      };
    }
    
    // Calculate trend
    const averageGrowth = calculateGrowthRate(values);
    const volatility = calculateVolatility(values);
    const forecast = forecastNextPeriod(sortedData, valueColumn);
    
    // Detect patterns
    const patterns = detectPatterns(values);
    
    return {
      trend: averageGrowth > 0 ? 'upward' : 'downward',
      growthRate: averageGrowth,
      volatility,
      forecast,
      patterns,
      summary: generateTrendSummary(sortedData, valueColumn, averageGrowth, volatility)
    };
  } catch (error) {
    logger.error('Error analyzing trends:', { error });
    throw error;
  }
};

/**
 * Calculate growth rate between periods
 */
const calculateGrowthRate = (values) => {
  if (values.length < 2) return 0;
  
  let totalGrowth = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i-1] !== 0) {
      totalGrowth += (values[i] - values[i-1]) / values[i-1];
    }
  }
  
  return totalGrowth / (values.length - 1);
};

/**
 * Calculate data volatility
 */
const calculateVolatility = (values) => {
  const mean = _.mean(values);
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = _.mean(squaredDifferences);
  return Math.sqrt(variance);
};

/**
 * Simple forecasting using linear regression
 */
const forecastNextPeriod = (data, valueColumn) => {
  if (data.length < 2) return null;
  
  // Calculate simple linear regression
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  data.forEach((item, index) => {
    const y = parseFloat(item[valueColumn]);
    if (!isNaN(y)) {
      sumX += index;
      sumY += y;
      sumXY += index * y;
      sumXX += index * index;
    }
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const nextValue = slope * n + intercept;
  const confidence = calculateForecastConfidence(data, valueColumn, slope, intercept);
  
  return {
    value: nextValue,
    confidence,
    method: 'linear_regression'
  };
};

/**
 * Calculate forecast confidence
 */
const calculateForecastConfidence = (data, valueColumn, slope, intercept) => {
  const actuals = data.map(item => parseFloat(item[valueColumn])).filter(val => !isNaN(val));
  const predictions = _.range(actuals.length).map(index => slope * index + intercept);
  
  const mse = _.mean(actuals.map((actual, i) => Math.pow(actual - predictions[i], 2)));
  const rmse = Math.sqrt(mse);
  
  // Convert RMSE to confidence percentage (simplified)
  const meanActual = _.mean(actuals);
  const confidence = Math.max(0, Math.min(100, 100 - (rmse / meanActual) * 100));
  
  return Math.round(confidence);
};

/**
 * Detect patterns in financial data
 */
const detectPatterns = (values) => {
  const patterns = {
    seasonal: detectSeasonality(values),
    cycles: detectCycles(values),
    anomalies: detectAnomalies(values)
  };
  
  return patterns;
};

/**
 * Detect seasonal patterns
 */
const detectSeasonality = (values) => {
  // Simplified seasonality detection
  if (values.length < 12) return false;
  
  const quarterlyAverages = _.chunk(values, 3).map(chunk => _.mean(chunk));
  const variance = calculateVolatility(quarterlyAverages);
  const meanValue = _.mean(quarterlyAverages);
  
  // If quarterly variance is significant compared to mean, there might be seasonality
  return variance > meanValue * 0.1;
};

/**
 * Detect cyclical patterns
 */
const detectCycles = (values) => {
  // Simplified cycle detection using peaks and troughs
  const cycles = [];
  let lastPeak = { index: 0, value: values[0] };
  let lastTrough = { index: 0, value: values[0] };
  
  for (let i = 1; i < values.length - 1; i++) {
    // Check for peak
    if (values[i] > values[i-1] && values[i] > values[i+1]) {
      if (values[i] > lastPeak.value * 1.1) { // At least 10% higher than last peak
        cycles.push({
          type: 'peak',
          index: i,
          value: values[i],
          cycleLength: i - lastPeak.index
        });
        lastPeak = { index: i, value: values[i] };
      }
    }
    
    // Check for trough
    if (values[i] < values[i-1] && values[i] < values[i+1]) {
      if (values[i] < lastTrough.value * 0.9) { // At least 10% lower than last trough
        cycles.push({
          type: 'trough',
          index: i,
          value: values[i],
          cycleLength: i - lastTrough.index
        });
        lastTrough = { index: i, value: values[i] };
      }
    }
  }
  
  return cycles;
};

/**
 * Detect anomalies in financial data
 */
const detectAnomalies = (values) => {
  const mean = _.mean(values);
  const stdDev = Math.sqrt(_.mean(values.map(v => Math.pow(v - mean, 2))));
  
  const anomalies = values.map((value, index) => {
    const zScore = Math.abs(value - mean) / stdDev;
    if (zScore > 3) { // More than 3 standard deviations
      return {
        index,
        value,
        zScore,
        type: value > mean ? 'positive_outlier' : 'negative_outlier'
      };
    }
    return null;
  }).filter(a => a !== null);
  
  return anomalies;
};

/**
 * Generate AI-powered insights from financial data
 */
exports.generateFinancialInsights = async (data, metrics = {}) => {
  try {
    const systemPrompt = `You are a financial analyst AI. Based on the provided financial data and metrics, generate actionable insights and recommendations.`;
    
    const userPrompt = `
    Please analyze the following financial data and provide insights:
    
    Data Summary:
    ${JSON.stringify(data, null, 2)}
    
    Additional Metrics:
    ${JSON.stringify(metrics, null, 2)}
    
    Provide:
    1. Key findings and trends
    2. Potential risks and opportunities
    3. Actionable recommendations
    4. Key performance indicators to monitor
    5. Strategic implications
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
 * Perform cash flow analysis
 */
exports.analyzeCashFlow = (cashFlowData) => {
  try {
    const operatingCF = cashFlowData.operating || 0;
    const investingCF = cashFlowData.investing || 0;
    const financingCF = cashFlowData.financing || 0;
    
    const totalCashFlow = operatingCF + investingCF + financingCF;
    
    // Calculate cash flow ratios
    const operatingCashRatio = operatingCF / (cashFlowData.currentLiabilities || 1);
    const freeCashFlow = operatingCF - (cashFlowData.capitalExpenditures || 0);
    const cashFlowCoverage = operatingCF / (cashFlowData.totalDebt || 1);
    
    // Determine cash flow pattern
    let cashFlowPattern = '';
    if (operatingCF > 0 && investingCF < 0 && financingCF < 0) {
      cashFlowPattern = 'mature_company';
    } else if (operatingCF < 0 && investingCF < 0 && financingCF > 0) {
      cashFlowPattern = 'startup_company';
    } else if (operatingCF > 0 && investingCF < 0 && financingCF > 0) {
      cashFlowPattern = 'growing_company';
    } else {
      cashFlowPattern = 'restructuring_company';
    }
    
    return {
      totalCashFlow,
      operatingCashRatio,
      freeCashFlow,
      cashFlowCoverage,
      cashFlowPattern,
      recommendation: generateCashFlowRecommendation(cashFlowPattern, operatingCF, freeCashFlow)
    };
  } catch (error) {
    logger.error('Error analyzing cash flow:', { error });
    throw error;
  }
};

/**
 * Generate cash flow recommendations
 */
const generateCashFlowRecommendation = (pattern, operatingCF, freeCashFlow) => {
  let recommendation = "";
  
  switch (pattern) {
    case 'mature_company':
      recommendation = "Healthy cash flow pattern. Consider optimizing working capital and exploring new growth opportunities or returning value to shareholders through dividends.";
      break;
    case 'startup_company':
      recommendation = "Typical startup pattern. Focus on achieving positive operating cash flow and extending runway. Carefully monitor burn rate and key milestones for additional financing.";
      break;
    case 'growing_company':
      recommendation = "Growth phase detected. Monitor debt levels and ensure investments generate adequate returns. Balance growth with financial stability.";
      break;
    case 'restructuring_company':
      recommendation = "Unusual cash flow pattern. Review operations and consider restructuring if necessary. Focus on improving core operational cash flow.";
      break;
    default:
      recommendation = "Cash flow pattern requires further analysis.";
  }
  
  if (freeCashFlow < 0) {
    recommendation += " Negative free cash flow requires immediate attention to capital allocation and operational efficiency.";
  }
  
  return recommendation;
};

/**
 * Calculate key financial ratios
 */
exports.calculateFinancialRatios = (financialData) => {
  try {
    const {
      revenue, grossProfit, operatingProfit, netIncome,
      currentAssets, currentLiabilities, totalAssets, totalLiabilities,
      inventory, receivables, totalDebt, shareholderEquity
    } = financialData;
    
    // Profitability ratios
    const grossProfitMargin = (grossProfit / revenue) * 100;
    const operatingProfitMargin = (operatingProfit / revenue) * 100;
    const netProfitMargin = (netIncome / revenue) * 100;
    const returnOnAssets = (netIncome / totalAssets) * 100;
    const returnOnEquity = (netIncome / shareholderEquity) * 100;
    
    // Liquidity ratios
    const currentRatio = currentAssets / currentLiabilities;
    const quickRatio = (currentAssets - inventory) / currentLiabilities;
    const cashRatio = (financialData.cash || 0) / currentLiabilities;
    
    // Leverage ratios
    const debtToEquity = totalDebt / shareholderEquity;
    const debtToAssets = totalDebt / totalAssets;
    const interestCoverage = operatingProfit / (financialData.interestExpense || 1);
    
    // Efficiency ratios
    const assetTurnover = revenue / totalAssets;
    const inventoryTurnover = (financialData.costOfGoodsSold || revenue * 0.7) / inventory;
    const receivablesTurnover = revenue / receivables;
    
    return {
      profitability: {
        grossProfitMargin,
        operatingProfitMargin,
        netProfitMargin,
        returnOnAssets,
        returnOnEquity
      },
      liquidity: {
        currentRatio,
        quickRatio,
        cashRatio
      },
      leverage: {
        debtToEquity,
        debtToAssets,
        interestCoverage
      },
      efficiency: {
        assetTurnover,
        inventoryTurnover,
        receivablesTurnover
      }
    };
  } catch (error) {
    logger.error('Error calculating ratios:', { error });
    throw error;
  }
};

/**
 * Generate trend summary
 */
const generateTrendSummary = (data, valueColumn, growthRate, volatility) => {
  const direction = growthRate > 0 ? "increasing" : "decreasing";
  const rate = `${(Math.abs(growthRate) * 100).toFixed(1)}%`;
  const volatilityLevel = volatility > 0.2 ? "high" : volatility > 0.1 ? "moderate" : "low";
  
  return `The ${valueColumn} is ${direction} at an average rate of ${rate} per period. 
          Data volatility is ${volatilityLevel}, suggesting ${volatility > 0.2 ? "significant fluctuations" : "relatively stable patterns"}.`;
};

/**
 * Perform scenario analysis
 */
exports.performScenarioAnalysis = (baseScenario, scenarios = []) => {
  try {
    const results = scenarios.map(scenario => {
      const modifiedData = { ...baseScenario };
      
      // Apply scenario modifications
      Object.keys(scenario.modifications).forEach(key => {
        if (key in modifiedData) {
          modifiedData[key] = modifiedData[key] * scenario.modifications[key];
        }
      });
      
      // Calculate impact
      const baseValue = baseScenario.netIncome || 0;
      const scenarioValue = modifiedData.netIncome || 0;
      const impact = ((scenarioValue - baseValue) / baseValue) * 100;
      
      return {
        name: scenario.name,
        description: scenario.description,
        impact: `${impact.toFixed(1)}%`,
        results: modifiedData,
        recommendation: generateScenarioRecommendation(impact)
      };
    });
    
    return results;
  } catch (error) {
    logger.error('Error performing scenario analysis:', { error });
    throw error;
  }
};

/**
 * Generate scenario recommendations
 */
const generateScenarioRecommendation = (impact) => {
  if (impact > 10) {
    return "Highly positive impact. Consider implementing strategies to achieve this scenario.";
  } else if (impact > 0) {
    return "Positive impact. Monitor implementation feasibility.";
  } else if (impact > -10) {
    return "Minor negative impact. Acceptable risk if other benefits exist.";
  } else {
    return "Significant negative impact. Develop mitigation strategies before proceeding.";
  }
};

/**
 * Analyze financial statements
 */
exports.analyzeFinancialStatements = async (statements) => {
  try {
    // Basic metrics calculations
    const yearlyMetrics = {};
    const trends = {};
    
    // Calculate metrics for each year
    Object.keys(statements).forEach(year => {
      const statement = statements[year];
      
      // Calculate key metrics
      yearlyMetrics[year] = {
        profitMargin: (statement.netIncome / statement.revenue) * 100,
        currentRatio: statement.currentAssets / statement.currentLiabilities,
        debtToEquity: statement.totalLiabilities / statement.shareholderEquity,
        returnOnAssets: (statement.netIncome / statement.totalAssets) * 100,
        returnOnEquity: (statement.netIncome / statement.shareholderEquity) * 100,
        assetTurnover: statement.revenue / statement.totalAssets
      };
    });
    
    // Calculate year-over-year trends
    const years = Object.keys(yearlyMetrics).sort();
    if (years.length > 1) {
      for (let i = 1; i < years.length; i++) {
        const currentYear = years[i];
        const previousYear = years[i-1];
        
        trends[currentYear] = {};
        
        Object.keys(yearlyMetrics[currentYear]).forEach(metric => {
          const currentValue = yearlyMetrics[currentYear][metric];
          const previousValue = yearlyMetrics[previousYear][metric];
          
          trends[currentYear][metric] = {
            change: currentValue - previousValue,
            percentChange: ((currentValue - previousValue) / previousValue) * 100
          };
        });
      }
    }
    
    // Generate AI analysis of the statements and trends
    const analysisPrompt = `
      You are a financial analyst. Please analyze these financial statements and trends:
      
      Financial Metrics:
      ${JSON.stringify(yearlyMetrics, null, 2)}
      
      Year-over-Year Trends:
      ${JSON.stringify(trends, null, 2)}
      
      Provide a concise analysis of:
      1. Overall financial health
      2. Key strengths and weaknesses
      3. Concerning trends that need attention
      4. Areas of improvement
      5. Strategic recommendations
    `;
    
    const analysis = await retry(async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a financial analyst providing insight on financial statements." },
          { role: "user", content: analysisPrompt }
        ]
      });
      
      return response.choices[0].message.content;
    }, 3, 1000);
    
    return {
      metrics: yearlyMetrics,
      trends,
      analysis
    };
  } catch (error) {
    logger.error('Error analyzing financial statements:', { error });
    throw error;
  }
};

/**
 * Build financial dashboard data
 */
exports.buildFinancialDashboard = (data, period = 'monthly') => {
  try {
    // Extract time periods and financial metrics
    const timeField = period === 'monthly' ? 'month' : 
                     period === 'quarterly' ? 'quarter' : 'year';
    
    // Group data by time period
    const groupedData = _.groupBy(data, item => item[timeField]);
    
    // Prepare datasets for charts
    const timeLabels = Object.keys(groupedData).sort();
    
    // Revenue chart data
    const revenueData = timeLabels.map(label => {
      const periodData = groupedData[label];
      return _.sumBy(periodData, 'revenue');
    });
    
    // Expenses chart data
    const expensesData = timeLabels.map(label => {
      const periodData = groupedData[label];
      return _.sumBy(periodData, 'expenses');
    });
    
    // Profit chart data
    const profitData = timeLabels.map((label, index) => {
      return revenueData[index] - expensesData[index];
    });
    
    // Calculate KPIs
    const totalRevenue = _.sum(revenueData);
    const totalExpenses = _.sum(expensesData);
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = (totalProfit / totalRevenue) * 100;
    
    // Calculate growth rates
    const revenueGrowth = revenueData.length > 1 ? 
      ((revenueData[revenueData.length - 1] - revenueData[0]) / revenueData[0]) * 100 : 0;
    
    const profitGrowth = profitData.length > 1 && profitData[0] !== 0 ? 
      ((profitData[profitData.length - 1] - profitData[0]) / Math.abs(profitData[0])) * 100 : 0;
    
    // Identify top revenue sources (if data includes categories)
    let topRevenueSources = [];
    if (data[0] && data[0].category) {
      const categoryTotals = {};
      
      data.forEach(item => {
        if (!categoryTotals[item.category]) {
          categoryTotals[item.category] = 0;
        }
        categoryTotals[item.category] += item.revenue || 0;
      });
      
      topRevenueSources = Object.entries(categoryTotals)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    }
    
    return {
      timeLabels,
      chartData: {
        revenue: revenueData,
        expenses: expensesData,
        profit: profitData
      },
      kpis: {
        totalRevenue,
        totalExpenses,
        totalProfit,
        profitMargin,
        revenueGrowth,
        profitGrowth
      },
      topRevenueSources
    };
  } catch (error) {
    logger.error('Error building financial dashboard:', { error });
    throw error;
  }
};
