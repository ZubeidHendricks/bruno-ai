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
import api from '../services/apiService';

// KPI Card Component
const KPICard = ({ title, value, change, icon: Icon }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${change >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          {change >= 0 ? 
            <ArrowUp className="w-5 h-5 text-green-500" /> : 
            <ArrowDown className="w-5 h-5 text-red-500" />
          }
        </div>
      </div>
      <div className="flex items-center mt-2">
        <span className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
        <span className="text-gray-500 text-sm ml-1">vs last period</span>
      </div>
    </div>
  );
};

// Main Financial Dashboard Component
const FinancialDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('year');
  
  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await api.dashboard.getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [timeRange]);
  
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await api.dashboard.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setIsLoading(false);
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
  };
  
  if (isLoading || !dashboardData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
          <p className="text-gray-600">Overview of your financial performance</p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <div className="flex items-center bg-white rounded-md shadow p-1">
            <button 
              onClick={() => setTimeRange('month')} 
              className={`px-3 py-1 rounded-md ${timeRange === 'month' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeRange('quarter')} 
              className={`px-3 py-1 rounded-md ${timeRange === 'quarter' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            >
              Quarter
            </button>
            <button 
              onClick={() => setTimeRange('year')} 
              className={`px-3 py-1 rounded-md ${timeRange === 'year' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            >
              Year
            </button>
          </div>
          
          <button 
            className="p-2 bg-white rounded-md shadow text-gray-600 hover:text-gray-900"
            onClick={handleRefresh}
          >
            <RefreshCw size={20} />
          </button>
          
          <button className="p-2 bg-white rounded-md shadow text-gray-600 hover:text-gray-900">
            <Filter size={20} />
          </button>
          
          <button 
            className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
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
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Expenses by Category Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* AI Insights */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          AI-Generated Financial Insights
        </h3>
        <div className="space-y-4">
          {dashboardData.insights.map((insight, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-gray-800">{insight.text}</p>
              <div className="flex items-center mt-1">
                <span className={`text-xs ${
                  insight.impact === 'positive' ? 'text-green-500' : 
                  insight.impact === 'negative' ? 'text-red-500' : 
                  'text-yellow-500'
                }`}>
                  {insight.impact === 'positive' ? 'Positive impact' : 
                   insight.impact === 'negative' ? 'Negative impact' : 
                   'Neutral impact'}
                </span>
                <span className="text-gray-400 text-xs ml-2">Confidence: {insight.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Anomalies */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
          Detected Anomalies
        </h3>
        <div className="space-y-4">
          {dashboardData.anomalies.map((anomaly, index) => (
            <div key={index} className="flex items-start">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{anomaly.title}</p>
                <p className="text-gray-600 text-sm">{anomaly.description}</p>
                <p className="text-gray-400 text-xs mt-1">Detected on {anomaly.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity */}
      {dashboardData.recentActivity && (
        <div className="bg-white rounded-lg shadow p-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center border-b border-gray-100 pb-2">
                <div className="bg-blue-100 p-1 rounded-full mr-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    {activity.action.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="text-gray-400 text-xs">
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
