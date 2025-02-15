import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { MoreVertical } from 'react-feather';
import toast from 'react-hot-toast';
import FlowWrapper from './FlowWrapper';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { getCompanyMindMaps, MindMapResponse, deleteMindMap } from '../services/useMindMap';

export const Idea = ({ session }: { session: Session }) => {
  const [mindmaps, setMindmaps] = useState<MindMapResponse[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMindmapId, setSelectedMindmapId] = useState<string | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMindmapForDelete, setSelectedMindmapForDelete] = useState<MindMapResponse | null>(null);

  // Get user and company data
  const { companyInfo, error: userDataError, isLoading: isUserDataLoading } = 
    useUserAndCompanyData(session.user.id);

  useEffect(() => {
    const fetchMindmaps = async () => {
      if (!companyInfo?.id || isUserDataLoading) return;

      try {
        const fetchedMindmaps = await getCompanyMindMaps(companyInfo.id);
        setMindmaps(fetchedMindmaps);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching mindmaps:', error);
        setError('Failed to load mindmaps. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchMindmaps();
  }, [companyInfo?.id, isUserDataLoading]);

  // Show error if user data fetch failed
  if (userDataError) {
    return <p className="text-red-500 text-center">Failed to load user data. Please try again later.</p>;
  }

  const handleDeleteClick = (mindmap: MindMapResponse, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the mindmap selection
    setSelectedMindmapForDelete(mindmap);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMindmapForDelete) return;

    try {
      await deleteMindMap(selectedMindmapForDelete.id);
      setMindmaps(mindmaps.filter(m => m.id !== selectedMindmapForDelete.id));
      toast.success('Mind map deleted successfully');
    } catch (error) {
      console.error('Error deleting mindmap:', error);
      toast.error('Failed to delete mind map');
    } finally {
      setShowDeleteModal(false);
      setSelectedMindmapForDelete(null);
    }
  };

  if (isCreating || selectedMindmapId) {
    return (
      <div className="w-full h-[80vh]">
        <FlowWrapper 
          session={session} 
          mindmapId={selectedMindmapId}
        />
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Idea</h1>
      {error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (isLoading || isUserDataLoading) ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="w-full flex flex-wrap gap-4 px-4">
          {mindmaps.map((mindmap) => (
            <div
              key={mindmap.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-all duration-200 relative group flex-grow basis-[calc(100%-1rem)] sm:basis-[calc(50%-1rem)] lg:basis-[calc(33.333%-1rem)] xl:basis-[calc(25%-1rem)]"
            >
              <div 
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteClick(mindmap, e)}
              >
                <button className="p-1.5 hover:bg-gray-100 rounded-full" title="Delete Mind Map">
                  <MoreVertical size={18} className="text-gray-500" />
                </button>
              </div>
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setSelectedMindmapId(mindmap.id)}
              >
                <h3 className="font-medium text-gray-900 mb-2 truncate">
                  {mindmap.title}
                </h3>
                <div className="text-sm text-gray-500">
                  Last modified: {new Date(mindmap.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}

          {/* Create New Mindmap Button */}
          <div
            onClick={() => setIsCreating(true)}
            className="bg-white rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-500 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-4 h-full flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-2 transition-colors">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="text-gray-600 group-hover:text-blue-600 font-medium text-sm transition-colors">
                Create New Mindmap
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Mind Map</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedMindmapForDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Idea;

