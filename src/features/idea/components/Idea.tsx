import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import FlowWrapper from './FlowWrapper';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { getCompanyMindMaps, MindMapResponse } from '../services/useMindMap';

export const Idea = ({ session }: { session: Session }) => {
  const [mindmaps, setMindmaps] = useState<MindMapResponse[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMindmapId, setSelectedMindmapId] = useState<string | undefined>();

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
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {mindmaps.map((mindmap) => (
            <div
              key={mindmap.id}
              onClick={() => setSelectedMindmapId(mindmap.id)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 aspect-[4/3] relative cursor-pointer"
            >
              <div className="block p-4 h-full">
                <div className="h-3/4 mb-3 overflow-hidden rounded-md bg-gray-50 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-center text-blue-600 hover:text-blue-800">
                  <span className="font-medium truncate text-lg px-1 text-center">
                    {mindmap.title}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Create New Mindmap Button */}
          <div
            onClick={() => setIsCreating(true)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer aspect-[4/3]"
          >
            <div className="p-4 h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg">
              <svg
                className="w-16 h-16 text-gray-400 mb-2"
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
              <span className="text-gray-600 font-medium">Create New Mindmap</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Idea;
