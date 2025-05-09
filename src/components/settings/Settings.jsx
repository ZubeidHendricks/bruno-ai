import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCog, 
  faUser, 
  faBell, 
  faShieldAlt, 
  faDatabase,
  faSync,
  faToggleOn,
  faToggleOff,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const Settings = () => {
  // State for all settings
  const [general, setGeneral] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY'
  });
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    financialReports: true,
    budgetAlerts: true,
    systemUpdates: false
  });
  
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    ipRestriction: false
  });
  
  const [dataIntegration, setDataIntegration] = useState({
    autoSync: true,
    syncFrequency: 'daily',
    retainHistory: '90'
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Handlers for various setting changes
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneral(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurity(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  const handleDataIntegrationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDataIntegration(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  // Save settings
  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call to save settings
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Configure your platform preferences</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Settings Tabs */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('general')}
          >
            <FontAwesomeIcon icon={faCog} className="mr-2" /> General
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FontAwesomeIcon icon={faBell} className="mr-2" /> Notifications
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('security')}
          >
            <FontAwesomeIcon icon={faShieldAlt} className="mr-2" /> Security
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'data-integration' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('data-integration')}
          >
            <FontAwesomeIcon icon={faDatabase} className="mr-2" /> Data Integration
          </button>
        </div>
        
        {/* Settings Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">General Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select
                    name="theme"
                    value={general.theme}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    name="language"
                    value={general.language}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    value={general.timezone}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="UTC">UTC</option>
                    <option value="ET">Eastern Time</option>
                    <option value="CT">Central Time</option>
                    <option value="MT">Mountain Time</option>
                    <option value="PT">Pacific Time</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <select
                    name="dateFormat"
                    value={general.dateFormat}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Email Alerts</h3>
                    <p className="text-xs text-gray-500">Receive email notifications</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="emailAlerts"
                      checked={notifications.emailAlerts}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <FontAwesomeIcon 
                      icon={notifications.emailAlerts ? faToggleOn : faToggleOff} 
                      className={`ml-2 text-xl ${notifications.emailAlerts ? 'text-blue-600' : 'text-gray-400'}`} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Financial Reports</h3>
                    <p className="text-xs text-gray-500">Notify when new reports are available</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="financialReports"
                      checked={notifications.financialReports}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <FontAwesomeIcon 
                      icon={notifications.financialReports ? faToggleOn : faToggleOff} 
                      className={`ml-2 text-xl ${notifications.financialReports ? 'text-blue-600' : 'text-gray-400'}`} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Budget Alerts</h3>
                    <p className="text-xs text-gray-500">Notify when budgets exceed thresholds</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="budgetAlerts"
                      checked={notifications.budgetAlerts}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <FontAwesomeIcon 
                      icon={notifications.budgetAlerts ? faToggleOn : faToggleOff} 
                      className={`ml-2 text-xl ${notifications.budgetAlerts ? 'text-blue-600' : 'text-gray-400'}`} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">System Updates</h3>
                    <p className="text-xs text-gray-500">Notify about platform updates</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="systemUpdates"
                      checked={notifications.systemUpdates}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <FontAwesomeIcon 
                      icon={notifications.systemUpdates ? faToggleOn : faToggleOff} 
                      className={`ml-2 text-xl ${notifications.systemUpdates ? 'text-blue-600' : 'text-gray-400'}`} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-500">Enable 2FA for added security</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="twoFactorAuth"
                      checked={security.twoFactorAuth}
                      onChange={handleSecurityChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <FontAwesomeIcon 
                      icon={security.twoFactorAuth ? faToggleOn : faToggleOff} 
                      className={`ml-2 text-xl ${security.twoFactorAuth ? 'text-blue-600' : 'text-gray-400'}`} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Session Timeout</h3>
                    <p className="text-xs text-gray-500">Automatically log out after inactivity</p>
                  </div>
                  <div className="w-1/3">
                    <select
                      name="sessionTimeout"
                      value={security.sessionTimeout}
                      onChange={handleSecurityChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">IP Restriction</h3>
                    <p className="text-xs text-gray-500">Limit access to specific IP addresses</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="ipRestriction"
                      checked={security.ipRestriction}
                      onChange={handleSecurityChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <FontAwesomeIcon 
                      icon={security.ipRestriction ? faToggleOn : faToggleOff} 
                      className={`ml-2 text-xl ${security.ipRestriction ? 'text-blue-600' : 'text-gray-400'}`} 
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => window.location.href = '/change-password'}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Data Integration Settings */}
          {activeTab === 'data-integration' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Integration Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Automatic Synchronization</h3>
                    <p className="text-xs text-gray-500">Automatically sync data from connected sources</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="autoSync"
                      checked={dataIntegration.autoSync}
                      onChange={handleDataIntegrationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <FontAwesomeIcon 
                      icon={dataIntegration.autoSync ? faToggleOn : faToggleOff} 
                      className={`ml-2 text-xl ${dataIntegration.autoSync ? 'text-blue-600' : 'text-gray-400'}`} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Sync Frequency</h3>
                    <p className="text-xs text-gray-500">How often to sync connected data sources</p>
                  </div>
                  <div className="w-1/3">
                    <select
                      name="syncFrequency"
                      value={dataIntegration.syncFrequency}
                      onChange={handleDataIntegrationChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      disabled={!dataIntegration.autoSync}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Retain History</h3>
                    <p className="text-xs text-gray-500">How long to retain historical data</p>
                  </div>
                  <div className="w-1/3">
                    <select
                      name="retainHistory"
                      value={dataIntegration.retainHistory}
                      onChange={handleDataIntegrationChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="180">6 months</option>
                      <option value="365">1 year</option>
                      <option value="forever">Forever</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => alert('Manual sync initiated')}
                  >
                    <FontAwesomeIcon icon={faSync} className="mr-2" />
                    Sync Now
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Save Button */}
          <div className="mt-8 pt-5 border-t flex justify-end">
            {saveSuccess && (
              <div className="mr-4 flex items-center text-green-600">
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                <span>Settings saved successfully</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;