import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain } from '@fortawesome/free-solid-svg-icons';

function TabNav() {
  return (
    <div className="bg-white border-b flex items-center">
      <div className="px-6 py-3 font-medium text-gray-800 border-b-2 border-blue-600">Table</div>
      <div className="px-6 py-3 font-medium text-gray-500 hover:text-gray-700 cursor-pointer">Prep</div>
      <div className="px-6 py-3 font-medium text-gray-500 hover:text-gray-700 cursor-pointer">Explore</div>
      <div className="px-6 py-3 font-medium text-gray-500 hover:text-gray-700 cursor-pointer">Report</div>
      <div className="flex-1"></div>
      <button className="mr-6 flex items-center text-gray-600 hover:text-gray-800">
        <FontAwesomeIcon icon={faBrain} className="mr-2" />
        <span>Train a model</span>
      </button>
    </div>
  );
}

export default TabNav;
