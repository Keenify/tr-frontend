import React from 'react';
import { ProductVariant } from '../../../shared/types/Product';
import '../styles/ManualSelectionModal.css';

interface ManualSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  maxSelection: number;
  availableVariants: ProductVariant[];
  selectedVariants: ProductVariant[];
  onSelectionChange: (variants: ProductVariant[]) => void;
}

const ManualSelectionModal: React.FC<ManualSelectionModalProps> = ({
  isOpen,
  onClose,
  brandName,
  maxSelection,
  availableVariants,
  selectedVariants,
  onSelectionChange
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleVariantClick = (variant: ProductVariant) => {
    const isSelected = selectedVariants.some(v => v.id === variant.id);

    if (isSelected) {
      // Deselect
      onSelectionChange(selectedVariants.filter(v => v.id !== variant.id));
    } else {
      // Select only if under max
      if (selectedVariants.length < maxSelection) {
        onSelectionChange([...selectedVariants, variant]);
      }
    }
  };

  const isVariantSelected = (variant: ProductVariant) => {
    return selectedVariants.some(v => v.id === variant.id);
  };

  const isMaxReached = selectedVariants.length >= maxSelection;

  return (
    <div className="manual-selection-backdrop" onClick={handleBackdropClick}>
      <div className="manual-selection-modal">
        <div className="modal-header">
          <h3>Select {maxSelection} {brandName}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {isMaxReached && (
          <div className="max-warning">
            Maximum {maxSelection} items selected
          </div>
        )}

        <div className="modal-body">
          <div className="variants-grid">
            {availableVariants.map((variant) => {
              const isSelected = isVariantSelected(variant);
              const isDisabled = !isSelected && isMaxReached;

              return (
                <div
                  key={variant.id}
                  className={`variant-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && handleVariantClick(variant)}
                >
                  <div className="variant-image-container">
                    {variant.image_url ? (
                      <img
                        src={variant.image_url}
                        alt={variant.name}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="variant-placeholder"></div>
                    )}
                  </div>
                  <div className="variant-name">{variant.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <div className="selection-count">
            Selected: {selectedVariants.length}/{maxSelection}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualSelectionModal;
