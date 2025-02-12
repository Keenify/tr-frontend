import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Session } from '@supabase/supabase-js';

interface FinanceProps {
  session: Session;
}

interface GoogleSheet {
  id: string;
  name: string;
}

// Constants
const FOLDER_ID = '1sIE3oFgzeL7LOCT6m885H1tncoVUIaoL';

/**
 * Finance component for managing financial data and operations.
 * 
 * @param {FinanceProps} props - Component properties including user session
 * @returns {JSX.Element} Rendered Finance component
 */
const Finance: React.FC<FinanceProps> = ({ session }) => {
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Session in Finance:', session);

    const fetchSheets = async () => {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/drive/v3/files`,
          {
            params: {
              q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
              key: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY,
              fields: 'files(id, name)',
              supportsAllDrives: true,
            },
          }
        );
        
        setSheets(response.data.files);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Google Sheets:', error);
        setError('Failed to load sheets. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchSheets();
  }, [session]);

  const handleCreateNewSheet = () => {
    window.open(`https://docs.google.com/spreadsheets/create?usp=drive_web&folder=${FOLDER_ID}`, '_blank');
  };

  return (
    <div className="w-full py-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Finance Dashboard</h1>
      {error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : isLoading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4"> 
          {sheets.map((sheet) => (
            <div 
              key={sheet.id} 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 aspect-[4/3] relative"
            >
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheet.id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 h-full"
              >
                <div className="h-3/4 mb-3 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.17 3.25H2.83c-.76 0-1.38.62-1.38 1.38v14.74c0 .76.62 1.38 1.38 1.38h18.34c.76 0 1.38-.62 1.38-1.38V4.63c0-.76-.62-1.38-1.38-1.38zM8 17.5H3.5v-3H8v3zm0-4.5H3.5V10H8v3zm0-4.5H3.5V5.5H8V8.5zm12.5 9H9.5v-3h11v3zm0-4.5H9.5V10h11v3zm0-4.5H9.5V5.5h11V8.5z"/>
                  </svg>
                </div>
                <div className="flex items-center justify-center text-blue-600 hover:text-blue-800">
                  <span className="font-medium truncate text-lg px-1 text-center">{sheet.name}</span>
                </div>
              </a>
            </div>
          ))}
          
          {/* Create New Sheet Button */}
          <div 
            onClick={handleCreateNewSheet}
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
              <span className="text-gray-600 font-medium">Create New Sheet</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
