import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-regular-svg-icons';

function PreviewSection() {
  return (
    <>
      <div className="flex items-center mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <FontAwesomeIcon icon={faEye} className="mr-1" />
          <span>Previewing 100 rows</span>
        </div>
        <div className="ml-4 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
          2.3% of preview rows were removed
        </div>
      </div>

      <div className="flex mb-4">
        <button className="px-4 py-1 border rounded-l text-gray-700 bg-gray-50 hover:bg-gray-100">Cancel</button>
        <button className="px-4 py-1 border border-l-0 rounded-r bg-blue-600 text-white hover:bg-blue-700">Apply Transform</button>
      </div>
    </>
  );
}

export default PreviewSection;
