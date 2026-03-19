import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleShopeeCallback } from '../services/useShopee';
import toast from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';

interface ShopeeOAuthCallbackProps {
  session: Session | null;
}

const ShopeeOAuthCallback: React.FC<ShopeeOAuthCallbackProps> = ({ session }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const shopId = urlParams.get('shop_id');
        const shopeeError = urlParams.get('error');

        const companyId = localStorage.getItem('shopee_oauth_company_id');
        const country = localStorage.getItem('shopee_oauth_country') || undefined;
        localStorage.removeItem('shopee_oauth_company_id');
        localStorage.removeItem('shopee_oauth_country');

        if (shopeeError) {
          throw new Error('Shopee authorization denied: ' + shopeeError);
        }
        if (!code || !shopId) {
          throw new Error('Missing code or shop_id from Shopee callback');
        }
        if (!companyId) {
          throw new Error('Company information not found. Please try again.');
        }

        await handleShopeeCallback(code, shopId, companyId, country);

        toast.success('Shopee shop successfully re-authorized!');

        if (session?.user) {
          navigate(`/${session.user.id}/integration`);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Error processing Shopee callback:', err);
        const msg = err instanceof Error ? err.message : 'Failed to complete Shopee authorization';
        setError(msg);
      }
    };

    processCallback();
  }, [navigate, session]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Authorization Error</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
          <div className="mt-5">
            <button
              onClick={() => navigate('/')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
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
          <p className="mt-2 text-sm text-gray-600">Completing Shopee authorization...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    </div>
  );
};

export default ShopeeOAuthCallback;
