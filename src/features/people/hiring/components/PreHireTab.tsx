import React from 'react';
import { AlertTriangle } from 'react-feather';

const PreHireTab: React.FC = () => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-blue-800">For every hire, we always ask:</h3>
      </div>
      <ul className="list-none mt-3 pl-8 space-y-1 text-blue-700">
        <li><span className="font-semibold mr-2">a.</span> Does this person get and understand the role?</li>
        <li><span className="font-semibold mr-2">b.</span> Does this person want the role?</li>
        <li><span className="font-semibold mr-2">c.</span> Does this person have the capacity and skill to do it?</li>
      </ul>
    </div>
  );
};

export default PreHireTab; 