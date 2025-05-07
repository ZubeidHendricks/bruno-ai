import React, { useState, useEffect } from 'react';
import { Send, User, Bot, File, Eye, History, Upload, Download } from 'lucide-react';
import api from '../services/apiService';

const ChatDataPrep = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your Chat Data Prep™ assistant. I can help you clean and transform your financial data using simple natural language commands. What would you like to do with your data today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataPreview, setDataPreview] = useState([]);
  const [operationHistory, setOperationHistory] = useState([]);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [transformedData, setTransformedData] = useState([]);

  // Fetch datasets when component mounts
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const data = await api.datasets.getAllDatasets();
        setDatasets(data);
        
        // If datasets exist, select the first one
        if (data.length > 0) {
          const dataset = await api.datasets.getDataset(data[0].id);
          setSelectedDataset(dataset);
          setDataPreview(dataset.preview || []);
          
          // Add a message about the loaded dataset
          setMessages(prevMessages => [
            ...prevMessages,
            {
              id: Date.now(),
              role: "assistant",
              content: `I've loaded "${dataset.name}" with ${dataset.rowCount} rows of data. What would you like to do with this dataset?`,
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching datasets:', error);
        
        // Add error message
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: Date.now(),
            role: "assistant",
            content: "I encountered an error while loading datasets. Please upload a CSV file to get started.",
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    };
    
    fetchDatasets();
  }, []);

  const handleUserInput = async () => {
    if (!currentInput.trim()) return;

    // Check if we have a dataset selected
    if (!selectedDataset) {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          role: "user",
          content: currentInput,
          timestamp: new Date().toLocaleTimeString()
        },
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Please upload or select a dataset first before performing transformations.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setCurrentInput("");
      return;
    }

    const newMessage = {
      id: Date.now(),
      role: "user",
      content: currentInput,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages([...messages, newMessage]);
    setIsProcessing(true);

    try {
      // Use our API service to process transformation
      const result = await api.transformations.processTransformation(
        currentInput, 
        selectedDataset.id,
        api.auth.getCurrentUser()?.id || 1
      );
      
      // Update state with data from API
      setAiInterpretation(result.interpretation);
      setTransformedData(result.data);
      
      // Update operation history
      setOperationHistory(prevHistory => [
        ...prevHistory,
        {
          step: prevHistory.length + 1,
          action: result.interpretation.intent,
          status: 'completed',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);

      // Add assistant response
      const assistantResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: result.message,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prevMessages => [...prevMessages, assistantResponse]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: `I encountered an error: ${error.message || 'Unknown error'}. Please try again with a different command.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsProcessing(false);
      setCurrentInput("");
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const file = files[0]; // Only process the first file for now
      
      // Convert file to base64
      const fileData = await api.files.readFile(file);
      
      // Upload to server
      const result = await api.datasets.uploadDataset(
        fileData, 
        file.name,
        api.auth.getCurrentUser()?.id || 1
      );
      
      // Update selected dataset and preview data
      setSelectedDataset(result.dataset);
      setDataPreview(result.dataset.preview || []);
      
      // Add message about the uploaded file
      const fileMessage = {
        id: Date.now(),
        role: "assistant",
        content: `I've uploaded "${file.name}" successfully! The dataset contains ${result.dataset.rowCount} rows of data. What would you like to do with this data?`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages([...messages, fileMessage]);
      
      // Refresh datasets list
      const datasets = await api.datasets.getAllDatasets();
      setDatasets(datasets);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      
      const errorMessage = {
        id: Date.now(),
        role: "assistant",
        content: `I encountered an error uploading the file: ${error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages([...messages, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDatasetSelect = async (datasetId) => {
    try {
      const dataset = await api.datasets.getDataset(datasetId);
      setSelectedDataset(dataset);
      setDataPreview(dataset.preview || []);
      
      // Add message about the selected dataset
      const message = {
        id: Date.now(),
        role: "assistant",
        content: `I've loaded "${dataset.name}" with ${dataset.rowCount} rows of data. What would you like to do with this dataset?`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages([...messages, message]);
    } catch (error) {
      console.error('Error selecting dataset:', error);
    }
  };

  const handleExportData = () => {
    if (transformedData && transformedData.length > 0) {
      api.files.downloadCSV(
        transformedData, 
        `transformed_${selectedDataset?.name || 'data'}_${new Date().toISOString().slice(0, 10)}.csv`
      );
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              Chat Data Prep™
              <span className="ml-2 text-sm bg-blue-500 px-2 py-1 rounded">Beta</span>
            </h1>
            <p className="text-sm text-blue-100">Transform your financial data with natural language</p>
          </div>
          <div className="flex items-center space-x-4">
            {datasets.length > 0 && (
              <select
                className="bg-blue-500 text-white px-3 py-2 rounded"
                onChange={(e) => handleDatasetSelect(e.target.value)}
                value={selectedDataset?.id || ''}
              >
                <option value="" disabled>Select Dataset</option>
                {datasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            )}
            <label className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded cursor-pointer flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Upload Data
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-6xl w-full mx-auto">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col bg-white mr-2">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                } rounded-lg p-3 shadow-sm`}>
                  <div className="flex items-start space-x-2">
                    {message.role === 'user' ? 
                      <User className="w-4 h-4 mt-1 flex-shrink-0" /> : 
                      <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                    }
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-75">{message.timestamp}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-gray-600">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t bg-gray-50 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUserInput()}
                placeholder="Type your data transformation request..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button 
                onClick={handleUserInput}
                disabled={isProcessing}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-96 bg-gray-50 border-l overflow-y-auto">
          <div className="p-4 bg-white border-b">
            <h2 className="font-semibold text-gray-800 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Data Preview {selectedDataset && `- ${selectedDataset.name}`}
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {selectedDataset && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Dataset Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Rows: {selectedDataset.rowCount}</div>
                  <div>Format: {selectedDataset.format}</div>
                  <div>Created: {new Date(selectedDataset.createdAt).toLocaleString()}</div>
                </div>
              </div>
            )}

            {dataPreview && dataPreview.length > 0 && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Data Structure</h3>
                <div className="space-y-2">
                  {dataPreview.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.column}</span>
                      <span className="text-gray-500">{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {operationHistory.length > 0 && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <History className="w-4 h-4 mr-2" />
                  Operation History
                </h3>
                <div className="space-y-2">
                  {operationHistory.map((op, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        op.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-gray-600">{op.step}. {op.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiInterpretation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="text-sm font-medium text-blue-800 mb-1">AI Understanding</h3>
                <p className="text-xs text-blue-700 mb-2">
                  {aiInterpretation.explanation}
                </p>
                <div className="mt-2 flex space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                    Proceed
                  </button>
                  <button className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300">
                    Modify
                  </button>
                </div>
              </div>
            )}
            
            {transformedData && transformedData.length > 0 && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <span>Transformed Data Preview</span>
                  <span className="text-xs text-gray-500">{transformedData.length} rows</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {Object.keys(transformedData[0] || {}).map(key => (
                          <th key={key} className="p-1 border-b border-gray-200 text-left">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transformedData.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.keys(row).map(key => (
                            <td key={`${rowIndex}-${key}`} className="p-1 border-b border-gray-200">
                              {row[key]?.toString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 border-t px-4 py-2 text-xs text-gray-600 flex justify-between items-center max-w-6xl w-full mx-auto">
        <div>
          {selectedDataset ? `Dataset: ${selectedDataset.name} • Rows: ${selectedDataset.rowCount}` : 'No dataset selected'}
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center text-blue-600 hover:text-blue-800"
            onClick={handleExportData}
            disabled={!transformedData || transformedData.length === 0}
          >
            <Download className="w-3 h-3 mr-1" />
            Export Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDataPrep;
