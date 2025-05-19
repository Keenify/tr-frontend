import React from 'react';

export type Platform = "shopee" | "lazada" | "shopify" | "all_sg" | "all_my" | "foodpanda" | "grab" | "redmart";

interface PlatformSelectorProps {
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  enabledPlatforms?: Platform[];
  hideLabel?: boolean;
}

/**
 * Component for selecting the e-commerce platform
 */
const PlatformSelector: React.FC<PlatformSelectorProps> = ({ 
  selectedPlatform, 
  onPlatformChange,
  enabledPlatforms,  // Remove default value to handle it differently
  hideLabel = false
}) => {
  // If enabledPlatforms is not provided, use all platforms except all_sg and all_my
  const defaultEnabledPlatforms: Platform[] = ["shopee", "lazada", "redmart", "shopify", "foodpanda", "grab"];
  
  // Use provided enabledPlatforms or fallback to defaultEnabledPlatforms
  const effectiveEnabledPlatforms = enabledPlatforms || defaultEnabledPlatforms;
  
  const isEnabled = (platform: Platform) => {
    // Always enable all_sg and all_my
    if (platform === "all_sg" || platform === "all_my") return true;
    // For other platforms, check the enabledPlatforms array
    return effectiveEnabledPlatforms.includes(platform);
  };
  
  return (
    <div className="flex flex-col">
      {!hideLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
      )}
      <div className="flex gap-2 flex-wrap">
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
            selectedPlatform === "redmart"
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPlatformChange("redmart")}
          disabled={!isEnabled("redmart")}
          title={isEnabled("redmart") ? undefined : "Coming soon"}
        >
          Redmart
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
        <button
          className={`px-4 py-2 rounded-md ${
            selectedPlatform === "grab"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPlatformChange("grab")}
          disabled={!isEnabled("grab")}
          title={isEnabled("grab") ? undefined : "Coming soon"}
        >
          Grab
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedPlatform === "foodpanda"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPlatformChange("foodpanda")}
          disabled={!isEnabled("foodpanda")}
          title={isEnabled("foodpanda") ? undefined : "Coming soon"}
        >
          Foodpanda
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedPlatform === "all_sg"
              ? "bg-gray-800 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPlatformChange("all_sg")}
        >
          All (SG)
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedPlatform === "all_my"
              ? "bg-yellow-800 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPlatformChange("all_my")}
        >
          All (MY)
        </button>
      </div>
    </div>
  );
};

export default PlatformSelector;
 