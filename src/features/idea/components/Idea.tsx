import { Session } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';
import { Trash2 } from 'react-feather';
import toast from 'react-hot-toast';
import FlowWrapper from './FlowWrapper';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { getCompanyMindMaps, MindMapResponse, deleteMindMap } from '../services/useMindMap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { directoryService } from '../../../shared/services/directoryService';

/**
 * Idea Component
 * 
 * A component that manages and displays mind maps in a sandbox environment.
 * It provides functionality to view, create, and delete mind maps, with a grid layout
 * for existing mind maps and a creation button.
 * 
 * Features:
 * - Displays a grid of existing mind maps with their metadata
 * - Allows creation of new mind maps
 * - Supports deletion of mind maps with confirmation
 * - Shows mind map editor when a specific mind map is selected
 * - Displays employee names for mind map creators and editors
 * 
 * @component
 * @param {Object} props
 * @param {Session} props.session - The current user's session object from Supabase
 * 
 * @example
 * ```tsx
 * <Idea session={currentSession} />
 * ```
 */
export const Idea = ({ session }: { session: Session }) => {
  const navigate = useNavigate();
  const { mindmapId } = useParams<{ mindmapId: string }>();
  const location = useLocation();
  const [mindmaps, setMindmaps] = useState<MindMapResponse[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMindmapForDelete, setSelectedMindmapForDelete] = useState<MindMapResponse | null>(null);
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});

  // Get user and company data
  const { companyInfo, error: userDataError, isLoading: isUserDataLoading } = 
    useUserAndCompanyData(session.user.id);

  console.log('Current path:', location.pathname);
  console.log('Current mindmapId:', mindmapId);

  // Check if we're on the new route
  const isNewRoute = location.pathname.endsWith('/new');
  
  const fetchEmployeeNames = useCallback(async () => {
    if (!companyInfo?.id) return;
    try {
      const employeesData = await directoryService.fetchEmployees(companyInfo.id);
      const namesMap = employeesData.reduce((acc, emp) => ({
        ...acc,
        [emp.id]: `${emp.first_name} ${emp.last_name}`
      }), {});
      setEmployeeNames(namesMap);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, [companyInfo?.id]);

  const fetchMindmaps = useCallback(async () => {
    if (!companyInfo?.id || isUserDataLoading) return;

    try {
      const fetchedMindmaps = await getCompanyMindMaps(companyInfo.id);
      // Sort mindmaps by updated_at in descending order (most recent first)
      const sortedMindmaps = fetchedMindmaps.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setMindmaps(sortedMindmaps);
      await fetchEmployeeNames();
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching mindmaps:', error);
      setError('Failed to load mindmaps. Please try again later.');
      setIsLoading(false);
    }
  }, [companyInfo?.id, isUserDataLoading, fetchEmployeeNames]);

  useEffect(() => {
    fetchMindmaps();
  }, [fetchMindmaps]);

  // Show error if user data fetch failed
  if (userDataError) {
    return <p className="text-red-500 text-center">Failed to load user data. Please try again later.</p>;
  }

  // Update the click handlers to use navigation
  const handleMindmapClick = (id: string) => {
    navigate(`/${session.user.id}/sandbox/${id}`);
  };

  const handleCreateClick = () => {
    navigate(`/${session.user.id}/sandbox/new`);
  };

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

  // If mindmapId is present or we're on the new route, show the FlowWrapper
  if (mindmapId || isNewRoute) {
    console.log('Rendering FlowWrapper with mindmapId:', isNewRoute ? 'new' : mindmapId);
    return (
      <div className="w-full h-[80vh] relative">
        <button
          onClick={() => {
            navigate(`/${session.user.id}/sandbox`);
            fetchMindmaps();
          }}
          className="absolute top-4 left-4 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sandbox
        </button>
        <FlowWrapper 
          session={session} 
          mindmapId={isNewRoute ? undefined : mindmapId}
        />
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Sandbox</h1>
      {error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (isLoading || isUserDataLoading) ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="w-full grid grid-cols-3 gap-4 px-4 [grid-auto-flow:column] h-[calc(100vh-200px)] grid-rows-[repeat(auto-fill,200px)]">
          {mindmaps.map((mindmap) => (
            <div
              key={mindmap.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-all duration-200 relative group"
            >
              <div 
                className="p-4 h-full flex flex-col cursor-pointer"
                onClick={() => handleMindmapClick(mindmap.id)}
              >
                <h3 className="font-medium text-gray-900 text-lg mb-2 truncate">
                  {mindmap.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {mindmap.description || 'No description'}
                </p>
                <div className="text-sm text-gray-500 mt-auto space-y-1">
                  <div className="truncate">Created by: {employeeNames[mindmap.created_by] || 'Unknown'}</div>
                  <div className="truncate">
                    Last updated by {employeeNames[mindmap.updated_by || mindmap.created_by] || 'Unknown'} on {new Date(mindmap.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div 
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteClick(mindmap, e)}
              >
                <button className="p-1.5 hover:bg-gray-100 rounded-full text-red-500" title="Delete Mind Map">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* Create New Mindmap Button */}
          <div
            onClick={handleCreateClick}
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

