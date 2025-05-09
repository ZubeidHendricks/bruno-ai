import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart2, 
  TrendingUp, 
  Download, 
  RefreshCw,
  Filter,
  ArrowUp,
  ArrowDown,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useData, useUI, useAI } from '../context';
import dashboardService from '../services/dashboardService';
import { Loader } from './common';

// KPI Card Component
const KPICard = ({ title, value, change, icon: Icon }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-full">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${change >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {change >= 0 ? 
            <ArrowUp className={`w-5 h-5 ${change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`} /> : 
            <ArrowDown className={`w-5 h-5 ${change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`} />
          }
        </div>
      </div>
      <div className="flex items-center mt-2">
        <span className={`text-sm ${change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">vs last period</span>
      </div>
    </div>
  );
};

// Main Financial Dashboard Component
const FinancialDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('year');
  const [error, setError] = useState(null);
  
  const { fetchDatasets } = useData();
  const { addNotification } = useUI();
  const { generateInsights } = useAI();
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch datasets to populate the dashboard
        await fetchDatasets();
        
        // Fetch dashboard data from API
        const data = await dashboardService.getOverview(timeRange);
        setDashboardData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Unable to fetch dashboard data. Please try again later.');
        setIsLoading(false);
        
        addNotification({
          title: 'Error',
          message: 'Failed to fetch dashboard data. Please try again.',
          type: 'error',
          autoRemove: 5000
        });
      }
    };
    
    fetchDashboardData();
  }, [timeRange, fetchDatasets, addNotification]);
  
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch dashboard data from API
      const data = await dashboardService.getOverview(timeRange);
      setDashboardData(data);
      setIsLoading(false);
      
      addNotification({
        title: 'Success',
        message: 'Dashboard data refreshed successfully',
        type: 'success',
        autoRemove: 3000
      });
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      setError('Unable to refresh dashboard data. Please try again later.');
      setIsLoading(false);
      
      addNotification({
        title: 'Error',
        message: 'Failed to refresh dashboard data',
        type: 'error',
        autoRemove: 5000
      });
    }
  };
  
  const handleExport = () => {
    if (!dashboardData) return;
    
    // Create CSV data
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add KPI data
    csvContent += "KPI,Value,Change\n";
    dashboardData.kpis.forEach(kpi => {
      csvContent += `${kpi.title},${kpi.value},${kpi.change}\n`;
    });
    
    // Add revenue data
    csvContent += "\nMonth,Revenue\n";
    dashboardData.revenueTrend.forEach(item => {
      csvContent += `${item.month},${item.revenue}\n`;
    });
    
    // Add expenses data
    csvContent += "\nCategory,Value\n";
    dashboardData.expensesByCategory.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_dashboard_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification({
      title: 'Success',
      message: 'Dashboard data exported successfully',
      type: 'success',
      autoRemove: 3000
    });
  };
  
  // Generate additional insights
  const handleGenerateInsights = async () => {
    if (!dashboardData) return;
    
    try {
      setIsLoading(true);
      
      // Call AI service to generate insights
      await generateInsights(dashboardData);
      
      setIsLoading(false);
      
      addNotification({
        title: 'Success',
        message: 'AI insights generated successfully',
        type: 'success',
        autoRemove: 3000
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      setIsLoading(false);
      
      addNotification({
        title: 'Error',
        message: 'Failed to generate AI insights',
        type: 'error',
        autoRemove: 5000
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader 
          size="lg" 
          text="Loading dashboard data..." 
        />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Dashboard</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Data Available</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>No dashboard data is currently available. Please try refreshing or contact support if the issue persists.</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Financial Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of your financial performance</p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-md shadow p-1">
            <button 
              onClick={() => setTimeRange('month')} 
              className={`px-3 py-1 rounded-md ${timeRange === 'month' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeRange('quarter')} 
              className={`px-3 py-1 rounded-md ${timeRange === 'quarter' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Quarter
            </button>
            <button 
              onClick={() => setTimeRange('year')} 
              className={`px-3 py-1 rounded-md ${timeRange === 'year' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Year
            </button>
          </div>
          
          <button 
            className="p-2 bg-white dark:bg-gray-800 rounded-md shadow text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            onClick={handleRefresh}
          >
            <RefreshCw size={20} />
          </button>
          
          <button className="p-2 bg-white dark:bg-gray-800 rounded-md shadow text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
            <Filter size={20} />
          </button>
          
          <button 
            className="flex items-center bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
            onClick={handleExport}
          >
            <Download size={18} className="mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {dashboardData.kpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
          />
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Expenses by Category Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Expenses by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* AI Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
            AI-Generated Financial Insights
          </h3>
          <button 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            onClick={handleGenerateInsights}
          >
            Refresh Insights
          </button>
        </div>
        <div className="space-y-4">
          {dashboardData.insights.map((insight, index) => (
            <div key={index} className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2">
              <p className="text-gray-800 dark:text-gray-200">{insight.text}</p>
              <div className="flex items-center mt-1">
                <span className={`text-xs ${
                  insight.impact === 'positive' ? 'text-green-500 dark:text-green-400' : 
                  insight.impact === 'negative' ? 'text-red-500 dark:text-red-400' : 
                  'text-yellow-500 dark:text-yellow-400'
                }`}>
                  {insight.impact === 'positive' ? 'Positive impact' : 
                   insight.impact === 'negative' ? 'Negative impact' : 
                   'Neutral impact'}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">Confidence: {insight.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Anomalies */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-500 dark:text-yellow-400" />
          Detected Anomalies
        </h3>
        <div className="space-y-4">
          {dashboardData.anomalies.map((anomaly, index) => (
            <div key={index} className="flex items-start">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full mr-3">
                <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">{anomaly.title}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{anomaly.description}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Detected on {anomaly.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity */}
      {dashboardData.recentActivity && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {activity.action.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;