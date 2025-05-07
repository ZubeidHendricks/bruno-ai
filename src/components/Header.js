import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faHistory, faRocket, faPencilAlt } from '@fortawesome/free-solid-svg-icons';

function Header() {
  return (
    <header className="bg-white shadow-sm border-b flex items-center px-4 py-2 fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center">
        <div className="h-8 w-8 mr-2 bg-blue-600 rounded-md flex items-center justify-center text-white">
          <span className="font-bold">B</span>
        </div>
        <h1 className="text-xl font-semibold text-blue-600">Bruno AI</h1>
      </div>
      <div className="ml-6 text-gray-700">Financial Intelligence Demo</div>
      <div className="ml-4 text-gray-400 cursor-pointer">
        <FontAwesomeIcon icon={faPencilAlt} />
      </div>
      <div className="flex-1"></div>
      <div className="flex space-x-4">
        <button className="flex items-center text-gray-600 hover:text-gray-800">
          <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
          <span>Get Support</span>
        </button>
        <button className="flex items-center text-gray-600 hover:text-gray-800">
          <FontAwesomeIcon icon={faHistory} className="mr-2" />
          <span>History</span>
        </button>
        <button className="flex items-center text-blue-600 hover:text-blue-800">
          <FontAwesomeIcon icon={faRocket} className="mr-2" />
          <span>Show Deployment</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
