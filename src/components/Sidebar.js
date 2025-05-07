import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faPlus } from '@fortawesome/free-solid-svg-icons';

function Sidebar() {
  return (
    <div className="w-16 bg-white border-r flex flex-col items-center py-4 fixed top-14 bottom-0">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
        <FontAwesomeIcon icon={faTable} />
      </div>
      <div className="text-xs text-center text-gray-600 font-medium">Table</div>
      <div className="mt-6 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer">
        <FontAwesomeIcon icon={faPlus} />
      </div>
    </div>
  );
}

export default Sidebar;
