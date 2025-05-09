import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faPlus, 
  faDownload, 
  faShareAlt,
  faEdit,
  faTrash,
  faSearch,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

const ReportsList = () => {
  const [reports, setReports] = useState([
    {
      id: 1,
      name: 'Q3 Financial Summary',
      type: 'Financial Statement',
      createdAt: '2023-10-15',
      updatedAt: '2023-10-18',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Revenue Analysis 2023',
      type: 'Analysis',
      createdAt: '2023-09-25',
      updatedAt: '2023-10-12',
      status: 'completed'
    },
    {
      id: 3,
      name: 'Budget Planning 2024',
      type: 'Planning',
      createdAt: '2023-10-10',
      updatedAt: '2023-10-10',
      status: 'draft'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Filter reports based on search term and selected filter
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || report.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });
  
  const handleDeleteReport = (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      setReports(reports.filter(report => report.id !== id));
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          New Report
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex flex-wrap justify-between items-center">
          <div className="relative w-64 mb-2 sm:mb-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Reports</option>
                <option value="completed">Completed</option>
                <option value="draft">Drafts</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <FontAwesomeIcon icon={faFilter} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faFileAlt} className="text-blue-500 mr-3" />
                        <div className="text-sm font-medium text-gray-900">{report.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{report.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{report.createdAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{report.updatedAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status === 'completed' ? 'Completed' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-3">
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <FontAwesomeIcon icon={faShareAlt} />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsList;