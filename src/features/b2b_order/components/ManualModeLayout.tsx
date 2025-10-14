import React from 'react';
import { ProductVariant } from '../../../shared/types/Product';
import { categorizeVariantsByBrand, GIFT_BOX_TYPES } from '../utils/staticProductData';
import ManualSelectionModal from './ManualSelectionModal';
import '../styles/ManualModeLayout.css';

interface ManualModeLayoutProps {
  currencyConfig: {
    currency: 'RM' | 'SGD';
    basePrice: number;
  };
  manualSelections: {
    bronys: ProductVariant[];
    kettleGourmet: ProductVariant[];
    yumiCurls: ProductVariant[];
    yumiSticks: ProductVariant[];
  };
  onSelectionChange: (brand: 'bronys' | 'kettleGourmet' | 'yumiCurls' | 'yumiSticks', variants: ProductVariant[]) => void;
  pax: string;
  onPaxChange: (value: string) => void;
  specialInstructions: string;
  onSpecialInstructionsChange: (value: string) => void;
  onDownloadPDF: () => void;
  isGenerating: boolean;
  onGiftBoxTypeChange?: (giftBoxType: { id: string; name: string; image_url: string }) => void;
}

const ManualModeLayout: React.FC<ManualModeLayoutProps> = ({
  currencyConfig,
  manualSelections,
  onSelectionChange,
  pax,
  onPaxChange,
  specialInstructions,
  onSpecialInstructionsChange,
  onDownloadPDF,
  isGenerating,
  onGiftBoxTypeChange
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [currentBrand, setCurrentBrand] = React.useState<'bronys' | 'kettleGourmet' | 'yumiCurls' | 'yumiSticks' | null>(null);

  const handleBrandClick = (brand: 'bronys' | 'kettleGourmet' | 'yumiCurls' | 'yumiSticks') => {
    setCurrentBrand(brand);
    setIsModalOpen(true);
  };

  const getTotalSelected = () => {
    return Object.values(manualSelections).reduce((sum, variants) => sum + variants.length, 0);
  };

  const getSelectionComplete = () => {
    return manualSelections.bronys.length === 2 &&
           manualSelections.kettleGourmet.length === 4 &&
           manualSelections.yumiCurls.length === 3 &&
           manualSelections.yumiSticks.length === 1;
  };

  const calculateTotal = () => {
    const paxNum = parseInt(pax) || 0;
    const tiers = [
      { min: 1, max: 49, price: currencyConfig.basePrice, discountPercent: 0 },
      { min: 50, max: 99, price: currencyConfig.basePrice * 0.95, discountPercent: 5 },
      { min: 100, max: 199, price: currencyConfig.basePrice * 0.90, discountPercent: 10 },
      { min: 200, max: 499, price: currencyConfig.basePrice * 0.85, discountPercent: 15 },
      { min: 500, max: Infinity, price: currencyConfig.basePrice * 0.80, discountPercent: 20 },
    ];

    const tier = tiers.find(t => paxNum >= t.min && paxNum <= t.max);
    const pricePerBox = tier ? tier.price : currencyConfig.basePrice;
    const discountPercent = tier ? tier.discountPercent : 0;
    const discountAmount = currencyConfig.basePrice - pricePerBox;
    const total = pricePerBox * paxNum;

    return { pricePerBox, total, paxNum, discountPercent, discountAmount };
  };

  const { pricePerBox, total, paxNum, discountPercent, discountAmount } = calculateTotal();

  const brandConfig = [
    { key: 'bronys' as const, emoji: '🍫', name: "Brony's Brownie Crisps", required: 2 },
    { key: 'kettleGourmet' as const, emoji: '🍿', name: "The Kettle Gourmet Popcorn", required: 4 },
    { key: 'yumiCurls' as const, emoji: '🌽', name: "Yumi Corn Curls", required: 3 },
    { key: 'yumiSticks' as const, emoji: '🥨', name: "Yumi Cornsticks Polybag", required: 1 },
  ];

  const [giftBoxType] = React.useState(() => {
    const selected = GIFT_BOX_TYPES[Math.floor(Math.random() * GIFT_BOX_TYPES.length)];
    // Notify parent component of the selected gift box type
    if (onGiftBoxTypeChange) {
      onGiftBoxTypeChange(selected);
    }
    return selected;
  });

  return (
    <div className="manual-mode-layout">
      {/* Section 1: Inside Contains - Matching Random Mode Layout */}
      <div className="manual-section selection-section">
        <div className="product-section-manual">
          <div className="gift-box-display">
            {giftBoxType && (
              <>
                <div className="gift-box-image">
                  <img
                    src={giftBoxType.image_url}
                    alt={giftBoxType.name}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error("Gift box image failed to load:", e.currentTarget.src);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="gift-box-name">{giftBoxType.name}</div>
              </>
            )}
          </div>
        </div>

        <div className="product-details-manual">
          <div className="product-section-manual">
            <div className="section-title-manual">Inside Contains ({getTotalSelected()})</div>
            <div className="brand-categories-manual">
              <div
                className="brand-section-manual"
                onClick={() => handleBrandClick('bronys')}
              >
                <div className="brand-title-manual">
                  Brony's Brownie Crisps ({manualSelections.bronys.length}/2)
                </div>
                <div className="brand-flavors-manual">
                  {manualSelections.bronys.length === 0 ? (
                    <div className="empty-selection">Click to select products</div>
                  ) : (
                    manualSelections.bronys.map((variant, i) => (
                      <div key={i} className="flavor-item-manual">
                        <div className="flavor-image-manual">
                          {variant.image_url ? (
                            <img
                              src={variant.image_url}
                              alt={variant.name}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error("Image failed to load:", e.currentTarget.src);
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flavor-dot-manual"></div>
                          )}
                        </div>
                        <div className="flavor-name-manual">{variant.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div
                className="brand-section-manual"
                onClick={() => handleBrandClick('kettleGourmet')}
              >
                <div className="brand-title-manual">
                  The Kettle Gourmet Popcorn ({manualSelections.kettleGourmet.length}/4)
                </div>
                <div className="brand-flavors-manual">
                  {manualSelections.kettleGourmet.length === 0 ? (
                    <div className="empty-selection">Click to select products</div>
                  ) : (
                    manualSelections.kettleGourmet.map((variant, i) => (
                      <div key={i} className="flavor-item-manual">
                        <div className="flavor-image-manual">
                          {variant.image_url ? (
                            <img
                              src={variant.image_url}
                              alt={variant.name}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error("Image failed to load:", e.currentTarget.src);
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flavor-dot-manual"></div>
                          )}
                        </div>
                        <div className="flavor-name-manual">{variant.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div
                className="brand-section-manual brand-section-locked"
              >
                <div className="brand-title-manual">
                  Yumi Corn Curls ({manualSelections.yumiCurls.length}/3)
                </div>
                <div className="brand-flavors-manual">
                  {manualSelections.yumiCurls.length === 0 ? (
                    <div className="empty-selection">Click to select flavors</div>
                  ) : (
                    manualSelections.yumiCurls.map((variant, i) => (
                      <div key={i} className="flavor-item-manual">
                        <div className="flavor-image-manual">
                          {variant.image_url ? (
                            <img
                              src={variant.image_url}
                              alt={variant.name}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error("Image failed to load:", e.currentTarget.src);
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flavor-dot-manual"></div>
                          )}
                        </div>
                        <div className="flavor-name-manual">{variant.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div
                className="brand-section-manual"
                onClick={() => handleBrandClick('yumiSticks')}
              >
                <div className="brand-title-manual">
                  Yumi Cornsticks Polybag ({manualSelections.yumiSticks.length}/1)
                </div>
                <div className="brand-flavors-manual">
                  {manualSelections.yumiSticks.length === 0 ? (
                    <div className="empty-selection">Click to select products</div>
                  ) : (
                    manualSelections.yumiSticks.map((variant, i) => (
                      <div key={i} className="flavor-item-manual">
                        <div className="flavor-image-manual">
                          {variant.image_url ? (
                            <img
                              src={variant.image_url}
                              alt={variant.name}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error("Image failed to load:", e.currentTarget.src);
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flavor-dot-manual"></div>
                          )}
                        </div>
                        <div className="flavor-name-manual">{variant.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Quantity & Pricing */}
      <div className="manual-section pricing-section">
        <h3 className="section-heading">QUANTITY & PRICING</h3>

        <div className="price-display-box">
          <div className="box-price-label">Box Price:</div>
          <div className="box-price-value">{currencyConfig.currency} {pricePerBox.toFixed(2)}</div>
          {discountPercent > 0 && (
            <div className="discount-info">
              Discount: {discountPercent}% off
            </div>
          )}
        </div>

        <div className="quantity-input-group">
          <label htmlFor="manual-pax">How many people need gift boxes?</label>
          <input
            id="manual-pax"
            type="text"
            value={pax}
            onChange={(e) => onPaxChange(e.target.value)}
            placeholder="Enter number of people"
            className="quantity-input"
          />
        </div>
      </div>

      {/* Section 3: Volume Discounts */}
      <div className="manual-section discounts-section">
        <h3 className="section-heading">VOLUME DISCOUNT TIERS</h3>

        <div className="discount-tiers">
          {[
            { range: '1 - 49 boxes', discount: '0%', multiplier: 1.0 },
            { range: '50 - 99 boxes', discount: '5% off', multiplier: 0.95 },
            { range: '100 - 199 boxes', discount: '10% off', multiplier: 0.90 },
            { range: '200 - 499 boxes', discount: '15% off', multiplier: 0.85 },
            { range: '500+ boxes', discount: '20% off', multiplier: 0.80 },
          ].map((tier, idx) => {
            const tierPrice = (currencyConfig.basePrice * tier.multiplier).toFixed(2);
            const isActive =
              (idx === 0 && paxNum >= 1 && paxNum <= 49) ||
              (idx === 1 && paxNum >= 50 && paxNum <= 99) ||
              (idx === 2 && paxNum >= 100 && paxNum <= 199) ||
              (idx === 3 && paxNum >= 200 && paxNum <= 499) ||
              (idx === 4 && paxNum >= 500);

            return (
              <div key={idx} className={`tier-row ${isActive ? 'active' : ''}`}>
                <span className="tier-range">{tier.range}</span>
                <span className="tier-price">{currencyConfig.currency} {tierPrice} each</span>
                {tier.discount !== '0%' && <span className="tier-discount">({tier.discount})</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Total Calculation */}
      <div className="manual-section total-section">
        <h3 className="section-heading">TOTAL</h3>

        <div className="total-calculation">
          <div className="calculation-line">
            {currencyConfig.currency} {pricePerBox.toFixed(2)} × {paxNum} boxes = {currencyConfig.currency} {total.toFixed(2)}
          </div>
        </div>

        <div className="special-instructions-manual">
          <label htmlFor="manual-instructions">Special Instructions (Optional)</label>
          <textarea
            id="manual-instructions"
            value={specialInstructions}
            onChange={(e) => onSpecialInstructionsChange(e.target.value)}
            placeholder="Any specific requirements, preferences, or notes..."
            className="instructions-textarea-manual"
            rows={3}
          />
        </div>

        <button
          onClick={onDownloadPDF}
          disabled={isGenerating || !getSelectionComplete() || paxNum === 0}
          className="download-pdf-btn"
        >
          {isGenerating ? 'Generating PDF...' : 'Download Quotation PDF'}
        </button>
      </div>

      {/* Manual Selection Modal */}
      {currentBrand && (
        <ManualSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          brandName={
            currentBrand === 'bronys' ? "Brony's Brownie Crisps" :
            currentBrand === 'kettleGourmet' ? "The Kettle Gourmet Popcorn" :
            currentBrand === 'yumiCurls' ? "Yumi Corn Curls" :
            "Yumi Cornsticks Polybag"
          }
          maxSelection={
            currentBrand === 'bronys' ? 2 :
            currentBrand === 'kettleGourmet' ? 4 :
            currentBrand === 'yumiCurls' ? 3 :
            1
          }
          availableVariants={(() => {
            const brandCats = categorizeVariantsByBrand();
            return brandCats[currentBrand];
          })()}
          selectedVariants={manualSelections[currentBrand]}
          onSelectionChange={(variants) => onSelectionChange(currentBrand, variants)}
        />
      )}
    </div>
  );
};

export default ManualModeLayout;
