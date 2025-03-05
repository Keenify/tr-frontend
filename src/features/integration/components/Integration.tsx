import React, { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { getGoogleAuthUrl, validateGoogleToken, revokeGoogleToken } from "../services/useGoogle";
import toast from "react-hot-toast";
import { ExternalLink, Check, X, RefreshCw } from "react-feather";

interface IntegrationProps {
  session: Session;
}

const Integration: React.FC<IntegrationProps> = ({ session }) => {
  const { userInfo, companyInfo, error: dataError, isLoading } = useUserAndCompanyData(session.user.id);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleTokenId, setGoogleTokenId] = useState<string | null>(null);
  const [googleTokenExpiry, setGoogleTokenExpiry] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if the user is connected to Google
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (!userInfo || !companyInfo) return;
      
      try {
        setIsValidating(true);
        const validationResponse = await validateGoogleToken({
          employee_id: userInfo.id,
          company_id: companyInfo.id,
          refresh: false
        });
        
        setGoogleConnected(validationResponse.is_valid);
        setGoogleTokenId(validationResponse.token_id);
        setGoogleTokenExpiry(validationResponse.expires_at);
      } catch (error) {
        console.error("Failed to validate Google token:", error);
        setGoogleConnected(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkGoogleConnection();
  }, [userInfo, companyInfo]);

  // Handle Google OAuth connection
  const handleConnectGoogle = async () => {
    if (!userInfo || !companyInfo) {
      toast.error("User or company information not available");
      return;
    }

    try {
      setIsConnecting(true);
      const authUrlResponse = await getGoogleAuthUrl();
      // Store employee and company IDs in localStorage for the callback
      localStorage.setItem('google_oauth_employee_id', userInfo.id);
      localStorage.setItem('google_oauth_company_id', companyInfo.id);
      // Redirect to Google's authorization page
      window.location.href = authUrlResponse.authorization_url;
    } catch (error) {
      console.error("Failed to get Google auth URL:", error);
      toast.error("Failed to connect to Google");
      setIsConnecting(false);
    }
  };

  // Handle token revocation
  const handleRevokeAccess = async () => {
    if (!googleTokenId) {
      toast.error("No Google token found to revoke");
      return;
    }

    try {
      setIsRevoking(true);
      await revokeGoogleToken(googleTokenId);
      setGoogleConnected(false);
      setGoogleTokenId(null);
      setGoogleTokenExpiry(null);
      toast.success("Google access successfully revoked");
    } catch (error) {
      console.error("Failed to revoke Google token:", error);
      toast.error("Failed to revoke Google access");
    } finally {
      setIsRevoking(false);
    }
  };

  // Handle token refresh
  const handleRefreshToken = async () => {
    if (!userInfo || !companyInfo) {
      toast.error("User or company information not available");
      return;
    }

    try {
      setIsValidating(true);
      const validationResponse = await validateGoogleToken({
        employee_id: userInfo.id,
        company_id: companyInfo.id,
        refresh: true
      });
      
      setGoogleConnected(validationResponse.is_valid);
      setGoogleTokenId(validationResponse.token_id);
      setGoogleTokenExpiry(validationResponse.expires_at);
      
      if (validationResponse.was_refreshed) {
        toast.success("Google token successfully refreshed");
      } else {
        toast.success("Token is still valid, no refresh needed");
      }
    } catch (error) {
      console.error("Failed to refresh Google token:", error);
      toast.error("Failed to refresh Google token");
    } finally {
      setIsValidating(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading user data. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Integration Dashboard</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Welcome to the Integration module! Connect your account with third-party services to enhance your workflow.
              </p>
            </div>
          </div>
        </div>
        
        {/* Google Integration Card */}
        <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" 
                  alt="Google Logo" 
                  className="h-8 mr-3"
                />
                <h2 className="text-xl font-semibold text-gray-800">Google Integration</h2>
              </div>
              <div className="flex items-center">
                {googleConnected ? (
                  <span className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                    <Check size={16} className="mr-1" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                    <X size={16} className="mr-1" />
                    Not Connected
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Connect your Google account to access calendar events, emails, and other Google services directly from this platform.
            </p>
            
            {googleConnected && googleTokenExpiry && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Connection Details</h3>
                  <p className="text-sm text-gray-600">
                    Token expires: <span className="font-medium">{formatDate(googleTokenExpiry)}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRefreshToken}
                    disabled={isValidating}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidating ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" />
                        Refresh Token
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleRevokeAccess}
                    disabled={isRevoking}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRevoking ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <X size={16} className="mr-2" />
                        Revoke Access
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
              {!googleConnected && (
                <button
                  onClick={handleConnectGoogle}
                  disabled={isConnecting || !userInfo || !companyInfo}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={16} className="mr-2" />
                      Connect with Google
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integration;
