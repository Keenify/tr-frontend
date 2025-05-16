import { useState, useEffect, useContext, useCallback, forwardRef, useImperativeHandle } from 'react';
import useJobApplications from '../services/useJobApplications';
import { JobApplication } from '../types/hiring.types';
import ApplicationCard from './ApplicationCard';
import ApplicantFormModal from './ApplicantFormModal';
import { ApplicationCountContext } from '../context/ApplicationCountContext';

// Define ref type
export interface InterviewTabRef {
  refreshApplications: () => void;
}

type InterviewTabProps = Record<string, never>;

const InterviewTab = forwardRef<InterviewTabRef, InterviewTabProps>((_props, ref) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | undefined>(undefined);
  
  const { getJobApplicationsByStatus, deleteJobApplication } = useJobApplications();
  const { updateCount, refreshAllCounts } = useContext(ApplicationCountContext);

  // Fetch interview applications with useCallback for reuse
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJobApplicationsByStatus('interview');
      setApplications(data);
      // Update count in parent component
      updateCount('interview', data.length);
    } catch (err) {
      console.error('Failed to fetch interview applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getJobApplicationsByStatus, updateCount]);

  // Expose the refresh method to parent components
  useImperativeHandle(ref, () => ({
    refreshApplications: fetchApplications
  }));

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
      updateCount('interview', updatedApplications.length);
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
    // Refresh all counts to reflect any status changes
    refreshAllCounts();
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
              <p className="text-gray-400 text-sm">No applicants in interview stage yet.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Applicant Form Modal */}
      <ApplicantFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        defaultStatus="interview"
        applicationId={selectedApplicationId}
      />
    </div>
  );
});

InterviewTab.displayName = 'InterviewTab';

export default InterviewTab; 