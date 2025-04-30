import React, { useState, useEffect, useContext } from 'react';
import useJobApplications from '../services/useJobApplications';
import { JobApplication } from '../types/hiring.types';
import ApplicationCard from './ApplicationCard';
import ApplicantFormModal from './ApplicantFormModal';
import { ApplicationCountContext } from '../context/ApplicationCountContext';

const PostInterviewTab: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | undefined>(undefined);
  
  const { getJobApplicationsByStatus } = useJobApplications();
  const { updateCount } = useContext(ApplicationCountContext);

  // Fetch post-hired applications
  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJobApplicationsByStatus('post-hired');
      setApplications(data);
      // Update count in parent component
      updateCount('postInterview', data.length);
    } catch (err) {
      console.error('Failed to fetch post-hired applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load applications on component mount
  useEffect(() => {
    fetchApplications();
    // Intentionally not including fetchApplications as a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.length > 0 ? (
            applications.map(application => (
              <ApplicationCard 
                key={application.id}
                application={application}
                onEdit={() => handleOpenModal(application.id)}
              />
            ))
          ) : (
            <div className="bg-white p-5 rounded-md shadow border border-gray-100">
              <p className="text-gray-400 text-sm">No applicants in post-hire stage yet.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Applicant Form Modal */}
      <ApplicantFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        defaultStatus="post-hired"
        applicationId={selectedApplicationId}
      />
    </div>
  );
};

export default PostInterviewTab; 