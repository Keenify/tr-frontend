import React from 'react';
import { format } from 'date-fns';
import { Platform } from './PlatformSelector';

interface EmptyStateMessageProps {
  platform: Platform;
  companyId?: string;
  startDate: Date;
  endDate: Date;
  selectedEntityId: string | number | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Component to display a message when no metrics data is available
 */
const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({
  platform,
  companyId,
  startDate,
  endDate,
  selectedEntityId,
  onRefresh,
  isRefreshing
}) => {
  // Get platform-specific tips for when data is missing
  const getPlatformTips = () => {
    switch (platform) {
      case 'shopee':
        return "Make sure your Shopee shop credentials are properly configured and you have sales data for the selected period.";
      case 'lazada':
        return "Ensure your Lazada API credentials are set up correctly and the account has sales data for the selected date range.";
      case 'shopify':
        return "Ensure your Shopify store credentials are set up correctly and the store has sales data for the selected date range.";
      default:
        return "Try selecting a different date range or platform.";
    }
  };

  // Get platform-specific icon
  const getPlatformIcon = () => {
    switch (platform) {
      case 'shopee': return '🛍️';
      case 'lazada': return '📦';
      case 'shopify': return '🏪';
      default: return '❓';
    }
  };

  return (
    <div className={`bg-gray-50 border border-gray-300 p-8 rounded-md text-center ${
      platform === 'shopee' ? 'border-orange-200' : 
      platform === 'lazada' ? 'border-blue-200' : 
      'border-green-200'
    }`}>
      <div className="text-5xl mb-4">{getPlatformIcon()}</div>
      <p className="text-lg font-medium">No {platform.charAt(0).toUpperCase() + platform.slice(1)} metrics data available</p>
      <p className="mt-2 text-gray-600">{getPlatformTips()}</p>
      <p className="mt-4 text-sm text-gray-500">Current query:
        <br />Platform: {platform.charAt(0).toUpperCase() + platform.slice(1)}
        <br />Company ID: {companyId || 'Not set'}
        <br />Date range: {format(startDate, "yyyy-MM-dd")} to {format(endDate, "yyyy-MM-dd")}
        {platform === "shopee" && selectedEntityId && <><br />Shop ID: {selectedEntityId}</>}
        {platform === "lazada" && selectedEntityId && <><br />Account ID: {selectedEntityId}</>}
        {platform === "shopify" && selectedEntityId && <><br />Store ID: {selectedEntityId}</>}
      </p>
      <button
        onClick={onRefresh}
        className={`mt-4 px-4 py-2 text-white rounded-md flex items-center justify-center gap-2 mx-auto ${
          platform === 'shopee' ? 'bg-orange-500 hover:bg-orange-600' : 
          platform === 'lazada' ? 'bg-blue-500 hover:bg-blue-600' : 
          'bg-green-500 hover:bg-green-600'
        }`}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            <span>Refreshing...</span>
          </>
        ) : (
          "Refresh Data"
        )}
      </button>
    </div>
  );
};

export default EmptyStateMessage; 