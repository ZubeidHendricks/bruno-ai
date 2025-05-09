import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/apiService';

// Initial state
const initialState = {
  datasets: [],
  currentDataset: null,
  reports: [],
  transformations: [],
  loading: false,
  error: null,
  lastUpdated: null
};

// Action types
const ActionTypes = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_FAILURE: 'FETCH_FAILURE',
  SET_CURRENT_DATASET: 'SET_CURRENT_DATASET',
  ADD_DATASET: 'ADD_DATASET',
  UPDATE_DATASET: 'UPDATE_DATASET',
  REMOVE_DATASET: 'REMOVE_DATASET',
  ADD_TRANSFORMATION: 'ADD_TRANSFORMATION',
  UPDATE_TRANSFORMATION: 'UPDATE_TRANSFORMATION',
  REMOVE_TRANSFORMATION: 'REMOVE_TRANSFORMATION',
  FETCH_REPORTS_SUCCESS: 'FETCH_REPORTS_SUCCESS',
  ADD_REPORT: 'ADD_REPORT',
  UPDATE_REPORT: 'UPDATE_REPORT',
  REMOVE_REPORT: 'REMOVE_REPORT',
  CLEAR_DATA: 'CLEAR_DATA'
};

// Reducer function
const dataReducer = (state, action) => {
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
        datasets: action.payload,
        loading: false,
        error: null,
        lastUpdated: new Date()
      };
    case ActionTypes.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case ActionTypes.SET_CURRENT_DATASET:
      return {
        ...state,
        currentDataset: action.payload
      };
    case ActionTypes.ADD_DATASET:
      return {
        ...state,
        datasets: [...state.datasets, action.payload],
        currentDataset: action.payload,
        lastUpdated: new Date()
      };
    case ActionTypes.UPDATE_DATASET:
      return {
        ...state,
        datasets: state.datasets.map(dataset => 
          dataset.id === action.payload.id ? action.payload : dataset
        ),
        currentDataset: state.currentDataset?.id === action.payload.id 
          ? action.payload 
          : state.currentDataset,
        lastUpdated: new Date()
      };
    case ActionTypes.REMOVE_DATASET:
      return {
        ...state,
        datasets: state.datasets.filter(dataset => dataset.id !== action.payload),
        currentDataset: state.currentDataset?.id === action.payload 
          ? null 
          : state.currentDataset,
        lastUpdated: new Date()
      };
    case ActionTypes.ADD_TRANSFORMATION:
      return {
        ...state,
        transformations: [...state.transformations, action.payload],
        lastUpdated: new Date()
      };
    case ActionTypes.UPDATE_TRANSFORMATION:
      return {
        ...state,
        transformations: state.transformations.map(transformation => 
          transformation.id === action.payload.id ? action.payload : transformation
        ),
        lastUpdated: new Date()
      };
    case ActionTypes.REMOVE_TRANSFORMATION:
      return {
        ...state,
        transformations: state.transformations.filter(
          transformation => transformation.id !== action.payload
        ),
        lastUpdated: new Date()
      };
    case ActionTypes.FETCH_REPORTS_SUCCESS:
      return {
        ...state,
        reports: action.payload,
        loading: false,
        error: null,
        lastUpdated: new Date()
      };
    case ActionTypes.ADD_REPORT:
      return {
        ...state,
        reports: [...state.reports, action.payload],
        lastUpdated: new Date()
      };
    case ActionTypes.UPDATE_REPORT:
      return {
        ...state,
        reports: state.reports.map(report => 
          report.id === action.payload.id ? action.payload : report
        ),
        lastUpdated: new Date()
      };
    case ActionTypes.REMOVE_REPORT:
      return {
        ...state,
        reports: state.reports.filter(report => report.id !== action.payload),
        lastUpdated: new Date()
      };
    case ActionTypes.CLEAR_DATA:
      return {
        ...initialState
      };
    default:
      return state;
  }
};

// Create context
const DataContext = createContext();

// Data provider component
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Fetch datasets when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDatasets();
    } else {
      dispatch({ type: ActionTypes.CLEAR_DATA });
    }
  }, [isAuthenticated]);

  // Function to fetch datasets
  const fetchDatasets = async () => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.datasets.getAll();
      
      dispatch({ 
        type: ActionTypes.FETCH_SUCCESS, 
        payload: data 
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching datasets:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to fetch datasets' 
      });
      throw error;
    }
  };

  // Function to fetch a single dataset by ID
  const fetchDatasetById = async (id) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.datasets.getById(id);
      
      // Update the dataset in the state
      dispatch({ 
        type: ActionTypes.UPDATE_DATASET, 
        payload: data 
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching dataset ${id}:`, error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to fetch dataset' 
      });
      throw error;
    }
  };

  // Function to fetch reports
  const fetchReports = async () => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.reports.getAll();
      
      dispatch({ 
        type: ActionTypes.FETCH_REPORTS_SUCCESS, 
        payload: data 
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to fetch reports' 
      });
      throw error;
    }
  };

  // Function to fetch transformations for a dataset
  const fetchTransformations = async (datasetId) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.transformations.getAll(datasetId);
      
      // Update transformations in state
      // Clear existing transformations first to avoid duplicates
      state.transformations = [];
      
      data.forEach(transformation => {
        dispatch({
          type: ActionTypes.ADD_TRANSFORMATION,
          payload: transformation
        });
      });
      
      dispatch({ type: ActionTypes.FETCH_SUCCESS, payload: state.datasets });
      
      return data;
    } catch (error) {
      console.error('Error fetching transformations:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to fetch transformations' 
      });
      throw error;
    }
  };

  // Function to upload a dataset (base64 encoded)
  const uploadBase64Dataset = async (fileData) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.datasets.uploadBase64(fileData);
      
      dispatch({ 
        type: ActionTypes.ADD_DATASET, 
        payload: data.dataset 
      });
      
      return data;
    } catch (error) {
      console.error('Error uploading dataset:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to upload dataset' 
      });
      throw error;
    }
  };

  // Function to upload a dataset (multipart form)
  const uploadFileDataset = async (formData) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.datasets.uploadFile(formData);
      
      dispatch({ 
        type: ActionTypes.ADD_DATASET, 
        payload: data.dataset 
      });
      
      return data;
    } catch (error) {
      console.error('Error uploading dataset file:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to upload dataset file' 
      });
      throw error;
    }
  };

  // Function to apply a transformation
  const applyTransformation = async (transformation) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.transformations.create(transformation);
      
      dispatch({ 
        type: ActionTypes.ADD_TRANSFORMATION, 
        payload: data.transformation 
      });
      
      // Update the dataset if needed
      if (data.dataset) {
        dispatch({ 
          type: ActionTypes.UPDATE_DATASET, 
          payload: data.dataset 
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error applying transformation:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to apply transformation' 
      });
      throw error;
    }
  };

  // Function to create a report
  const createReport = async (reportData) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.reports.create(reportData);
      
      dispatch({ 
        type: ActionTypes.ADD_REPORT, 
        payload: data.report 
      });
      
      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to create report' 
      });
      throw error;
    }
  };

  // Function to update a report
  const updateReport = async (id, reportData) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      const data = await apiService.reports.update(id, reportData);
      
      dispatch({ 
        type: ActionTypes.UPDATE_REPORT, 
        payload: data.report 
      });
      
      return data;
    } catch (error) {
      console.error('Error updating report:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to update report' 
      });
      throw error;
    }
  };

  // Function to delete a report
  const deleteReport = async (id) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      await apiService.reports.delete(id);
      
      dispatch({ 
        type: ActionTypes.REMOVE_REPORT, 
        payload: id 
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting report:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to delete report' 
      });
      throw error;
    }
  };

  // Function to delete a dataset
  const deleteDataset = async (datasetId) => {
    dispatch({ type: ActionTypes.FETCH_START });
    
    try {
      await apiService.datasets.delete(datasetId);
      
      dispatch({ 
        type: ActionTypes.REMOVE_DATASET, 
        payload: datasetId 
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting dataset:', error);
      dispatch({ 
        type: ActionTypes.FETCH_FAILURE, 
        payload: error.displayMessage || 'Failed to delete dataset' 
      });
      throw error;
    }
  };

  // Function to export a dataset
  const exportDataset = async (id, format, transformationId) => {
    try {
      const response = await apiService.datasets.export(id, {
        format,
        transformationId
      });
      
      // Handle blob response
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      
      // Set filename from content-disposition header if available
      let filename = 'dataset-export';
      const contentDisposition = response.headers['content-disposition'];
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      // Add extension if not present
      if (!filename.includes('.')) {
        filename += `.${format.toLowerCase()}`;
      }
      
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting dataset:', error);
      throw error;
    }
  };

  // Function to set current dataset
  const setCurrentDataset = (dataset) => {
    dispatch({ 
      type: ActionTypes.SET_CURRENT_DATASET, 
      payload: dataset 
    });
    
    // Fetch transformations for this dataset
    if (dataset) {
      fetchTransformations(dataset.id);
    }
  };

  // Context value
  const value = {
    ...state,
    fetchDatasets,
    fetchDatasetById,
    fetchReports,
    fetchTransformations,
    uploadBase64Dataset,
    uploadFileDataset,
    applyTransformation,
    createReport,
    updateReport,
    deleteReport,
    deleteDataset,
    exportDataset,
    setCurrentDataset
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use data context
export const useData = () => {
  const context = useContext(DataContext);
  
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
};

export default DataContext;