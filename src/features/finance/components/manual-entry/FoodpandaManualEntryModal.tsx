import React, { useState, useEffect } from 'react';
import FoodpandaManualEntry from './FoodpandaManualEntry';
import { useFoodpandaMetrics } from '../../services/useFoodpandaMetrics';
import { FOODPANDA_SHOP_NAMES } from '../../constant/Shopname';

interface FoodpandaManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

const FoodpandaManualEntryModal: React.FC<FoodpandaManualEntryModalProps> = ({
  isOpen,
  onClose,
  companyId
}) => {
  const [shops, setShops] = useState<string[]>([]);
  
  // Initialize with shops from the constants
  useEffect(() => {
    // Start with the predefined shop IDs from constants
    setShops(Object.keys(FOODPANDA_SHOP_NAMES));
  }, []);
  
  // Fetch existing Foodpanda shops for the company to populate the dropdown
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Use the first shop to fetch data since we need a shop ID for the API
  const firstShopId = shops.length > 0 ? shops[0] : '';
  
  const { data: foodpandaMetrics, isLoading, error } = useFoodpandaMetrics(
    companyId,
    firstShopId,
    formatDate(oneMonthAgo),
    formatDate(today),
    {
      enabled: isOpen && !!firstShopId, // Only fetch when modal is open and we have a shop ID
    }
  );
  
  useEffect(() => {
    if (foodpandaMetrics?.length) {
      // Extract unique shop IDs that are not in FOODPANDA_SHOP_NAMES
      const uniqueShopsFromData = [...new Set(foodpandaMetrics.map(metric => metric.shop_id))];
      const uniqueShops = [...new Set([...Object.keys(FOODPANDA_SHOP_NAMES), ...uniqueShopsFromData])];
      setShops(uniqueShops);
    }
  }, [foodpandaMetrics]);
  
  // Show error in the UI if there's an error fetching foodpanda metrics
  const errorMessage = error ? (error instanceof Error ? error.message : 'Could not load Foodpanda shops') : null;
  
  const handleSuccess = () => {
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        {/* This element centers the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Manual Foodpanda Metrics Entry
                </h3>
                
                {isLoading && firstShopId ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
                    <p className="ml-2 text-sm text-gray-500">Loading shops...</p>
                  </div>
                ) : errorMessage ? (
                  <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error Loading Shops</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <FoodpandaManualEntry
                    companyId={companyId}
                    shops={shops}
                    onSuccess={handleSuccess}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodpandaManualEntryModal; 