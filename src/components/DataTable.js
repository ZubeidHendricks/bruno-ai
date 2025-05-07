import React from 'react';
import { financialData } from '../assets/sampleData';

function DataTable() {
  return (
    <div className="border rounded-lg overflow-auto shadow-sm bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-2 text-left font-medium text-gray-500 border-r">#</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 border-r">entity_id</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 border-r">department</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 border-r">revenue_q1</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 border-r">expenses_q1</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">profit_margin</th>
          </tr>
          <tr className="border-b">
            <th className="px-4 py-1 text-left text-xs font-medium text-blue-500 border-r">ID</th>
            <th className="px-4 py-1 text-left text-xs font-medium text-orange-500 border-r">Category</th>
            <th className="px-4 py-1 text-left text-xs font-medium text-orange-500 border-r">Category</th>
            <th className="px-4 py-1 text-left text-xs font-medium text-green-500 border-r">Number (Integer)</th>
            <th className="px-4 py-1 text-left text-xs font-medium text-green-500 border-r">Number (Integer)</th>
            <th className="px-4 py-1 text-left text-xs font-medium text-green-500">Number</th>
          </tr>
        </thead>
        <tbody>
          {financialData.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 border-b">
              <td className="px-4 py-2 border-r">{row.id}</td>
              <td className="px-4 py-2 border-r">{row.entity_id}</td>
              <td className="px-4 py-2 border-r">{row.department}</td>
              <td className="px-4 py-2 border-r">{row.revenue_q1}</td>
              <td className="px-4 py-2 border-r">{row.expenses_q1}</td>
              <td className="px-4 py-2">{row.profit_margin.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
