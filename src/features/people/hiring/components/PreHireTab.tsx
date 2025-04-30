import React, { useState } from 'react';
import { AlertTriangle, PlusCircle } from 'react-feather';
import ApplicantFormModal from './ApplicantFormModal';

const PreHireTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
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
      
      <div className="flex justify-end">
        <button
          onClick={handleOpenModal}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Applicant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Applicant cards would go here */}
        <div className="bg-white p-5 rounded-md shadow border border-gray-100">
          <p className="text-gray-400 text-sm">No applicants in pre-hire stage yet.</p>
        </div>
      </div>
      
      {/* Applicant Form Modal */}
      <ApplicantFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        defaultStatus="pre-hire"
      />
    </div>
  );
};

export default PreHireTab; 