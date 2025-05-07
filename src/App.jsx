import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Settings, LogOut, Menu, X, Clock } from 'lucide-react';
import ChatDataPrep from './components/ChatDataPrep';
import FinancialDashboard from './components/FinancialDashboard';
import TimelineHistory from './components/TimelineHistory';
import DataPrepTimeline from './components/DataPrepTimeline';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Chat Data Prep™', href: '/chat', icon: MessageSquare },
    { name: 'Timeline History', href: '/history', icon: Clock },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-blue-600 text-white transition-all duration-300 ease-in-out`}>
          <div className="flex items-center justify-between p-4">
            <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
              <h1 className="text-xl font-bold">Bruno AI</h1>
              <p className="text-xs text-blue-200">Financial Intelligence</p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-blue-700"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          
          <nav className="mt-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center px-4 py-3 hover:bg-blue-700 transition-colors"
              >
                <item.icon className="h-6 w-6" />
                <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
          
          <div className="absolute bottom-0 w-full p-4">
            <button className="flex items-center w-full text-left hover:bg-blue-700 p-2 rounded">
              <LogOut className="h-6 w-6" />
              <span className={`ml-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                Logout
              </span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-100">
            <Routes>
              <Route path="/" element={<FinancialDashboard />} />
              <Route path="/chat" element={<ChatDataPrep />} />
              <Route path="/history" element={<TimelineHistory />} />
              <Route path="/timeline" element={<DataPrepTimeline />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

// Settings component placeholder
const Settings = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">System Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-600">Enable AI Processing</label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-gray-600">Auto-save Transformations</label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-gray-600">Enable Timeline Tracking</label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-gray-600">Email Notifications</label>
            <input type="checkbox" className="rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
