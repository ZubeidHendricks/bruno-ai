import React from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle, 
  faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';
import { useUI } from '../../context';

const Notifications = () => {
  const { notifications, removeNotification } = useUI();
  
  if (!notifications.length) return null;

  // Create a portal for notifications to be rendered at the top of the page
  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm">
      {notifications.map(notification => (
        <Notification 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>,
    document.body
  );
};

const Notification = ({ notification, onClose }) => {
  const { id, title, message, type = 'info', timestamp } = notification;
  
  // Icon and colors based on notification type
  const getNotificationStyles = () => {
    switch(type) {
      case 'success':
        return {
          icon: faCheckCircle,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-500 dark:border-green-400',
          iconColor: 'text-green-500 dark:text-green-400'
        };
      case 'error':
        return {
          icon: faTimesCircle,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-500 dark:border-red-400',
          iconColor: 'text-red-500 dark:text-red-400'
        };
      case 'warning':
        return {
          icon: faExclamationCircle,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          borderColor: 'border-yellow-500 dark:border-yellow-400',
          iconColor: 'text-yellow-500 dark:text-yellow-400'
        };
      case 'info':
      default:
        return {
          icon: faInfoCircle,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-500 dark:border-blue-400',
          iconColor: 'text-blue-500 dark:text-blue-400'
        };
    }
  };
  
  const styles = getNotificationStyles();
  
  return (
    <div 
      className={`${styles.bgColor} border-l-4 ${styles.borderColor} p-4 rounded shadow-md animate-fadeIn flex items-start`}
      role="alert"
    >
      <div className={`${styles.iconColor} mr-3 flex-shrink-0 pt-0.5`}>
        <FontAwesomeIcon icon={styles.icon} />
      </div>
      <div className="flex-1">
        {title && (
          <h3 className={`font-semibold ${styles.textColor}`}>{title}</h3>
        )}
        <p className={`text-sm ${styles.textColor}`}>{message}</p>
        {timestamp && (
          <p className={`text-xs mt-1 opacity-70 ${styles.textColor}`}>
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
      <button 
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default Notifications;