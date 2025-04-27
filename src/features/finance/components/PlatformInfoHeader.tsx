import React from 'react';
import { Platform } from './PlatformSelector';
import { SHOPEE_SHOP_NAMES, LAZADA_ACCOUNT_NAMES, FOODPANDA_SHOP_NAMES } from '../constant/Shopname';

interface PlatformInfoHeaderProps {
  platform: Platform;
  companyId?: string;
  selectedEntityId: string | number | null;
  includedStores?: string[];
}

/**
 * Component to display the current platform, company ID, and selected entity info
 */
const PlatformInfoHeader: React.FC<PlatformInfoHeaderProps> = ({
  platform,
  selectedEntityId,
  includedStores
}) => {
  // Get platform badge color
  const getPlatformBadgeClasses = () => {
    switch (platform) {
      case 'shopee': return 'bg-orange-100 text-orange-800';
      case 'lazada': return 'bg-blue-100 text-blue-800';
      case 'shopify': return 'bg-green-100 text-green-800';
      case 'foodpanda': return 'bg-purple-100 text-purple-800';
      case 'all_sg': return 'bg-gray-800 text-white';
      case 'all_my': return 'bg-yellow-800 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get platform logo/icon (if we had SVG icons)
  const getPlatformIcon = () => {
    switch (platform) {
      case 'shopee': return '🛍️';
      case 'lazada': return '📦';
      case 'shopify': return '🏪';
      case 'foodpanda': return '🍱';
      default: return '🔍';
    }
  };

  // Get entity field name based on platform
  const getEntityFieldName = () => {
    switch (platform) {
      case 'shopee': return 'Shop ID';
      case 'lazada': return 'Account ID';
      case 'shopify': return 'Store ID';
      case 'foodpanda': return 'Shop ID';
      default: return 'Entity ID';
    }
  };

  // Shop name mapping
  const shopName =
    platform === 'shopee' && selectedEntityId ? SHOPEE_SHOP_NAMES[selectedEntityId as string] || selectedEntityId :
    platform === 'lazada' && selectedEntityId ? LAZADA_ACCOUNT_NAMES[selectedEntityId as string] || selectedEntityId :
    platform === 'foodpanda' && selectedEntityId ? FOODPANDA_SHOP_NAMES[selectedEntityId as string] || selectedEntityId :
    undefined;

  return (
    <div className={`mb-4 p-3 rounded-lg shadow border-l-4 ${
      platform === 'shopee' ? 'border-l-orange-500 bg-white' :
      platform === 'lazada' ? 'border-l-blue-500 bg-white' :
      platform === 'shopify' ? 'border-l-green-500 bg-white' :
      platform === 'foodpanda' ? 'border-l-purple-500 bg-white' :
      platform === 'all_sg' ? 'border-l-gray-800 bg-white' :
      platform === 'all_my' ? 'border-l-yellow-800 bg-white' :
      'border-l-gray-500 bg-white'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">{getPlatformIcon()}</span>
        <div className="flex-grow">
          <h2 className="text-lg font-medium text-gray-800">
            {platform === 'all_sg' ? 'All (SG) Metrics' : platform === 'all_my' ? 'All (MY) Metrics' : platform.charAt(0).toUpperCase() + platform.slice(1) + ' Metrics'}
          </h2>
          <p className="text-sm text-gray-600">
            {platform === 'shopee' && shopName && (
              <><span className="font-medium">Shopee Shop:</span> {shopName}</>
            )}
            {platform === 'lazada' && shopName && selectedEntityId && (
              <><span className="font-medium">Lazada Shop:</span> {shopName} ({selectedEntityId})</>
            )}
            {platform === 'foodpanda' && shopName && selectedEntityId && (
              <><span className="font-medium">Foodpanda Shop:</span> {shopName} ({selectedEntityId})</>
            )}
            {platform !== 'shopee' && platform !== 'lazada' && platform !== 'foodpanda' && selectedEntityId && (
              <><span className="font-medium">{getEntityFieldName()}:</span> {selectedEntityId}</>
            )}
            {(platform === 'all_sg' || platform === 'all_my') && includedStores && includedStores.length > 0 && (
              <div className="mt-2">
                <span className="font-medium">Stores Included:</span>
                <ul className="list-disc list-inside text-xs text-gray-700 mt-1">
                  {includedStores.map((store, idx) => (
                    <li key={idx}>{store}</li>
                  ))}
                </ul>
              </div>
            )}
          </p>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getPlatformBadgeClasses()}`}>
          {platform === 'all_sg' ? 'All (SG)' : platform === 'all_my' ? 'All (MY)' : platform.charAt(0).toUpperCase() + platform.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default PlatformInfoHeader; 