import React from 'react';

export type Platform = "shopee" | "lazada" | "shopify";

interface PlatformSelectorProps {
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  enabledPlatforms?: Platform[];
}

/**
 * Component for selecting the e-commerce platform
 */
const PlatformSelector: React.FC<PlatformSelectorProps> = ({ 
  selectedPlatform, 
  onPlatformChange,
  enabledPlatforms = ["shopee", "lazada"]  // Default enabled platforms
}) => {
  const isEnabled = (platform: Platform) => enabledPlatforms.includes(platform);
  
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-md ${
            selectedPlatform === "shopee"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPlatformChange("shopee")}
          disabled={!isEnabled("shopee")}
          title={isEnabled("shopee") ? undefined : "Coming soon"}
        >
          Shopee
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedPlatform === "lazada"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPlatformChange("lazada")}
          disabled={!isEnabled("lazada")}
          title={isEnabled("lazada") ? undefined : "Coming soon"}
        >
          Lazada
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedPlatform === "shopify"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPlatformChange("shopify")}
          disabled={!isEnabled("shopify")}
          title={isEnabled("shopify") ? undefined : "Coming soon"}
        >
          Shopify
        </button>
      </div>
    </div>
  );
};

export default PlatformSelector;
 