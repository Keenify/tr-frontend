import React, { useState, useEffect } from 'react';
import CompanyRocksTable from './CompanyRocksTable';
import StaffRocksTable from './StaffRocksTable';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { ClipLoader } from 'react-spinners';

interface TheRocksMainProps {
  session: Session | null;
}

const TheRocksMain: React.FC<TheRocksMainProps> = ({ session }) => {
  const [activeView, setActiveView] = useState<'company' | 'staff'>('company');
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null); // Renamed for clarity

  const userIdFromSession = session?.user?.id;

  // Fetch data using the hook only if userIdFromSession is valid
  const { 
    companyInfo, 
    userInfo, 
    error: dataFetchError, 
    isLoading: dataIsLoading 
  } = useUserAndCompanyData(userIdFromSession || ""); // Pass empty string if no user ID, hook should handle this

  useEffect(() => {
    if (!userIdFromSession) {
      setError("User session not found. Please log in.");
      setIsLoading(false);
      return;
    }

    // This effect will run when dataIsLoading changes or dataFetchError changes
    if (!dataIsLoading) {
      if (dataFetchError) {
        setError(dataFetchError.message || 'Failed to load user or company data.');
        setCompanyId(null);
        setCurrentEmployeeId(null);
      } else if (companyInfo && userInfo) {
        setCompanyId(companyInfo.id);
        setCurrentEmployeeId(userInfo.id); // Assuming userInfo.id is the employee_id
        setError(null); // Clear any previous error
      } else {
        // This case might happen if the hook returns no error but also no data
        setError('User or company data not found.');
        setCompanyId(null);
        setCurrentEmployeeId(null);
      }
      setIsLoading(false);
    }
  }, [userIdFromSession, dataIsLoading, dataFetchError, companyInfo, userInfo]);

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <ClipLoader size={50} color={"#4A90E2"} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }
  
  if (!companyId) {
    return (
      <div className="p-4">
        <p className="text-orange-500">Company information is not available. Please ensure you are associated with a company and the data has loaded correctly.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex space-x-2 border-b pb-2 mb-4">
        <button 
          onClick={() => setActiveView('company')}
          className={`px-4 py-2 rounded-md text-sm font-medium 
            ${activeView === 'company' 
              ? 'bg-indigo-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Company Rocks
        </button>
        <button 
          onClick={() => setActiveView('staff')}
          className={`px-4 py-2 rounded-md text-sm font-medium 
            ${activeView === 'staff' 
              ? 'bg-indigo-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Staff Rocks
        </button>
      </div>

      {activeView === 'company' && <CompanyRocksTable companyId={companyId} />}
      {activeView === 'staff' && <StaffRocksTable companyId={companyId} currentUserId={currentEmployeeId || undefined} />}
    </div>
  );
};

export default TheRocksMain;
