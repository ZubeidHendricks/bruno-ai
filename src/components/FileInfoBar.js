import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt } from '@fortawesome/free-regular-svg-icons';

function FileInfoBar() {
  return (
    <div className="px-6 py-3 border-b flex items-center">
      <div className="flex items-center">
        <FontAwesomeIcon icon={faFileAlt} className="text-orange-500 mr-2" />
        <span className="text-gray-700 font-medium">Financial Data Demo.csv</span>
        <span className="ml-2 text-blue-600 text-sm cursor-pointer">Replace</span>
      </div>
      <div className="ml-6 text-gray-500 text-sm">2,485 rows, 26 columns</div>
      <div className="ml-6 text-gray-500 text-sm">No transforms applied</div>
    </div>
  );
}

export default FileInfoBar;
