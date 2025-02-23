import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Session } from '@supabase/supabase-js';

interface ProfitLossProps {
  session: Session;
}

interface GoogleSheet {
  id: string;
  name: string;
  shortcutDetails?: {
    targetId: string;
  };
}

const FOLDER_ID = '17vcsRXv-hYuaiSZ9Hu9MhpBFqOry5WGb';

const ProfitLoss: React.FC<ProfitLossProps> = ({ session }) => {
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/drive/v3/files`,
          {
            params: {
              q: `'${FOLDER_ID}' in parents and (mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.shortcut')`,
              key: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY,
              fields: 'files(id, name, shortcutDetails)',
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

  const getSheetUrl = (sheet: GoogleSheet) => {
    const fileId = sheet.shortcutDetails?.targetId || sheet.id;
    return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profit & Loss</h1>
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
                href={getSheetUrl(sheet)}
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
                  <span className="font-medium truncate text-lg px-1 text-center">
                    {sheet.name}
                    {sheet.shortcutDetails && ' (Shortcut)'}
                  </span>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfitLoss; 