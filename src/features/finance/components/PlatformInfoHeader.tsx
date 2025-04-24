import React from 'react';
import { Platform } from './PlatformSelector';
import { SHOPEE_SHOP_NAMES } from '../constant/Shopee';

interface PlatformInfoHeaderProps {
  platform: Platform;
  companyId?: string;
  selectedEntityId: string | number | null;
}

/**
 * Component to display the current platform, company ID, and selected entity info
 */
const PlatformInfoHeader: React.FC<PlatformInfoHeaderProps> = ({
  platform,
  selectedEntityId
}) => {
  // Get platform badge color
  const getPlatformBadgeClasses = () => {
    switch (platform) {
      case 'shopee': return 'bg-orange-100 text-orange-800';
      case 'lazada': return 'bg-blue-100 text-blue-800';
      case 'shopify': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get platform logo/icon (if we had SVG icons)
  const getPlatformIcon = () => {
    switch (platform) {
      case 'shopee': return '🛍️';
      case 'lazada': return '📦';
      case 'shopify': return '🏪';
      default: return '🔍';
    }
  };

  // Get entity field name based on platform
  const getEntityFieldName = () => {
    switch (platform) {
      case 'shopee': return 'Shop ID';
      case 'lazada': return 'Account ID';
      case 'shopify': return 'Store ID';
      default: return 'Entity ID';
    }
  };

  // Shopee shop name mapping
  const shopName = platform === 'shopee' && selectedEntityId ? SHOPEE_SHOP_NAMES[selectedEntityId as string] || selectedEntityId : undefined;

  return (
    <div className={`mb-4 p-3 rounded-lg shadow border-l-4 ${
      platform === 'shopee' ? 'border-l-orange-500 bg-white' :
      platform === 'lazada' ? 'border-l-blue-500 bg-white' :
      'border-l-green-500 bg-white'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">{getPlatformIcon()}</span>
        <div className="flex-grow">
          <h2 className="text-lg font-medium text-gray-800">
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Metrics
          </h2>
          <p className="text-sm text-gray-600">
            {platform === 'shopee' && shopName && (
              <><span className="font-medium">Shopee Shop:</span> {shopName}</>
            )}
            {platform !== 'shopee' && selectedEntityId && (
              <><span className="font-medium">{getEntityFieldName()}:</span> {selectedEntityId}</>
            )}
          </p>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getPlatformBadgeClasses()}`}>
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default PlatformInfoHeader; 