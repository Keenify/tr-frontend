import React from 'react';
import { Platform } from './PlatformSelector';
import { SHOPEE_SHOP_NAMES, LAZADA_ACCOUNT_NAMES } from '../constant/Shopname';

interface Entity {
  id: string | number;
  name: string;
}

interface PlatformEntitySelectorProps {
  platform: Platform;
  entities: Entity[];
  selectedEntityId: string | number | null;
  onEntityChange: (entityId: string | number) => void;
}

/**
 * Component for selecting a platform-specific entity (shop, account, store)
 */
const PlatformEntitySelector: React.FC<PlatformEntitySelectorProps> = ({
  platform,
  entities,
  selectedEntityId,
  onEntityChange
}) => {
  // Hide selector for All(SG) and All(MY)
  if (platform === 'all_sg' || platform === 'all_my') {
    return null;
  }

  // Skip rendering if there are no entities to select
  if (entities.length === 0) {
    return null;
  }

  // Get the label based on the platform
  const getLabel = () => {
    switch (platform) {
      case 'shopee': return 'Shopee Shop';
      case 'lazada': return 'Lazada Account';
      case 'shopify': return 'Shopify Store';
      default: return 'Select Entity';
    }
  };

  // Format the entity name for display
  const formatEntityName = (entity: Entity) => {
    if (platform === 'shopee') {
      const shopName = SHOPEE_SHOP_NAMES[entity.id] || entity.id;
      return `${shopName} (${entity.id})`;
    }
    if (platform === 'lazada') {
      const accountName = LAZADA_ACCOUNT_NAMES[entity.id] || entity.id;
      return `${accountName} (${entity.id})`;
    }
    return entity.name;
  };

  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-700 mb-1">{getLabel()}</label>
      <select
        className="p-2 border border-gray-300 rounded-md"
        value={selectedEntityId?.toString() || ''}
        onChange={(e) => {
          // Convert to number if the platform is Shopee (since shop_id is a number)
          const value = platform === 'shopee' 
            ? Number(e.target.value) 
            : e.target.value;
          onEntityChange(value);
        }}
        aria-label={`Select ${getLabel()}`}
      >
        {entities.map((entity) => (
          <option key={entity.id.toString()} value={entity.id.toString()}>
            {formatEntityName(entity)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PlatformEntitySelector;
export type { Entity }; 