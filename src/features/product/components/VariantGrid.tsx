import React from 'react';
import { ProductVariant } from '../../../shared/types/Product';
import EditVariantModal from './EditVariantModal';
import { updateProductVariant } from '../../../services/useProductVariants';

interface VariantGridProps {
  variants: ProductVariant[];
  onVariantUpdate?: () => void;
}

const VariantGrid: React.FC<VariantGridProps> = ({ variants, onVariantUpdate }) => {
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const handleVariantClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: { name: string; image?: File }) => {
    if (!selectedVariant) return;
    try {
      await updateProductVariant(selectedVariant.id, data);
      onVariantUpdate?.();
      setIsEditModalOpen(false);
      setSelectedVariant(null);
    } catch (error) {
      console.error('Failed to update variant:', error);
    }
  };

  const handleDelete = () => {
    onVariantUpdate?.();
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mt-2">
        {variants.map(variant => (
          <div 
            key={variant.id} 
            className="p-3 border rounded-lg bg-gray-50 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleVariantClick(variant)}
          >
            {variant.image_url && (
              <img 
                src={variant.image_url} 
                alt={variant.name}
                className="w-full h-24 object-cover rounded-md mb-2"
              />
            )}
            <p className="text-sm text-gray-700 text-center break-word min-h-[2.5rem]">
              {variant.name}
            </p>
          </div>
        ))}
      </div>

      {selectedVariant && (
        <EditVariantModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditSubmit}
          onDelete={handleDelete}
          variant={selectedVariant}
        />
      )}
    </>
  );
};

export default VariantGrid; 