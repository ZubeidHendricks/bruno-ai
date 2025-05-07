import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

function ChatInput() {
  return (
    <div className="bg-white border rounded-lg shadow-sm mb-6">
      <div className="p-4 flex items-center">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
          <FontAwesomeIcon icon={faRobot} />
        </div>
        <input 
          type="text" 
          defaultValue="remove the outliers from revenue_q1" 
          className="flex-1 border-0 focus:ring-0 text-gray-700" 
          placeholder="Ask a question about your data..."
        />
      </div>
    </div>
  );
}

export default ChatInput;
