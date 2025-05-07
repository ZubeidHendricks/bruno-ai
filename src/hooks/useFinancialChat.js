import { useState, useCallback } from 'react';
import axios from 'axios';

export const useFinancialChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your financial analysis assistant. I can help you analyze your financial data, generate insights, and answer questions about your business performance.',
      timestamp: new Date().toLocaleTimeString(),
      type: 'bot'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to format responses based on content type
  const formatResponse = (response) => {
    // Format timestamp
    const timestamp = new Date().toLocaleTimeString();
    
    // Check if response includes visualization request
    if (response.visualizationRequest) {
      return {
        role: 'assistant',
        content: response.content,
        visualizationRequest: response.visualizationRequest,
        timestamp,
        type: 'chart',
        confidence: response.confidence || 0.9
      };
    }
    
    // Check if response includes metrics
    if (response.metrics) {
      return {
        role: 'assistant',
        content: response.content,
        metrics: response.metrics,
        timestamp,
        type: 'insight',
        confidence: response.confidence || 0.9
      };
    }
    
    // Default response format
    return {
      role: 'assistant',
      content: typeof response === 'string' ? response : response.content,
      timestamp,
      type: response.type || 'bot',
      confidence: response.confidence || 0.9
    };
  };

  const sendMessage = useCallback(async (message, financialData) => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    try {
      // In a production environment, this would call the actual API
      // For this implementation, we'll simulate the response
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Parse the query and generate a response
      const response = await processFinancialQuery(message, financialData);
      
      // Format and add response to chat
      const formattedResponse = formatResponse(response);
      setMessages(prev => [...prev, formattedResponse]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error processing your query. Please try again or rephrase your question.',
        timestamp: new Date().toLocaleTimeString(),
        type: 'bot',
        confidence: 0
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateInsight = useCallback(async (financialData) => {
    setIsProcessing(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a random insight
      const insights = [
        {
          content: "Your revenue shows an increasing trend over the last quarter with a growth rate of 12.5%. This outperforms your industry average of 8.3%.",
          metrics: {
            "Growth Rate": "+12.5%",
            "Industry Average": "+8.3%",
            "Performance": "Above average"
          },
          type: 'insight',
          confidence: 0.92
        },
        {
          content: "I've detected a potential cash flow issue in the upcoming quarter based on your current burn rate and receivables timeline.",
          metrics: {
            "Current Burn Rate": "€120K/month",
            "Receivables Timeline": "45 days avg",
            "Risk Level": "Medium"
          },
          type: 'warning',
          confidence: 0.85
        },
        {
          content: "Your top expense category is marketing at 32% of total expenses, which is 8% higher than last year. Consider reviewing marketing efficiency metrics.",
          metrics: {
            "Marketing Expenses": "32% of total",
            "Year-over-Year Change": "+8%",
            "Industry Benchmark": "25%"
          },
          type: 'insight',
          confidence: 0.88
        },
        {
          content: "Your profit margin has improved by 3.2 percentage points compared to the previous quarter, primarily driven by reduced operational costs.",
          metrics: {
            "Current Profit Margin": "24.7%",
            "Previous Quarter": "21.5%",
            "Improvement Driver": "Operational costs"
          },
          type: 'insight',
          confidence: 0.94
        }
      ];
      
      // Randomly select an insight
      const randomInsight = insights[Math.floor(Math.random() * insights.length)];
      
      // Add insight to chat
      setMessages(prev => [...prev, formatResponse(randomInsight)]);
    } catch (error) {
      console.error('Error generating insight:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error generating an insight. Please try again later.',
        timestamp: new Date().toLocaleTimeString(),
        type: 'bot',
        confidence: 0
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    messages,
    isProcessing,
    sendMessage,
    generateInsight
  };
};

// Simulated function to process financial queries
// In a real implementation, this would connect to the backend
async function processFinancialQuery(query, financialData) {
  // Simple keyword-based response generation
  const lowerQuery = query.toLowerCase();
  
  // Visualization requests
  if (lowerQuery.includes('chart') || lowerQuery.includes('visualize') || lowerQuery.includes('graph') || lowerQuery.includes('plot') || lowerQuery.includes('show me')) {
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales')) {
      return {
        content: "I've prepared a revenue visualization for you. Here's a chart showing your revenue trends over time.",
        visualizationRequest: {
          type: 'line',
          title: 'Revenue Trend',
          dataKey: 'revenue',
          timeUnit: 'month'
        },
        confidence: 0.95,
        type: 'chart'
      };
    }
    
    if (lowerQuery.includes('expense') || lowerQuery.includes('cost')) {
      return {
        content: "I've prepared an expense breakdown visualization for you. Here's a chart showing your expense categories.",
        visualizationRequest: {
          type: 'pie',
          title: 'Expense Breakdown',
          dataKey: 'expenses',
          groupBy: 'category'
        },
        confidence: 0.93,
        type: 'chart'
      };
    }
    
    if (lowerQuery.includes('profit')) {
      return {
        content: "I've prepared a profit margin visualization for you. Here's a chart showing your profit margin over time.",
        visualizationRequest: {
          type: 'bar',
          title: 'Profit Margin',
          dataKey: 'profitMargin',
          timeUnit: 'quarter'
        },
        confidence: 0.91,
        type: 'chart'
      };
    }
  }
  
  // Trend analysis
  if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('history')) {
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales')) {
      return {
        content: "Based on your financial data, revenue has been showing an upward trend with an average growth rate of 8.5% quarter-over-quarter. Q2 2024 showed the strongest performance with a 15.2% increase.",
        type: 'trend',
        confidence: 0.89
      };
    }
    
    if (lowerQuery.includes('expense') || lowerQuery.includes('cost')) {
      return {
        content: "Your expenses have remained relatively stable with a slight downward trend of 2.1% over the past 6 months. The biggest reduction was in operational costs, which decreased by 7.3%.",
        type: 'trend',
        confidence: 0.87
      };
    }
  }
  
  // Metrics and specific questions
  if (lowerQuery.includes('profit margin') || lowerQuery.includes('profitability')) {
    return {
      content: "Your current profit margin is 24.7%, which is a 3.2 percentage point improvement over the previous quarter. This puts you in the top 30% of your industry peers.",
      metrics: {
        "Current Profit Margin": "24.7%",
        "Previous Quarter": "21.5%",
        "Industry Percentile": "Top 30%"
      },
      type: 'insight',
      confidence: 0.94
    };
  }
  
  if (lowerQuery.includes('cash flow') || lowerQuery.includes('liquidity')) {
    return {
      content: "Your current cash flow position shows a healthy liquidity ratio of 2.1. Based on your burn rate and receivables, you have approximately 8.5 months of runway.",
      metrics: {
        "Liquidity Ratio": "2.1",
        "Cash Runway": "8.5 months",
        "Burn Rate": "€120K/month"
      },
      type: 'insight',
      confidence: 0.92
    };
  }
  
  // Default response for unknown queries
  return {
    content: "I'm not sure I understand your question completely. Could you provide more details or rephrase your query? You can ask about revenue trends, expense breakdowns, profit margins, or cash flow analysis.",
    type: 'bot',
    confidence: 0.6
  };
}
