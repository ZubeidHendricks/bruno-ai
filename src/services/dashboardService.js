import apiService from './apiService';

/**
 * Dashboard service to handle all dashboard related operations
 */
const dashboardService = {
  /**
   * Get dashboard overview data
   * @param {string} timeRange - Time range for the dashboard (day, week, month, quarter, year)
   * @returns {Promise} - Dashboard overview data
   */
  getOverview: async (timeRange = 'year') => {
    try {
      return await apiService.dashboard.getOverview(timeRange);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get KPI data
   * @returns {Promise} - KPI data
   */
  getKpis: async () => {
    try {
      return await apiService.dashboard.getKpis();
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get trend data for a specific metric
   * @param {string} metric - Metric name (revenue, expenses, profit, etc.)
   * @param {string} timeRange - Time range (day, week, month, quarter, year)
   * @returns {Promise} - Trend data
   */
  getTrends: async (metric, timeRange = 'year') => {
    try {
      return await apiService.dashboard.getTrends(metric, timeRange);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get detected anomalies
   * @returns {Promise} - Anomalies data
   */
  getAnomalies: async () => {
    try {
      return await apiService.dashboard.getAnomalies();
    } catch (error) {
      throw error;
    }
  }
};

export default dashboardService;