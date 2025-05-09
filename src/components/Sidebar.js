import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTable, 
  faPlus, 
  faChartLine, 
  faSearch, 
  faFileAlt, 
  faWrench, 
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { useUI } from '../context';

function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUI();
  
  // Menu items
  const menuItems = [
    { icon: faChartLine, text: 'Dashboard', path: '/dashboard' },
    { icon: faTable, text: 'Data Prep', path: '/data-prep' },
    { icon: faFileAlt, text: 'Reports', path: '/reports' },
    { icon: faSearch, text: 'Search', path: '/search' },
    { icon: faUser, text: 'Profile', path: '/profile' },
    { icon: faWrench, text: 'Settings', path: '/settings' }
  ];
  
  return (
    <div className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col items-center transition-width duration-300 fixed top-14 bottom-0`}>
      <div className="w-full overflow-y-auto py-4">
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            to={item.path} 
            className={`mb-4 flex ${sidebarCollapsed ? 'justify-center' : 'px-4'} items-center ${location.pathname === item.path ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          >
            <div className={`${sidebarCollapsed ? 'mx-auto' : ''} w-12 h-12 rounded-full flex items-center justify-center mb-1 ${location.pathname === item.path ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700/30'}`}>
              <FontAwesomeIcon icon={item.icon} />
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 text-sm font-medium">
                {item.text}
              </span>
            )}
          </Link>
        ))}
      </div>
      
      <div className="mt-auto mb-6 w-8 h-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer">
        <FontAwesomeIcon icon={faPlus} />
      </div>
      
      {/* Toggle sidebar button */}
      <button 
        onClick={toggleSidebar}
        className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          {sidebarCollapsed ? (
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          )}
        </svg>
      </button>
    </div>
  );
}

export default Sidebar;