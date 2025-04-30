import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AlertTriangle, PlusCircle } from 'react-feather';
import ApplicantFormModal from './ApplicantFormModal';
import useJobApplications from '../services/useJobApplications';
import { JobApplication } from '../types/hiring.types';
import ApplicationCard from './ApplicationCard';
import { ApplicationCountContext } from '../context/ApplicationCountContext';

const PreHireTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | undefined>(undefined);
  
  const { getJobApplicationsByStatus, deleteJobApplication } = useJobApplications();
  const { updateCount } = useContext(ApplicationCountContext);

  // Fetch pre-hire applications - wrapped in useCallback to make it reusable
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJobApplicationsByStatus('pre-hire');
      setApplications(data);
      // Update count in parent component
      updateCount('preHire', data.length);
    } catch (err) {
      console.error('Failed to fetch pre-hire applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getJobApplicationsByStatus, updateCount]);

  // Load applications on component mount
  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle card deletion with immediate count update
  const handleDelete = async (id: string) => {
    try {
      await deleteJobApplication(id);
      // Update local list immediately without refetching
      const updatedApplications = applications.filter(app => app.id !== id);
      setApplications(updatedApplications);
      // Update count immediately
      updateCount('preHire', updatedApplications.length);
    } catch (err) {
      console.error('Failed to delete application:', err);
      // Refresh the list to ensure consistency
      fetchApplications();
    }
  };

  const handleOpenModal = (applicationId?: string) => {
    setSelectedApplicationId(applicationId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplicationId(undefined);
    // Refresh applications after modal closes
    fetchApplications();
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
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Applicant
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.length > 0 ? (
            applications.map(application => (
              <ApplicationCard 
                key={application.id}
                application={application}
                onEdit={() => handleOpenModal(application.id)}
                onDelete={() => handleDelete(application.id)}
              />
            ))
          ) : (
            <div className="bg-white p-5 rounded-md shadow border border-gray-100">
              <p className="text-gray-400 text-sm">No applicants in pre-hire stage yet.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Applicant Form Modal */}
      <ApplicantFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        defaultStatus="pre-hire"
        applicationId={selectedApplicationId}
      />
    </div>
  );
};

export default PreHireTab; 