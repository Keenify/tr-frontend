import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleGoogleCallback } from '../services/useGoogle';
import toast from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';

interface GoogleOAuthCallbackProps {
  session: Session | null;
}

const GoogleOAuthCallback: React.FC<GoogleOAuthCallbackProps> = ({ session }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        // Get employee and company IDs from localStorage
        const employeeId = localStorage.getItem('google_oauth_employee_id');
        const companyId = localStorage.getItem('google_oauth_company_id');
        
        if (!code) {
          throw new Error('No authorization code found in the URL');
        }
        
        if (!employeeId || !companyId) {
          throw new Error('Employee or company information not found');
        }
        
        // Process the callback
        await handleGoogleCallback(code, employeeId, companyId);
        
        // Clean up localStorage
        localStorage.removeItem('google_oauth_employee_id');
        localStorage.removeItem('google_oauth_company_id');
        
        toast.success('Successfully connected to Google!');
        
        // Redirect back to the integration page with the session user ID
        if (session && session.user) {
          navigate(`/${session.user.id}/integration`);
        } else {
          // If no session, redirect to home page
          navigate('/');
        }
      } catch (err) {
        console.error('Error processing OAuth callback:', err);
        setError('Failed to complete Google authentication. Please try again.');
      }
    };

    processOAuthCallback();
  }, [navigate, session]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Authentication Error</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
          <div className="mt-5">
            <button
              onClick={() => navigate('/')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Processing</h2>
          <p className="mt-2 text-sm text-gray-600">Completing Google authentication...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback; 