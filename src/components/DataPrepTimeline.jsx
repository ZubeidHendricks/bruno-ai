import React, { useState } from 'react';
import {
  Upload,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  Database,
  RefreshCw,
  Filter,
  ChevronRight,
  BarChart2,
  Search,
  Zap
} from 'lucide-react';

const DataPrepTimeline = () => {
  const [expandedStep, setExpandedStep] = useState(null);
  
  const toggleStep = (step) => {
    if (expandedStep === step) {
      setExpandedStep(null);
    } else {
      setExpandedStep(step);
    }
  };
  
  // Define timeline steps
  const timelineSteps = [
    {
      id: 1,
      title: 'Data Ingestion',
      description: 'Upload and initial parsing of raw financial data',
      icon: Upload,
      color: 'blue',
      status: 'completed',
      details: [
        'CSV and Excel file upload via the interface',
        'Automatic detection of column types and data structure',
        'Extraction of header information and sample values',
        'Basic validation of data integrity and format consistency',
        'Initial metadata extraction including source, date, and size'
      ],
      example: `Financial data uploaded: Q2_Financial_Data.csv
File size: 1.2MB
Detected 6 columns: Date, Transaction, Amount, Category, Department, CustomerID
Sample values shown in preview panel
Initial validation: No critical errors detected`,
      time: '10:31 AM'
    },
    {
      id: 2,
      title: 'Natural Language Processing',
      description: 'Interpretation of user commands in everyday language',
      icon: MessageSquare,
      color: 'indigo',
      status: 'completed',
      details: [
        'Natural language request submitted through chat interface',
        'Request parsed by OpenAI language model with custom instructions',
        'Intent classification into transformation operation type',
        'Extraction of parameters, columns, and conditions from user text',
        'Mapping of intent to executable data transformations'
      ],
      example: `User request: "Remove duplicate transactions based on transaction ID"

AI interpretation:
{
  "intent": "Remove duplicate entries",
  "operation": "remove_duplicates",
  "columns": ["TransactionID"],
  "explanation": "Removing duplicate transactions based on the Transaction ID column"
}`,
      time: '10:32 AM'
    },
    {
      id: 3,
      title: 'Data Transformation',
      description: 'Execution of the interpreted commands on the dataset',
      icon: RefreshCw,
      color: 'purple',
      status: 'completed',
      details: [
        'Conversion of interpreted intent into data operations',
        'Application of transformations using memory-efficient algorithms',
        'Tracking of transformation metadata for history and auditing',
        'Comparison of before/after states for validation',
        'Calculation of transformation impact statistics'
      ],
      example: `Applying remove_duplicates operation:
- Target columns: ["TransactionID"]
- Original row count: 1,247
- Duplicates found: 3
- New row count: 1,244
- Operation duration: 0.5s
- Transformation log entry created`,
      time: '10:32 AM'
    },
    {
      id: 4,
      title: 'Data Validation',
      description: 'Ensure data quality after transformation',
      icon: CheckCircle,
      color: 'green',
      status: 'completed',
      details: [
        'Verification of data integrity after transformation',
        'Detection of any anomalies created by the transformation',
        'Validation of data types and constraints',
        'Statistical comparison of distribution before and after',
        'Quality assurance checks customized for financial data'
      ],
      example: `Validation checks:
- All columns preserved ✓
- No null values introduced ✓
- Data types maintained ✓
- Financial totals consistent ✓
- Statistical distribution verified ✓
- No outliers created ✓`,
      time: '10:32 AM'
    },
    {
      id: 5,
      title: 'Vector Embedding',
      description: 'Semantic representation of financial data',
      icon: Database,
      color: 'teal',
      status: 'completed',
      details: [
        'Generation of vector embeddings for transformed data',
        'Mapping of financial terms to semantic vector space',
        'Creation of searchable vector indices in Weaviate',
        'Linking of transforms with their semantic representation',
        'Preparation for similarity and pattern detection'
      ],
      example: `Vector embeddings generated:
- Dimension: 1,536 (OpenAI Ada-002)
- Documents vectorized: 1,244
- Vector indices created in Weaviate
- Financial entities linked to vectors
- Semantic search enabled`,
      time: '10:33 AM'
    },
    {
      id: 6,
      title: 'Pattern Analysis',
      description: 'Detecting financial patterns and anomalies',
      icon: Search,
      color: 'orange',
      status: 'completed',
      details: [
        'Identification of patterns in financial data',
        'Time-series analysis for seasonal variations',
        'Detection of outliers and anomalous transactions',
        'Correlation analysis between financial metrics',
        'Categorization of spending patterns and trends'
      ],
      example: `Pattern analysis performed:
- 3 spending cycles identified
- 2 seasonal patterns detected
- 5 potential anomalies flagged
- Revenue correlation with marketing: 0.76
- Growth trend coefficient: 0.34`,
      time: '10:33 AM'
    },
    {
      id: 7,
      title: 'Insight Generation',
      description: 'AI-powered insights from the processed data',
      icon: Zap,
      color: 'amber',
      status: 'completed',
      details: [
        'Combining historical data with current trends',
        'Application of financial intelligence models',
        'Generation of business-relevant insights',
        'Prioritization of actionable recommendations',
        'Presentation of findings in human-readable format'
      ],
      example: `Generated insights:
- Revenue shows 15% growth compared to previous quarter
- Top performing category: Professional Services (+23%)
- Marketing ROI has improved by 12% 
- Customer acquisition cost reduced by 8.5%
- Recommendation: Increase investment in Professional Services`,
      time: '10:34 AM'
    },
    {
      id: 8,
      title: 'Visualization Preparation',
      description: 'Formatting data for interactive visualizations',
      icon: BarChart2,
      color: 'red',
      status: 'completed',
      details: [
        'Structure data for different visualization types',
        'Aggregation of metrics for dashboard displays',
        'Calculation of comparative metrics against benchmarks',
        'Formatting of time-series data for trend visualization',
        'Preparation of drill-down data hierarchies'
      ],
      example: `Visualization data prepared:
- Time series data normalized
- KPI metrics calculated
- Comparison benchmarks established
- Color scales determined based on values
- Interactive drill-down hierarchy created`,
      time: '10:34 AM'
    }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Data Preparation Timeline</h2>
        <p className="text-gray-600">How raw financial data becomes actionable insights</p>
      </div>
      
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>
        
        {/* Timeline steps */}
        <div className="space-y-6">
          {timelineSteps.map((step) => (
            <div key={step.id} className="relative">
              {/* Step with icon */}
              <div className="flex flex-col md:flex-row">
                {/* Icon */}
                <div className="flex-shrink-0 relative z-10">
                  <div className={`w-16 h-16 mx-auto md:mx-0 rounded-full flex items-center justify-center bg-${step.color}-100 text-${step.color}-600 border-4 border-white`}>
                    <step.icon size={24} />
                  </div>
                </div>
                
                {/* Content */}
                <div className="mt-3 md:mt-0 md:ml-6 flex-1">
                  <div 
                    className={`bg-white p-4 rounded-lg border ${expandedStep === step.id ? `border-${step.color}-200` : 'border-gray-200'} hover:border-${step.color}-200 transition-colors cursor-pointer`}
                    onClick={() => toggleStep(step.id)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{step.time}</span>
                        <span className={`p-1 rounded-full ${step.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          {step.status === 'completed' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mt-1">{step.description}</p>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex items-center text-sm text-blue-600">
                        <span>{expandedStep === step.id ? 'Hide details' : 'Show details'}</span>
                        <ChevronRight 
                          size={16} 
                          className={`ml-1 transition-transform ${expandedStep === step.id ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </div>
                    
                    {/* Expanded details */}
                    {expandedStep === step.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animation-expand">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Process Details:</h4>
                          <ul className="space-y-1">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start text-sm">
                                <span className="text-green-500 mr-2">•</span>
                                <span className="text-gray-600">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Example Output:</h4>
                          <div className="bg-gray-50 rounded-md p-3 text-xs font-mono text-gray-700 whitespace-pre-wrap">
                            {step.example}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Final outcome */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
            <CheckCircle size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Final Outcome: Analysis-Ready Financial Dashboard</h3>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-gray-700">
            The raw financial data has been transformed, analyzed, and is now presented in an interactive dashboard with AI-powered insights. Users can explore trends, patterns, and anomalies through visualizations and receive actionable recommendations based on the underlying data.
          </p>
          <div className="mt-4 flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex items-center">
              <FileText size={16} className="text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Processed 1,244 transactions</span>
            </div>
            <div className="flex items-center">
              <Filter size={16} className="text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Removed 3 duplicates</span>
            </div>
            <div className="flex items-center">
              <Zap size={16} className="text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Generated 5 actionable insights</span>
            </div>
            <div className="flex items-center">
              <BarChart2 size={16} className="text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Created 8 visualizations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPrepTimeline;