import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  theme: 'light',
  sidebarCollapsed: false,
  notifications: [],
  hasUnreadNotifications: false
};

// Action types
const ActionTypes = {
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR_STATE: 'SET_SIDEBAR_STATE',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_NOTIFICATIONS_READ: 'MARK_NOTIFICATIONS_READ',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS'
};

// Reducer function
const uiReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_THEME:
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('bruno_theme', newTheme);
      return {
        ...state,
        theme: newTheme
      };
    case ActionTypes.SET_THEME:
      localStorage.setItem('bruno_theme', action.payload);
      return {
        ...state,
        theme: action.payload
      };
    case ActionTypes.TOGGLE_SIDEBAR:
      const newSidebarState = !state.sidebarCollapsed;
      localStorage.setItem('bruno_sidebar_collapsed', String(newSidebarState));
      return {
        ...state,
        sidebarCollapsed: newSidebarState
      };
    case ActionTypes.SET_SIDEBAR_STATE:
      localStorage.setItem('bruno_sidebar_collapsed', String(action.payload));
      return {
        ...state,
        sidebarCollapsed: action.payload
      };
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        hasUnreadNotifications: true
      };
    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    case ActionTypes.MARK_NOTIFICATIONS_READ:
      return {
        ...state,
        hasUnreadNotifications: false,
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true
        }))
      };
    case ActionTypes.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        hasUnreadNotifications: false
      };
    default:
      return state;
  }
};

// Create context
const UIContext = createContext();

// UI provider component
export const UIProvider = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('bruno_theme');
    if (savedTheme) {
      dispatch({ type: ActionTypes.SET_THEME, payload: savedTheme });
    } else {
      // Check if user prefers dark mode
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDarkMode) {
        dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      }
    }

    // Initialize sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('bruno_sidebar_collapsed');
    if (savedSidebarState !== null) {
      dispatch({ 
        type: ActionTypes.SET_SIDEBAR_STATE, 
        payload: savedSidebarState === 'true' 
      });
    }
  }, []);

  // Apply theme to document when theme changes
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  // Toggle theme function
  const toggleTheme = () => {
    dispatch({ type: ActionTypes.TOGGLE_THEME });
  };

  // Set specific theme
  const setTheme = (theme) => {
    dispatch({ type: ActionTypes.SET_THEME, payload: theme });
  };

  // Toggle sidebar function
  const toggleSidebar = () => {
    dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
  };

  // Set sidebar state
  const setSidebarState = (collapsed) => {
    dispatch({ type: ActionTypes.SET_SIDEBAR_STATE, payload: collapsed });
  };

  // Add notification
  const addNotification = (notification) => {
    const id = Date.now().toString();
    dispatch({
      type: ActionTypes.ADD_NOTIFICATION,
      payload: {
        id,
        timestamp: new Date(),
        read: false,
        ...notification
      }
    });
    
    // Auto-remove notification after timeout if specified
    if (notification.autoRemove) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.autoRemove);
    }
    
    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: id });
  };

  // Mark all notifications as read
  const markNotificationsRead = () => {
    dispatch({ type: ActionTypes.MARK_NOTIFICATIONS_READ });
  };

  // Clear all notifications
  const clearNotifications = () => {
    dispatch({ type: ActionTypes.CLEAR_NOTIFICATIONS });
  };

  // Context value
  const value = {
    ...state,
    toggleTheme,
    setTheme,
    toggleSidebar,
    setSidebarState,
    addNotification,
    removeNotification,
    markNotificationsRead,
    clearNotifications
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

// Custom hook to use UI context
export const useUI = () => {
  const context = useContext(UIContext);
  
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  
  return context;
};

export default UIContext;