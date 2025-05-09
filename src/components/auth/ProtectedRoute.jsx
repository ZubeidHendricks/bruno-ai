import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';

/**
 * Protected Route component that redirects to login if user is not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - Protected route
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;