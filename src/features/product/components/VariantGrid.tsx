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
            className="p-2 border rounded-lg bg-gray-50 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-[150px]"
            onClick={() => handleVariantClick(variant)}
          >
            {variant.image_url && (
              <div className="w-full h-20 flex-shrink-0">
                <img 
                  src={variant.image_url} 
                  alt={variant.name}
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
            )}
            <p className="text-sm text-gray-700 text-center mt-auto line-clamp-2 overflow-hidden">
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