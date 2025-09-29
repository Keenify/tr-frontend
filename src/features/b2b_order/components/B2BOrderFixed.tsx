import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { generateSnackOrderReport } from '../utils/snackOrderReportGenerator';
import { generateGiftSuggestions, generateGiftSuggestionPDF } from '../services/useGiftSuggestions';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { Product, ProductVariant } from '../../../shared/types/Product';
import { generateAutomatedGiftBox, formatGiftBoxForDisplay } from '../utils/giftSuggestionHelper';
import { getCachedProducts, cacheAllProducts, getCacheInfo } from '../utils/productCache';
import { generateGiftSuggestionPDF as generateSamplePDF } from '../utils/giftSuggestionPdfGenerator';
import '../styles/B2BOrder.css';
import '../styles/GiftSuggestion.css';

interface B2BOrderProps {
  session: Session | null;
}

const B2BOrderFixed: React.FC<B2BOrderProps> = ({ session }) => {
  // Handle both authenticated and public access
  const userId = session?.user?.id || '';
  const { companyInfo } = useUserAndCompanyData(userId);

  // Form state
  const [pax, setPax] = useState<string>('');
  const [pricePerPerson, setPricePerPerson] = useState<string>('');
  const [dietaryRestriction, setDietaryRestriction] = useState<'halal' | 'non-halal'>('halal');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // UI state
  const [showTable, setShowTable] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);

  // Product data state
  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<{[key: number]: ProductVariant[]}>({});
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Validation
  const [errors, setErrors] = useState<{ pax?: string; price?: string }>({});

  // Fetch/load products and variants when component mounts (with caching)
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      console.log('=== PRODUCT CACHE SYSTEM ===');

      // Check cache info
      const cacheInfo = getCacheInfo();
      console.log('Cache info:', cacheInfo);

      try {
        // Try to get cached products (works for both authenticated and public access)
        const { products: cachedProducts, productVariants: cachedVariants } = await getCachedProducts(companyInfo?.id);

        if (cachedProducts.length > 0) {
          console.log('✅ Successfully loaded products from cache system');
          console.log(`📦 Loaded ${cachedProducts.length} products with variants`);
          console.log('Products loaded:', cachedProducts.map(p => ({ id: p.id, name: p.name })));

          setProducts(cachedProducts);
          setProductVariants(cachedVariants);

          // Show which products have variants
          Object.entries(cachedVariants).forEach(([productId, variants]) => {
            const product = cachedProducts.find(p => p.id === parseInt(productId));
            console.log(`  📋 ${product?.name}: ${variants.length} variants`);
          });
        } else {
          console.log('❌ No products available in cache system');
          setProducts([]);
          setProductVariants({});
        }

        // If we have a company ID but no fresh cache, refresh the cache in background
        if (companyInfo?.id && (!cacheInfo.hasCache || cacheInfo.companyId !== companyInfo.id)) {
          console.log('🔄 Refreshing product cache in background...');
          cacheAllProducts(companyInfo.id).catch(error => {
            console.warn('⚠️ Background cache refresh failed:', error);
          });
        }

      } catch (error) {
        console.error('❌ Failed to load products from cache system:', error);
        setProducts([]);
        setProductVariants({});
      } finally {
        setLoadingProducts(false);
        console.log('=== END PRODUCT CACHE SYSTEM ===');
      }
    };

    loadProducts();
  }, [companyInfo?.id]);

  const validateInputs = () => {
    const newErrors: { pax?: string; price?: string } = {};

    if (!pax || isNaN(parseInt(pax)) || parseInt(pax) < 1) {
      newErrors.pax = 'Please enter a valid number of people (minimum 1)';
    }

    if (!pricePerPerson || isNaN(parseFloat(pricePerPerson)) || parseFloat(pricePerPerson) < 1) {
      newErrors.price = 'Please enter a valid price per person (minimum RM 1)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaxChange = (value: string) => {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPax(value);
      if (errors.pax) {
        setErrors({ ...errors, pax: undefined });
      }
    }
  };

  const handlePriceChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPricePerPerson(value);
      if (errors.price) {
        setErrors({ ...errors, price: undefined });
      }
    }
  };

  const handleGenerateGifts = async () => {
    if (!validateInputs()) {
      return;
    }

    console.log('Starting gift generation...');
    setIsGenerating(true);

    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const paxNum = parseInt(pax);
      const priceNum = parseFloat(pricePerPerson);
      const isHalal = dietaryRestriction === 'halal';

      // Enhanced debug logging
      console.log('=== GIFT GENERATOR DEBUG ===');
      console.log('Total products:', products.length);
      console.log('Company ID:', companyInfo?.id);
      console.log('Products:', products);
      console.log('Product variants:', productVariants);

      // Check each product for variants
      products.forEach(product => {
        const variants = productVariants[product.id] || [];
        console.log(`Product "${product.name}" (ID: ${product.id}):`, {
          hasVariants: variants.length > 0,
          variantCount: variants.length,
          variants: variants.map(v => v.name)
        });
      });

      // Filter available products and log the filtering process
      const availableProducts = products.filter(product => {
        const hasVariants = productVariants[product.id] && productVariants[product.id].length > 0;
        console.log(`Product "${product.name}": hasVariants = ${hasVariants}`);
        return hasVariants;
      });

      console.log('Available products after filtering:', availableProducts.length);
      console.log('Available products:', availableProducts.map(p => ({ id: p.id, name: p.name })));
      console.log('=== END DEBUG ===');

      // Use the automated gift box generation with real products
      const automatedGiftBox = generateAutomatedGiftBox(
        {
          pax: paxNum,
          budgetPerPerson: priceNum,
          dietaryRestriction: dietaryRestriction
        },
        products,
        productVariants,
        'SG' // Default to Singapore branch - could be made dynamic
      );

      if (!automatedGiftBox) {
        // Show user-friendly message when no real products are available
        console.warn('No real products available for automated generation.');

        // Check if we have any products at all
        const hasProducts = products.length > 0;
        const hasVariants = Object.values(productVariants).some(variants => variants.length > 0);

        let message = 'No products available for gift generation!\n\n';

        if (!hasProducts) {
          message += '• No products found in the system\n';
          message += '• Please add products in the Product section first\n';
        } else if (!hasVariants) {
          message += `• Found ${products.length} products but no variants\n`;
          message += '• Please add variants/flavors to your products\n';
        } else {
          message += '• Products and variants exist but none are suitable for gift boxes\n';
          message += '• Check that products have proper pricing and variants\n';
        }

        message += '\nTip: Go to Product section → Add products → Add variants for each product';

        alert(message);
        setIsGenerating(false);
        return;
      }

      // Format the automated gift box for display
      const formattedGiftBox = formatGiftBoxForDisplay(automatedGiftBox);
      const giftBoxItem = {
        ...formattedGiftBox,
        specialInstructions,
        name: automatedGiftBox.name,
        description: automatedGiftBox.description,
        tierPricing: automatedGiftBox.tierPricing
      };

      console.log('Generated automated gift box:', giftBoxItem);
      setGeneratedItems([giftBoxItem]);
      setShowTable(true);

    } catch (error) {
      console.error('Error generating gift suggestions:', error);
      alert('Failed to generate gift suggestions. Please try again.');
    } finally {
      console.log('Finished gift generation');
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (isGenerating) return; // Prevent double clicks

    console.log('Regenerate button clicked - generating new combinations...');

    // Small delay to ensure different time-based seeds
    await new Promise(resolve => setTimeout(resolve, 50));

    // Clear current results first to show loading state
    setGeneratedItems([]);

    await handleGenerateGifts();
  };


  const handleExportPDF = async () => {
    if (isGenerating || generatedItems.length === 0) return;

    try {
      setIsGenerating(true);
      const currentItem = generatedItems[0];

      // Create the gift box option object for the backend
      const giftBoxOption = {
        name: currentItem.productDescription,
        basePrice: parseFloat(currentItem.pricePerBox),
        actualPrice: parseFloat(currentItem.pricePerBox),
        totalPrice: parseFloat(currentItem.total),
        flavors: currentItem.flavors,
        products: {}, // This would be populated with actual product data
        budgetMessage: currentItem.budgetMessage
      };

      // Create the parameters object
      const params = {
        pax: parseInt(pax),
        budgetPerPerson: parseFloat(pricePerPerson),
        dietaryRestriction: dietaryRestriction,
        specialInstructions: specialInstructions,
        companyInfo: companyInfo || { name: 'Unknown Company' }
      };

      console.log('Generating PDF with backend...');
      const pdfBlob = await generateGiftSuggestionPDF(giftBoxOption, params);

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gift_Suggestions_${params.pax}pax_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Backend service might not be available. Please try the local generation instead.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSample = async () => {
    if (isGenerating || generatedItems.length === 0) {
      console.log('Cannot generate PDF: isGenerating =', isGenerating, 'generatedItems.length =', generatedItems.length);
      return;
    }

    try {
      const currentItem = generatedItems[0];
      console.log('Current item data:', currentItem);

      // Prepare gift data for PDF generation
      const giftData = {
        name: currentItem.name || currentItem.productDescription || 'Gift Box',
        description: currentItem.description || currentItem.productDescription || 'Custom Gift Box',
        pax: currentItem.pax || parseInt(pax),
        pricePerBox: currentItem.pricePerBox || '0.00',
        total: currentItem.total || '0.00',
        selectedProducts: currentItem.selectedProducts || [],
        variants: currentItem.variants || [],
        tierPricing: currentItem.tierPricing || [],
        specialInstructions: currentItem.specialInstructions
      };

      // Form inputs for the report
      const formInputs = {
        pax,
        pricePerPerson,
        dietaryRestriction,
        specialInstructions
      };

      console.log('Gift data prepared:', giftData);
      console.log('Form inputs:', formInputs);
      console.log('Company info:', companyInfo);
      console.log('Generating sample PDF report...');

      await generateSamplePDF(giftData, companyInfo, formInputs);
      console.log('PDF generation completed successfully');

    } catch (error) {
      console.error('Detailed error generating sample PDF:', error);
      console.error('Error stack:', error.stack);
      alert(`Failed to generate PDF sample: ${error.message}. Please check the console for details.`);
    }
  };

  return (
    <div className="gift-suggestion-page">
      <div className="gift-suggestion-container">
        <div className="gift-suggestion-header">
          <h2>Gift Suggestion Generator</h2>
          <p className="subtitle">Generate personalized gift suggestions for your team or clients</p>
        </div>

        <div className="form-content">
          {/* Three input fields in a row */}
          <div className="input-row">
            <div className="input-group">
              <div className="input-field-container">
                <label htmlFor="pax">Number of People</label>
                <div className="input-with-error">
                  <input
                    id="pax"
                    type="text"
                    value={pax}
                    onChange={(e) => handlePaxChange(e.target.value)}
                    placeholder="Enter number"
                    className={`form-input ${errors.pax ? 'error' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-field-container">
                <label htmlFor="price">Price per Person (RM)</label>
                <div className="input-with-error">
                  <input
                    id="price"
                    type="text"
                    value={pricePerPerson}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0.00"
                    className={`form-input ${errors.price ? 'error' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-field-container">
                <label htmlFor="dietary">Dietary Restriction</label>
                <div className="input-with-error">
                  <select
                    id="dietary"
                    value={dietaryRestriction}
                    onChange={(e) => setDietaryRestriction(e.target.value as 'halal' | 'non-halal')}
                    className="form-select"
                  >
                    <option value="halal">Halal</option>
                    <option value="non-halal">Non-Halal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Special instructions box */}
          <div className="special-instructions">
            <label htmlFor="instructions">Special Instructions (Optional)</label>
            <textarea
              id="instructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific requirements, preferences, or notes..."
              className="instructions-textarea"
              rows={3}
            />
          </div>

          {/* Generate button (when no table) */}
          {!showTable && (
            <div className="button-container">
              <button
                onClick={handleGenerateGifts}
                disabled={isGenerating || !!errors.pax || !!errors.price}
                className="generate-btn"
              >
{isGenerating ? 'Generating...' : 'Generate Gift Suggestions'}
              </button>
            </div>
          )}

          {/* Results Section - New Card Design */}
          {showTable && (
            <div className="results-section">
              <h3>🎁 Your Personalized Gift Suggestions</h3>
              <div className="gift-box-cards">
                {generatedItems.map((item, index) => (
                  <div key={index} className="gift-box-card">
                    <div className="card-header">
                      <h4>{item.name || item.productDescription}</h4>
                      <span className="badge">✨ Auto-Generated Package</span>
                    </div>

                    <div className="card-body">
                      {/* Left Side - Product Details */}
                      <div className="product-details">
                        <div className="product-section">
                          <div className="section-title">Selected Products</div>
                          <div className="product-list">
                            {item.selectedProducts && item.selectedProducts.map((product, i) => (
                              <div key={i} className="product-item">
                                <div className="product-icon">📦</div>
                                <span className="product-name">{product.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="product-section">
                          <div className="section-title">Flavor Varieties ({item.variants?.length || 0})</div>
                          <div className="flavor-chips">
                            {item.variants && item.variants.map((variant, i) => (
                              <span key={i} className="flavor-chip">
                                {variant.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {item.specialInstructions && (
                          <div className="special-instructions-display">
                            <strong>Special Instructions:</strong>
                            <div>{item.specialInstructions}</div>
                          </div>
                        )}

                        {/* Packaging Preview */}
                        <div className="packaging-preview">
                          {item.variants && item.variants.slice(0, 8).map((variant, i) => (
                            <div key={i} className="package-thumbnail" title={variant.name}>
                              {variant.image_url ? (
                                <img src={variant.image_url} alt={variant.name} />
                              ) : (
                                <div className="package-placeholder">
                                  {variant.name.split(' ').map(w => w[0]).join('').substring(0, 3)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Side - Pricing Panel */}
                      <div className="pricing-panel">
                        <div className="price-display">
                          <div className="quantity-label">Quantity</div>
                          <div className="quantity-value">{item.pax} boxes</div>
                          <div className="price-per-box">RM {item.pricePerBox} per box</div>
                          <div className="total-price">Total: RM {item.total}</div>
                        </div>

                        {/* Tier Pricing */}
                        {item.tierPricing && (
                          <div className="tier-pricing-section">
                            <div className="tier-pricing-title">Volume Discounts</div>
                            <div className="tier-list">
                              {item.tierPricing.slice(0, 5).map((tier, idx) => (
                                <div
                                  key={idx}
                                  className={`tier-item ${item.pax >= tier.minQuantity && item.pax <= tier.maxQuantity ? 'active' : ''}`}
                                >
                                  <span className="tier-range">
                                    {tier.minQuantity}{tier.maxQuantity === Infinity ? '+' : `-${tier.maxQuantity}`} boxes
                                  </span>
                                  <span className="tier-price">
                                    RM {tier.pricePerUnit.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons (when table is shown) */}
              <div className="button-container">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating || !!errors.pax || !!errors.price}
                  className="regenerate-btn"
                >
                  {isGenerating ? 'Regenerating...' : '🔄 Regenerate Suggestions'}
                </button>
              </div>

              {/* Download sample link - positioned under the regenerate button */}
              <div className="download-sample-container">
                <span
                  onClick={handleDownloadSample}
                  className="download-sample-link"
                >
                  📄 Download Sample Report
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default B2BOrderFixed;