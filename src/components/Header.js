import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQuestionCircle, 
  faHistory, 
  faRocket, 
  faPencilAlt,
  faUser,
  faCog,
  faSignOutAlt,
  faBell,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons';
import { useAuth, useUI, useSettings } from '../context';

function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, isAuthenticated } = useAuth();
  const { notifications, hasUnreadNotifications, markNotificationsRead, removeNotification } = useUI();
  const { general, updateSettingGroup } = useSettings();

  useEffect(() => {
    // Handle click outside dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, notificationsRef]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
    markNotificationsRead();
  };

  const toggleTheme = () => {
    const newTheme = general.theme === 'light' ? 'dark' : 'light';
    updateSettingGroup('general', { theme: newTheme });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.username) return '?';
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b flex items-center px-4 py-2 fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center">
        <div className="h-8 w-8 mr-2 bg-blue-600 rounded-md flex items-center justify-center text-white">
          <span className="font-bold">B</span>
        </div>
        <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">Bruno AI</h1>
      </div>
      <div className="ml-6 text-gray-700 dark:text-gray-300">Financial Intelligence Platform</div>
      <div className="ml-4 text-gray-400 dark:text-gray-500 cursor-pointer">
        <FontAwesomeIcon icon={faPencilAlt} />
      </div>
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <button 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          onClick={toggleTheme}
          title={general.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <FontAwesomeIcon icon={general.theme === 'light' ? faMoon : faSun} />
        </button>
        
        <button className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
          <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
          <span className="hidden md:inline">Get Support</span>
        </button>
        
        <button className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
          <FontAwesomeIcon icon={faHistory} className="mr-2" />
          <span className="hidden md:inline">History</span>
        </button>
        
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            onClick={handleOpenNotifications}
          >
            <FontAwesomeIcon icon={faBell} />
            {hasUnreadNotifications && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>
          
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {notification.title}
                        </p>
                        <button 
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          onClick={() => removeNotification(notification.id)}
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <button className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          <FontAwesomeIcon icon={faRocket} className="mr-2" />
          <span className="hidden md:inline">Show Deployment</span>
        </button>
        
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium mr-2">
                {getUserInitials()}
              </div>
              <span className="hidden md:inline">{user.username}</span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                <Link 
                  to="/profile" 
                  className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/profile' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => setIsProfileOpen(false)}
                >
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Profile
                </Link>
                <Link 
                  to="/settings" 
                  className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/settings' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => setIsProfileOpen(false)}
                >
                  <FontAwesomeIcon icon={faCog} className="mr-2" />
                  Settings
                </Link>
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            to="/auth/login" 
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;