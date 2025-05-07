import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  User, 
  Bot, 
  BarChart3, 
  LineChart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle,
  Loader,
  ArrowRight
} from 'lucide-react';
import { useFinancialChat } from '../../hooks/useFinancialChat';

const FinancialChatInterface = ({ financialData, onRequestVisualization }) => {
  const { messages, isProcessing, sendMessage, generateInsight } = useFinancialChat();
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);
  const [suggestedQueries, setSuggestedQueries] = useState([
    "What is our current profit margin?",
    "Analyze our revenue trend for the last 6 months",
    "What are our biggest expense categories?",
    "How does our cash flow compare to last quarter?",
    "Which products have the highest profitability?"
  ]);

  useEffect(() => {
    // Scroll to bottom when messages change
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    
    await sendMessage(userMessage, financialData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    
    // Focus on the input
    document.getElementById('financial-chat-input').focus();
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'chart':
        return <BarChart3 className="h-5 w-5 text-purple-500" />;
      case 'trend':
        return <LineChart className="h-5 w-5 text-blue-500" />;
      case 'insight':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'bot':
        return <Bot className="h-5 w-5 text-gray-500" />;
      case 'user':
      default:
        return <User className="h-5 w-5 text-blue-500" />;
    }
  };

  const renderMessageContent = (message) => {
    if (message.visualizationRequest) {
      return (
        <div>
          <p className="mb-2">{message.content}</p>
          <button 
            onClick={() => onRequestVisualization(message.visualizationRequest)}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Visualization <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      );
    }
    
    if (message.metrics) {
      return (
        <div>
          <p className="mb-2">{message.content}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.entries(message.metrics).map(([key, value], idx) => (
              <div key={idx} className="bg-gray-100 p-2 rounded">
                <span className="text-xs text-gray-500">{key}</span>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return message.content;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 mr-2" />
          <div>
            <h3 className="font-semibold">Financial Assistant</h3>
            <p className="text-xs text-blue-200">Powered by AI</p>
          </div>
        </div>
        <HelpCircle className="h-5 w-5 text-blue-200 hover:text-white cursor-pointer" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-blue-100 mb-3" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Financial Analysis Assistant</h3>
            <p className="text-gray-500 max-w-md mb-6">
              Ask questions about your financial data in natural language. Get insights, trends, and recommendations.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  className="text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center"
                  onClick={() => handleSuggestionClick(query)}
                >
                  <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{query}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3/4 rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-50 text-gray-800' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-2">
                    {message.role === 'user' 
                      ? getMessageIcon('user')
                      : getMessageIcon(message.type || 'bot')
                    }
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      {renderMessageContent(message)}
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {message.timestamp}
                      </span>
                      {message.role !== 'user' && message.confidence && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          message.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                          message.confidence > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(message.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center">
                <Loader className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                <span className="text-gray-600">Analyzing financial data...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="border-t bg-gray-50 p-4">
        <div className="flex space-x-2">
          <input
            id="financial-chat-input"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your financial data..."
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !input.trim()}
            className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => generateInsight(financialData)}
            disabled={isProcessing}
            className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Insight
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialChatInterface;
