import React, { createContext, useContext, useReducer } from 'react';
import apiService from '../services/apiService';

// Initial state
const initialState = {
  loading: false,
  error: null,
  messages: [],
  searchResults: [],
  insights: null,
  recentQueries: [],
  vectorDatabaseStatus: null,
  processingStatus: null
};

// Action types
const ActionTypes = {
  REQUEST_START: 'REQUEST_START',
  REQUEST_SUCCESS: 'REQUEST_SUCCESS',
  REQUEST_FAILURE: 'REQUEST_FAILURE',
  ADD_MESSAGE: 'ADD_MESSAGE',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_INSIGHTS: 'SET_INSIGHTS',
  CLEAR_INSIGHTS: 'CLEAR_INSIGHTS',
  ADD_RECENT_QUERY: 'ADD_RECENT_QUERY',
  CLEAR_RECENT_QUERIES: 'CLEAR_RECENT_QUERIES',
  SET_VECTOR_DB_STATUS: 'SET_VECTOR_DB_STATUS',
  SET_PROCESSING_STATUS: 'SET_PROCESSING_STATUS'
};

// Reducer function
const aiReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null
      };
    case ActionTypes.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case ActionTypes.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case ActionTypes.CLEAR_MESSAGES:
      return {
        ...state,
        messages: []
      };
    case ActionTypes.SET_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: action.payload
      };
    case ActionTypes.SET_INSIGHTS:
      return {
        ...state,
        insights: action.payload
      };
    case ActionTypes.CLEAR_INSIGHTS:
      return {
        ...state,
        insights: null
      };
    case ActionTypes.ADD_RECENT_QUERY:
      // Add to front of the list and remove duplicates
      const queries = [
        action.payload,
        ...state.recentQueries.filter(q => q.text !== action.payload.text)
      ].slice(0, 10); // Keep only the 10 most recent queries
      
      return {
        ...state,
        recentQueries: queries
      };
    case ActionTypes.CLEAR_RECENT_QUERIES:
      return {
        ...state,
        recentQueries: []
      };
    case ActionTypes.SET_VECTOR_DB_STATUS:
      return {
        ...state,
        vectorDatabaseStatus: action.payload
      };
    case ActionTypes.SET_PROCESSING_STATUS:
      return {
        ...state,
        processingStatus: action.payload
      };
    default:
      return state;
  }
};

// Create context
const AIContext = createContext();

// AI provider component
export const AIProvider = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  // Function to ask a question to the AI
  const askQuestion = async (question, context = {}) => {
    dispatch({ type: ActionTypes.REQUEST_START });
    
    try {
      // Add user message to chat history
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date()
      };
      
      dispatch({ 
        type: ActionTypes.ADD_MESSAGE, 
        payload: userMessage 
      });
      
      // Add to recent queries
      dispatch({ 
        type: ActionTypes.ADD_RECENT_QUERY, 
        payload: {
          id: userMessage.id,
          text: question,
          timestamp: new Date()
        } 
      });
      
      // Make API call
      const data = await apiService.ai.chat(question, context);
      
      // Add AI response to chat history
      const aiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      dispatch({ 
        type: ActionTypes.ADD_MESSAGE, 
        payload: aiMessage 
      });
      
      dispatch({ type: ActionTypes.REQUEST_SUCCESS });
      
      return data;
    } catch (error) {
      console.error('Error asking question:', error);
      
      // Add error message to chat history
      const errorMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Error: ${error.displayMessage || 'Failed to get AI response'}`,
        timestamp: new Date(),
        isError: true
      };
      
      dispatch({ 
        type: ActionTypes.ADD_MESSAGE, 
        payload: errorMessage 
      });
      
      dispatch({ 
        type: ActionTypes.REQUEST_FAILURE, 
        payload: error.displayMessage || 'Failed to get AI response' 
      });
      
      throw error;
    }
  };

  // Function to search for financial data
  const searchFinancialData = async (query, filters = {}) => {
    dispatch({ type: ActionTypes.REQUEST_START });
    
    try {
      // Make API call
      const data = await apiService.ai.search(query, filters);
      
      dispatch({ 
        type: ActionTypes.SET_SEARCH_RESULTS, 
        payload: data.results 
      });
      
      // Add to recent queries if it's a user-initiated search
      if (!filters.isSystemQuery) {
        dispatch({ 
          type: ActionTypes.ADD_RECENT_QUERY, 
          payload: {
            id: Date.now().toString(),
            text: query,
            timestamp: new Date(),
            type: 'search'
          } 
        });
      }
      
      dispatch({ type: ActionTypes.REQUEST_SUCCESS });
      
      return data;
    } catch (error) {
      console.error('Error searching financial data:', error);
      dispatch({ 
        type: ActionTypes.REQUEST_FAILURE, 
        payload: error.displayMessage || 'Failed to search financial data' 
      });
      throw error;
    }
  };

  // Function to generate AI insights from data
  const generateInsights = async (data, options = {}) => {
    dispatch({ type: ActionTypes.REQUEST_START });
    
    try {
      // Make API call
      const responseData = await apiService.ai.generateInsights(data, options);
      
      dispatch({ 
        type: ActionTypes.SET_INSIGHTS, 
        payload: responseData.insights 
      });
      
      dispatch({ type: ActionTypes.REQUEST_SUCCESS });
      
      return responseData;
    } catch (error) {
      console.error('Error generating insights:', error);
      dispatch({ 
        type: ActionTypes.REQUEST_FAILURE, 
        payload: error.displayMessage || 'Failed to generate insights' 
      });
      throw error;
    }
  };

  // Function to clear the chat history
  const clearChat = () => {
    dispatch({ type: ActionTypes.CLEAR_MESSAGES });
  };

  // Function to check vector database status
  const checkVectorDBStatus = async () => {
    try {
      // Make API call
      const data = await apiService.ai.vectorStatus();
      
      dispatch({ 
        type: ActionTypes.SET_VECTOR_DB_STATUS, 
        payload: data 
      });
      
      return data;
    } catch (error) {
      console.error('Error checking vector database status:', error);
      dispatch({ 
        type: ActionTypes.SET_VECTOR_DB_STATUS, 
        payload: { status: 'error', error: error.displayMessage || error.message } 
      });
      return { status: 'error', error: error.displayMessage || error.message };
    }
  };

  // Context value
  const value = {
    ...state,
    askQuestion,
    searchFinancialData,
    generateInsights,
    clearChat,
    checkVectorDBStatus
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

// Custom hook to use AI context
export const useAI = () => {
  const context = useContext(AIContext);
  
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  
  return context;
};

export default AIContext;