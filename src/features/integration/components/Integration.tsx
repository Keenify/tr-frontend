import React, { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { getGoogleAuthUrl, validateGoogleToken, revokeGoogleToken, handleGoogleCallback } from "../services/useGoogle";
import { getShopeeAuthUrl, handleShopeeCallback, getShopeeTokens, ShopeeTokenResponse } from "../services/useShopee";
import toast from "react-hot-toast";
import { ExternalLink, Check, X, RefreshCw } from "react-feather";
import { useLocation, useNavigate } from "react-router-dom";

interface IntegrationProps {
  session: Session;
}

const SHOPEE_SHOPS: { shopId: number; name: string; country: string }[] = [
  { shopId: 976040827, name: "thekettlegourmetmy", country: "MY" },
  { shopId: 2421911,   name: "thekettlegourmetsg", country: "SG" },
];

const Integration: React.FC<IntegrationProps> = ({ session }) => {
  const { userInfo, companyInfo, error: dataError, isLoading } = useUserAndCompanyData(session.user.id);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleTokenId, setGoogleTokenId] = useState<string | null>(null);
  const [googleTokenExpiry, setGoogleTokenExpiry] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [shopeeTokens, setShopeeTokens] = useState<ShopeeTokenResponse[]>([]);
  const [shopeeResyncingId, setShopeeResyncingId] = useState<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Handle OAuth callbacks
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Google OAuth callback
      if (location.pathname === "/google/oauth/callback") {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        const employeeId = localStorage.getItem('google_oauth_employee_id');
        const companyId = localStorage.getItem('google_oauth_company_id');
        localStorage.removeItem('google_oauth_employee_id');
        localStorage.removeItem('google_oauth_company_id');

        if (error) {
          toast.error("Failed to connect to Google: " + error);
          navigate("/integration");
          return;
        }
        if (!code || !employeeId || !companyId) {
          toast.error("Missing required parameters for Google integration");
          navigate("/integration");
          return;
        }
        try {
          await handleGoogleCallback(code, employeeId, companyId);
          toast.success("Successfully connected to Google!");
          navigate("/integration");
        } catch {
          toast.error("Failed to complete Google integration");
          navigate("/integration");
        }
      }

      // Shopee OAuth callback
      if (location.pathname === "/shopee/oauth/callback") {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        const shopId = urlParams.get("shop_id");
        const error = urlParams.get("error");

        const companyId = localStorage.getItem('shopee_oauth_company_id');
        const country = localStorage.getItem('shopee_oauth_country') || undefined;
        localStorage.removeItem('shopee_oauth_company_id');
        localStorage.removeItem('shopee_oauth_country');

        if (error) {
          toast.error("Shopee authorization failed: " + error);
          navigate("/integration");
          return;
        }
        if (!code || !shopId || !companyId) {
          toast.error("Missing required parameters for Shopee integration");
          navigate("/integration");
          return;
        }
        try {
          await handleShopeeCallback(code, shopId, companyId, country);
          toast.success("Shopee shop successfully re-authorized!");
          navigate("/integration");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to complete Shopee authorization";
          toast.error(msg);
          navigate("/integration");
        }
      }
    };

    handleOAuthCallback();
  }, [location, navigate]);

  // Check Google connection
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
      } catch {
        setGoogleConnected(false);
      } finally {
        setIsValidating(false);
      }
    };
    checkGoogleConnection();
  }, [userInfo, companyInfo]);

  // Load Shopee tokens
  useEffect(() => {
    const loadShopeeTokens = async () => {
      if (!companyInfo) return;
      try {
        const tokens = await getShopeeTokens(companyInfo.id);
        setShopeeTokens(tokens);
      } catch {
        // silently fail — not connected yet
      }
    };
    loadShopeeTokens();
  }, [companyInfo]);

  const handleConnectGoogle = async () => {
    if (!userInfo || !companyInfo) {
      toast.error("User or company information not available");
      return;
    }
    try {
      setIsConnecting(true);
      const authUrlResponse = await getGoogleAuthUrl();
      localStorage.setItem('google_oauth_employee_id', userInfo.id);
      localStorage.setItem('google_oauth_company_id', companyInfo.id);
      window.location.href = authUrlResponse.authorization_url;
    } catch {
      toast.error("Failed to connect to Google");
      setIsConnecting(false);
    }
  };

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
    } catch {
      toast.error("Failed to revoke Google access");
    } finally {
      setIsRevoking(false);
    }
  };

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
    } catch {
      toast.error("Failed to refresh Google token");
    } finally {
      setIsValidating(false);
    }
  };

  const handleShopeeResync = async (shopId: number, country: string) => {
    if (!companyInfo) {
      toast.error("Company information not available");
      return;
    }
    try {
      setShopeeResyncingId(shopId);
      const callbackUrl = `${window.location.origin}/shopee/oauth/callback`;
      const { authorization_url } = await getShopeeAuthUrl(callbackUrl);
      localStorage.setItem('shopee_oauth_company_id', companyInfo.id);
      localStorage.setItem('shopee_oauth_country', country);
      window.location.href = authorization_url;
    } catch {
      toast.error("Failed to generate Shopee authorization link");
      setShopeeResyncingId(null);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const getShopeeToken = (shopId: number) =>
    shopeeTokens.find((t) => t.shop_id === shopId);

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
                      <><RefreshCw size={16} className="mr-2 animate-spin" />Refreshing...</>
                    ) : (
                      <><RefreshCw size={16} className="mr-2" />Refresh Token</>
                    )}
                  </button>

                  <button
                    onClick={handleRevokeAccess}
                    disabled={isRevoking}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRevoking ? (
                      <><RefreshCw size={16} className="mr-2 animate-spin" />Revoking...</>
                    ) : (
                      <><X size={16} className="mr-2" />Revoke Access</>
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
                    <><RefreshCw size={16} className="mr-2 animate-spin" />Connecting...</>
                  ) : (
                    <><ExternalLink size={16} className="mr-2" />Connect with Google</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Shopee Integration Card */}
        <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 flex items-center justify-center bg-orange-500 rounded-full">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Shopee Integration</h2>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Re-authorize your Shopee shops to sync the latest credentials. Click <strong>Resync</strong> on each shop to complete the OAuth flow on Shopee.
            </p>

            <div className="space-y-4">
              {SHOPEE_SHOPS.map(({ shopId, name, country }) => {
                const token = getShopeeToken(shopId);
                const isSyncing = shopeeResyncingId === shopId;

                return (
                  <div key={shopId} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {name}
                        <span className="ml-2 text-gray-400 font-normal">({shopId})</span>
                        <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{country}</span>
                      </p>
                      {token ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Last synced: {formatDate(token.updated_at)}
                        </p>
                      ) : (
                        <p className="text-xs text-orange-500 mt-1">Not yet authorized</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {token ? (
                        <span className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                          <Check size={14} className="mr-1" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                          <X size={14} className="mr-1" />
                          Not Connected
                        </span>
                      )}
                      <button
                        onClick={() => handleShopeeResync(shopId, country)}
                        disabled={isSyncing || !companyInfo}
                        className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSyncing ? (
                          <><RefreshCw size={14} className="mr-2 animate-spin" />Redirecting...</>
                        ) : (
                          <><ExternalLink size={14} className="mr-2" />Resync</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integration;
