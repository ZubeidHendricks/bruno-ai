import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClone } from '@fortawesome/free-regular-svg-icons';

function AIInterpretation() {
  return (
    <div className="bg-blue-50 rounded-lg border p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-gray-700 font-medium">AI Interpretation</div>
        <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <FontAwesomeIcon icon={faClone} className="mr-1" /> Clone
        </button>
      </div>
      <p className="text-sm text-gray-700">
        Remove outliers from the "revenue_q1" column of the input dataframe by calculating the z-score for each value in the column and removing any values that are more than 3 standard deviations away from the mean. The transformed dataframe will be returned as output.
      </p>
    </div>
  );
}

export default AIInterpretation;
