import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/apiService';

// Default settings
const defaultSettings = {
  general: {
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY'
  },
  notifications: {
    emailAlerts: true,
    financialReports: true,
    budgetAlerts: true,
    systemUpdates: false
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: '30',
    ipRestriction: false
  },
  dataIntegration: {
    autoSync: true,
    syncFrequency: 'daily',
    retainHistory: '90'
  },
  display: {
    dashboardLayout: 'default',
    chartStyle: 'default',
    dataTableDensity: 'medium',
    showWelcomeScreen: true
  }
};

// Initial state
const initialState = {
  ...defaultSettings,
  loading: false,
  error: null,
  unsavedChanges: false
};

// Action types
const ActionTypes = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_FAILURE: 'FETCH_FAILURE',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_SETTING_GROUP: 'UPDATE_SETTING_GROUP',
  MARK_CHANGES: 'MARK_CHANGES',
  SAVE_START: 'SAVE_START',
  SAVE_SUCCESS: 'SAVE_SUCCESS',
  SAVE_FAILURE: 'SAVE_FAILURE',
  RESET_SETTINGS: 'RESET_SETTINGS'
};

// Reducer function
const settingsReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_SUCCESS:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
        unsavedChanges: false
      };
    case ActionTypes.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        ...action.payload,
        unsavedChanges: true
      };
    case ActionTypes.UPDATE_SETTING_GROUP:
      return {
        ...state,
        [action.group]: {
          ...state[action.group],
          ...action.payload
        },
        unsavedChanges: true
      };
    case ActionTypes.MARK_CHANGES:
      return {
        ...state,
        unsavedChanges: action.payload
      };
    case ActionTypes.SAVE_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.SAVE_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        unsavedChanges: false
      };
    case ActionTypes.SAVE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case ActionTypes.RESET_SETTINGS:
      return {
        ...defaultSettings,
        loading: false,
        error: null,
        unsavedChanges: true
      };
    default:
      return state;
  }
};

// Create context
const SettingsContext = createContext();

// Settings provider component
export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Fetch user settings when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSettings();
    }
  }, [isAuthenticated, user]);

  // Load local settings when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const localSettings = localStorage.getItem('bruno_settings');
      
      if (localSettings) {
        try {
          const parsedSettings = JSON.parse(localSettings);
          dispatch({ 
            type: ActionTypes.FETCH_SUCCESS, 
            payload: parsedSettings 
          });
        } catch (error) {
          console.error('Error parsing local settings:', error);
        }
      }
    }
  }, [isAuthenticated]);

  // Check system preferences for theme
  useEffect(() => {
    // If there's no theme set yet, check system preferences
    if (!localStorage.getItem('bruno_theme')) {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      dispatch({
        type: ActionTypes.UPDATE_SETTING_GROUP,
        group: 'general',
        payload: { theme: prefersDarkMode ? 'dark' : 'light' }
      });
    }
  }, []);

  // Apply theme to document when theme changes
  useEffect(() => {
    if (state.general.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.general.theme]);

  // Function to fetch user settings
  const fetchSettings = async () => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      // Make API call
      const data = await apiService.settings.get();
      
      // If settings is empty, use default settings
      const finalSettings = Object.keys(data).length === 0 
        ? defaultSettings 
        : {
            ...defaultSettings,  // Fill in any missing settings with defaults
            ...data
          };
      
      dispatch({ 
        type: ActionTypes.FETCH_SUCCESS, 
        payload: finalSettings 
      });
      
      // Update theme in localStorage
      if (finalSettings.general?.theme) {
        localStorage.setItem('bruno_theme', finalSettings.general.theme);
      }
      
      return finalSettings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to fetch settings' 
      });
      
      // Fall back to default settings
      dispatch({ 
        type: ActionTypes.FETCH_SUCCESS, 
        payload: defaultSettings 
      });
      
      return defaultSettings;
    }
  };

  // Function to update settings
  const updateSettings = (settings) => {
    dispatch({ 
      type: ActionTypes.UPDATE_SETTINGS, 
      payload: settings 
    });
    
    // Save to localStorage if not authenticated
    if (!isAuthenticated) {
      const newSettings = { ...state, ...settings };
      const { loading, error, unsavedChanges, ...settingsToSave } = newSettings;
      localStorage.setItem('bruno_settings', JSON.stringify(settingsToSave));
      
      // Update theme in localStorage
      if (settings.general?.theme) {
        localStorage.setItem('bruno_theme', settings.general.theme);
      }
    }
  };

  // Function to update a specific settings group
  const updateSettingGroup = (group, settings) => {
    dispatch({ 
      type: ActionTypes.UPDATE_SETTING_GROUP, 
      group,
      payload: settings 
    });
    
    // Save to localStorage if not authenticated
    if (!isAuthenticated) {
      const newSettings = { 
        ...state, 
        [group]: { ...state[group], ...settings } 
      };
      
      const { loading, error, unsavedChanges, ...settingsToSave } = newSettings;
      localStorage.setItem('bruno_settings', JSON.stringify(settingsToSave));
      
      // Update theme in localStorage if it's in the general group
      if (group === 'general' && settings.theme) {
        localStorage.setItem('bruno_theme', settings.theme);
      }
    }
  };

  // Function to save settings to server
  const saveSettings = async () => {
    if (!isAuthenticated) {
      // Just save to localStorage if not authenticated
      const { loading, error, unsavedChanges, ...settingsToSave } = state;
      localStorage.setItem('bruno_settings', JSON.stringify(settingsToSave));
      
      dispatch({ type: ActionTypes.SAVE_SUCCESS });
      return;
    }
    
    dispatch({ type: ActionTypes.SAVE_START });
    
    try {
      // Extract the settings to save (excluding loading, error, unsavedChanges)
      const { loading, error, unsavedChanges, ...settingsToSave } = state;
      
      // Make API call
      const data = await apiService.settings.update(settingsToSave);
      
      dispatch({ type: ActionTypes.SAVE_SUCCESS });
      
      return data;
    } catch (error) {
      console.error('Error saving settings:', error);
      dispatch({ 
        type: ActionTypes.SAVE_FAILURE, 
        payload: error.displayMessage || 'Failed to save settings' 
      });
      throw error;
    }
  };

  // Function to reset settings to defaults
  const resetSettings = () => {
    dispatch({ type: ActionTypes.RESET_SETTINGS });
    
    // Save to localStorage if not authenticated
    if (!isAuthenticated) {
      localStorage.setItem('bruno_settings', JSON.stringify(defaultSettings));
      
      // Update theme in localStorage
      localStorage.setItem('bruno_theme', defaultSettings.general.theme);
    }
  };

  // Context value
  const value = {
    ...state,
    fetchSettings,
    updateSettings,
    updateSettingGroup,
    saveSettings,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};

export default SettingsContext;