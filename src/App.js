import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DataPrepView from './components/DataPrepView';
import FinancialDashboard from './components/FinancialDashboard';
import { 
  Login, 
  Register, 
  ForgotPassword, 
  ResetPassword, 
  AuthLayout, 
  ProtectedRoute 
} from './components/auth';
import { UserProfile, ChangePassword } from './components/profile';
import { ReportsList } from './components/reports';
import { SearchInterface } from './components/search';
import { Settings } from './components/settings';
import { Notifications } from './components/common';

// Import context providers
import { 
  AuthProvider, 
  UIProvider, 
  DataProvider, 
  SettingsProvider, 
  AIProvider 
} from './context';

function App() {
  // Log environment
  useEffect(() => {
    if (process.env.REACT_APP_DEBUG === 'true') {
      console.log('Environment:', process.env.NODE_ENV);
      console.log('API URL:', process.env.REACT_APP_API_URL);
    }
  }, []);

  return (
    <AuthProvider>
      <UIProvider>
        <SettingsProvider>
          <DataProvider>
            <AIProvider>
              <Router>
                {/* Notifications component */}
                <Notifications />
                
                <Routes>
                  {/* Auth Routes */}
                  <Route path="/auth" element={<AuthLayout />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password/:token" element={<ResetPassword />} />
                  </Route>
                  
                  {/* Non-Protected Routes */}
                  <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/register" element={<Navigate to="/auth/register" replace />} />
                  <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
                  
                  {/* Dashboard Routes */}
                  <Route path="/" element={
                    <div className="flex flex-col h-screen">
                      <Header />
                      <div className="flex flex-1 overflow-hidden pt-14">
                        <Sidebar />
                        <div className="flex-1 overflow-auto ml-16 dark:bg-gray-900">
                          <Routes>
                            <Route path="/" element={
                              <ProtectedRoute>
                                <Navigate to="/dashboard" replace />
                              </ProtectedRoute>
                            } />
                            <Route path="/dashboard" element={
                              <ProtectedRoute>
                                <FinancialDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/data-prep" element={
                              <ProtectedRoute>
                                <DataPrepView />
                              </ProtectedRoute>
                            } />
                            <Route path="/reports" element={
                              <ProtectedRoute>
                                <ReportsList />
                              </ProtectedRoute>
                            } />
                            <Route path="/search" element={
                              <ProtectedRoute>
                                <SearchInterface />
                              </ProtectedRoute>
                            } />
                            <Route path="/profile" element={
                              <ProtectedRoute>
                                <UserProfile />
                              </ProtectedRoute>
                            } />
                            <Route path="/change-password" element={
                              <ProtectedRoute>
                                <ChangePassword />
                              </ProtectedRoute>
                            } />
                            <Route path="/settings" element={
                              <ProtectedRoute>
                                <Settings />
                              </ProtectedRoute>
                            } />
                          </Routes>
                        </div>
                      </div>
                    </div>
                  } />
                </Routes>
              </Router>
            </AIProvider>
          </DataProvider>
        </SettingsProvider>
      </UIProvider>
    </AuthProvider>
  );
}

export default App;