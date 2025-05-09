import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter, 
  faFileAlt,
  faMoneyBillWave,
  faChartLine,
  faCalendarAlt,
  faUser,
  faBuilding,
  faListAlt
} from '@fortawesome/free-solid-svg-icons';

const SearchInterface = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    documents: true,
    transactions: true,
    metrics: true,
    date: 'any'
  });
  
  // Mock search function
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock results
      const mockResults = [
        {
          id: 1,
          type: 'document',
          title: 'Q3 Financial Report',
          snippet: 'The quarterly financial report shows a 15% increase in revenue compared to Q2.',
          date: '2023-10-15',
          icon: faFileAlt
        },
        {
          id: 2,
          type: 'transaction',
          title: 'Payment to Vendor XYZ',
          snippet: 'Payment of $15,000 for IT services rendered in September 2023.',
          date: '2023-10-05',
          icon: faMoneyBillWave
        },
        {
          id: 3,
          type: 'metric',
          title: 'Revenue Growth Rate',
          snippet: 'Current revenue growth rate is 12.5% year-over-year, exceeding target by 2.5%.',
          date: '2023-10-10',
          icon: faChartLine
        },
        {
          id: 4,
          type: 'document',
          title: 'Annual Budget Planning',
          snippet: 'The 2024 budget allocates 30% more resources to R&D compared to 2023.',
          date: '2023-09-28',
          icon: faFileAlt
        }
      ];
      
      // Filter results based on selected filters
      const filteredResults = mockResults.filter(result => {
        const matchesType = 
          (result.type === 'document' && selectedFilters.documents) ||
          (result.type === 'transaction' && selectedFilters.transactions) ||
          (result.type === 'metric' && selectedFilters.metrics);
        
        let matchesDate = true;
        if (selectedFilters.date !== 'any') {
          const resultDate = new Date(result.date);
          const now = new Date();
          
          if (selectedFilters.date === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            matchesDate = resultDate >= weekAgo;
          } else if (selectedFilters.date === 'month') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            matchesDate = resultDate >= monthAgo;
          } else if (selectedFilters.date === 'quarter') {
            const quarterAgo = new Date(now.setMonth(now.getMonth() - 3));
            matchesDate = resultDate >= quarterAgo;
          }
        }
        
        return matchesType && matchesDate;
      });
      
      setSearchResults(filteredResults);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleFilterChange = (filter) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };
  
  const handleDateFilterChange = (e) => {
    setSelectedFilters(prev => ({
      ...prev,
      date: e.target.value
    }));
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Financial Intelligence Search</h1>
        <p className="text-gray-600">Search across all your financial data using natural language</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <form onSubmit={handleSearch}>
          <div className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search financial data, transactions, metrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </div>
              ) : (
                'Search'
              )}
            </button>
          </div>
          
          <div className="mt-4 flex flex-wrap items-center">
            <div className="mr-8 flex items-center mb-2">
              <span className="mr-2 text-gray-600"><FontAwesomeIcon icon={faFilter} /> Filters:</span>
            </div>
            
            <div className="flex flex-wrap">
              <label className="flex items-center mr-4 mb-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={selectedFilters.documents}
                  onChange={() => handleFilterChange('documents')}
                />
                <span className="ml-2 text-gray-700">Documents</span>
              </label>
              
              <label className="flex items-center mr-4 mb-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={selectedFilters.transactions}
                  onChange={() => handleFilterChange('transactions')}
                />
                <span className="ml-2 text-gray-700">Transactions</span>
              </label>
              
              <label className="flex items-center mr-4 mb-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={selectedFilters.metrics}
                  onChange={() => handleFilterChange('metrics')}
                />
                <span className="ml-2 text-gray-700">Metrics</span>
              </label>
              
              <div className="flex items-center mb-2">
                <span className="mr-2 text-gray-700">Time:</span>
                <select
                  className="form-select py-1 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedFilters.date}
                  onChange={handleDateFilterChange}
                >
                  <option value="any">Any time</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                  <option value="quarter">Past quarter</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Search Suggestions */}
      {!searchQuery && searchResults.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Suggested Searches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-md hover:bg-blue-50 cursor-pointer">
              <div className="flex items-center text-blue-600 mb-2">
                <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                <span className="font-medium">Performance Metrics</span>
              </div>
              <p className="text-sm text-gray-600">Find all performance metrics for the current fiscal year</p>
            </div>
            
            <div className="p-4 border rounded-md hover:bg-blue-50 cursor-pointer">
              <div className="flex items-center text-blue-600 mb-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                <span className="font-medium">Recent Transactions</span>
              </div>
              <p className="text-sm text-gray-600">View all transactions from the past 30 days</p>
            </div>
            
            <div className="p-4 border rounded-md hover:bg-blue-50 cursor-pointer">
              <div className="flex items-center text-blue-600 mb-2">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                <span className="font-medium">Vendor Payments</span>
              </div>
              <p className="text-sm text-gray-600">Search payments to specific vendors</p>
            </div>
            
            <div className="p-4 border rounded-md hover:bg-blue-50 cursor-pointer">
              <div className="flex items-center text-blue-600 mb-2">
                <FontAwesomeIcon icon={faBuilding} className="mr-2" />
                <span className="font-medium">Department Expenses</span>
              </div>
              <p className="text-sm text-gray-600">Compare expenses across departments</p>
            </div>
            
            <div className="p-4 border rounded-md hover:bg-blue-50 cursor-pointer">
              <div className="flex items-center text-blue-600 mb-2">
                <FontAwesomeIcon icon={faListAlt} className="mr-2" />
                <span className="font-medium">Quarterly Reports</span>
              </div>
              <p className="text-sm text-gray-600">Access all quarterly financial reports</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Search Results</h2>
            <span className="text-sm text-gray-600">{searchResults.length} results found</span>
          </div>
          
          <div className="space-y-4">
            {searchResults.map(result => (
              <div key={result.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
                <div className="flex">
                  <div className="mr-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FontAwesomeIcon icon={result.icon} className="text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">{result.title}</h3>
                      <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                        {result.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{result.snippet}</p>
                    <div className="text-sm text-gray-500">
                      {new Date(result.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* No Results */}
      {searchQuery && !isLoading && searchResults.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <FontAwesomeIcon icon={faSearch} size="3x" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any financial data matching "{searchQuery}"
          </p>
          <div className="text-sm text-gray-600">
            Try using different keywords or adjusting your filters
          </div>
        </div>
      )}
      
      {/* AI-Powered Insights */}
      {searchResults.length > 0 && (
        <div className="mt-8 bg-blue-50 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">AI-Powered Insights</h3>
          <p className="text-gray-700 mb-4">
            Based on your search for "{searchQuery}", our AI has identified these potential insights:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              </div>
              <p className="ml-3 text-gray-700">
                There has been a consistent upward trend in revenue over the past three quarters.
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              </div>
              <p className="ml-3 text-gray-700">
                The budget allocation for R&D is significantly higher than industry averages.
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              </div>
              <p className="ml-3 text-gray-700">
                Vendor XYZ payments have increased by 22% compared to the same period last year.
              </p>
            </li>
          </ul>
          <div className="mt-4 text-right">
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              Generate full AI analysis →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;