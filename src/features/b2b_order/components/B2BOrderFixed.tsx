import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { generateSnackOrderReport } from '../utils/snackOrderReportGenerator';
import { generateGiftSuggestions, generateGiftSuggestionPDF } from '../services/useGiftSuggestions';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { Product, ProductVariant } from '../../../shared/types/Product';
import { generateAutomatedGiftBox, formatGiftBoxForDisplay } from '../utils/giftSuggestionHelper';
import { getCachedProducts, cacheAllProducts, getCacheInfo, initializePublicCache } from '../utils/productCache';
import { getStaticProducts } from '../utils/staticProductData';
import { generateGiftSuggestionPDF as generateSamplePDF } from '../utils/giftSuggestionPdfGenerator';
import { transformGiftSuggestionToQuotation } from '../utils/giftSuggestionToQuotation';
import { useCurrencyDetection } from '../hooks/useCurrencyDetection';
import { BACKEND_API_DOMAIN } from '../../../config';
import '../styles/B2BOrder.css';
import '../styles/GiftSuggestion.css';

interface B2BOrderProps {
  session: Session | null;
}

const B2BOrderFixed: React.FC<B2BOrderProps> = ({ session }) => {
  // Handle both authenticated and public access
  const userId = session?.user?.id || '';
  const { companyInfo } = useUserAndCompanyData(userId);

  // Detect currency based on user's IP location
  const { currencyConfig, loading: currencyLoading } = useCurrencyDetection();

  // Form state
  const [pax, setPax] = useState<string>('');
  const [pricePerPerson, setPricePerPerson] = useState<string>('');
  const [dietaryRestriction, setDietaryRestriction] = useState<'halal' | 'non-halal'>('halal');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // UI state
  const [showTable, setShowTable] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<Array<{
    name: string;
    description: string;
    pax: number;
    pricePerBox: string;
    total: string;
    productDescription?: string;
    specialInstructions?: string;
    tierPricing: Array<{
      minQuantity: number;
      maxQuantity: number;
      pricePerUnit: number;
    }>;
    giftBoxType?: {
      id: string;
      name: string;
      image_url: string;
    };
    brandCategories?: {
      bronys: ProductVariant[];
      kettleGourmet: ProductVariant[];
      yumiCurls: ProductVariant[];
      yumiSticks: ProductVariant[];
    };
    selectedProducts: Array<{
      name: string;
      price?: number;
    }>;
    variants: Array<{
      name: string;
      image_url: string | null;
      productName: string;
    }>;
    priceBreakdown?: {
      baseCost: number;
      markup: number;
      discount: number;
    };
  }>>([]);

  // Product data state
  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<{[key: number]: ProductVariant[]}>({});
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Validation
  const [errors, setErrors] = useState<{ pax?: string; price?: string }>({});

  // Auto-hide error messages after 3 seconds
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

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
          console.log('❌ No products available in cache system, using static fallback');
          // Use static products as fallback for incognito/public access
          const { products: staticProducts, productVariants: staticVariants } = getStaticProducts();
          setProducts(staticProducts);
          setProductVariants(staticVariants);
          console.log('✅ Loaded static products for public access');
        }

        // Initialize public cache if no cache exists at all (for first-time visitors)
        if (!cacheInfo.hasCache) {
          console.log('🚀 No cache found, initializing for public access...');
          initializePublicCache().catch(error => {
            console.warn('⚠️ Public cache initialization failed:', error);
          });
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
        // Use static products as ultimate fallback
        const { products: staticProducts, productVariants: staticVariants } = getStaticProducts();
        setProducts(staticProducts);
        setProductVariants(staticVariants);
        console.log('✅ Using static products as fallback after cache failure');
      } finally {
        setLoadingProducts(false);
        console.log('=== END PRODUCT CACHE SYSTEM ===');
      }
    };

    loadProducts();
  }, [companyInfo?.id]);

  const validateInputs = () => {
    const newErrors: { pax?: string; price?: string } = {};
    const paxNum = parseInt(pax);
    const priceNum = parseFloat(pricePerPerson);

    // Validate number of people (1-1000 range)
    if (!pax || isNaN(paxNum) || paxNum < 1) {
      newErrors.pax = 'Please enter a valid number of people (minimum 1)';
    } else if (paxNum > 1000) {
      newErrors.pax = 'Number of people should be less than 1000 for practical orders';
    }

    // Validate price per person (minimum based on detected currency)
    const minPrice = currencyConfig.minPrice;
    if (!pricePerPerson || isNaN(priceNum) || priceNum < minPrice) {
      newErrors.price = `Please enter a valid price per person (minimum ${currencyConfig.currency} ${minPrice})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaxChange = (value: string) => {
    // Allow numbers only, but don't block editing when over limit
    if (value === '' || /^\d+$/.test(value)) {
      setPax(value);
      // Clear error when user starts typing valid numbers
      if (errors.pax && value !== '' && parseInt(value) >= 1 && parseInt(value) <= 1000) {
        setErrors({ ...errors, pax: undefined });
      }
    }
  };

  const handlePriceChange = (value: string) => {
    // Allow numbers and decimal point, but don't block editing when over limit
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPricePerPerson(value);
      // Clear error when user starts typing valid prices
      if (errors.price && value !== '' && parseFloat(value) >= currencyConfig.minPrice) {
        setErrors({ ...errors, price: undefined });
      }
    }
  };

  const handleGenerateGifts = async () => {
    console.log('Generate button clicked!');
    console.log('Current form values:', { pax, pricePerPerson, dietaryRestriction });
    
    if (!validateInputs()) {
      console.log('Validation failed, not generating');
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
        currencyConfig.countryCode === 'SG' ? 'SG' : 'MY', // Dynamic branch based on detected country
        currencyConfig.basePrice // Pass detected base price
      );

      console.log('Generated automated gift box result:', automatedGiftBox);

      if (!automatedGiftBox) {
        // Products are still loading or not available - just log for debugging
        console.warn('No products available for automated generation (products may still be loading).');
        console.log('Products:', products.length, 'Product variants:', Object.keys(productVariants).length);
        console.log('Products details:', products);
        console.log('Product variants details:', productVariants);
        console.log('Is public access check:', products.length === 1 && products[0]?.id === 78);

        // Show alert to user so they know what's happening
        alert('Unable to generate gift suggestions. Please ensure you have products with variants available, or try refreshing the page.');
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
        tierPricing: automatedGiftBox.tierPricing,
        giftBoxType: automatedGiftBox.giftBoxType,
        brandCategories: automatedGiftBox.brandCategories
      };

      console.log('Generated automated gift box:', giftBoxItem);
      console.log('Gift box type:', giftBoxItem.giftBoxType);
      console.log('Brand categories:', giftBoxItem.brandCategories);
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

      console.log('🎁 Starting PDF generation using quotation system...');

      // Form inputs for transformation
      const formInputs = {
        pax,
        pricePerPerson,
        dietaryRestriction,
        specialInstructions
      };

      // Transform gift suggestion data to exact quotation format
      const quotationData = transformGiftSuggestionToQuotation(
        currentItem,
        companyInfo,
        formInputs,
        products,
        productVariants,
        'Gift Box Customer', // customerCompanyName
        'Sales Representative', // salesManager
        currencyConfig.currency // Pass detected currency
      );

      console.log('📋 Transformed quotation data:', quotationData);
      console.log('🔗 Calling quotation API directly...');

      // Call the quotation API directly - this will produce the EXACT same PDF as quotations
      const response = await fetch(`${BACKEND_API_DOMAIN}/quotations/generate`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      console.log('📊 Quotation API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Quotation API error:', errorText);
        throw new Error(`Failed to generate quotation PDF: ${response.status} - ${errorText}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      console.log('✅ PDF generated successfully, size:', pdfBlob.size, 'bytes');

      // Download the PDF with descriptive filename
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gift_Suggestion_Quotation_${parseInt(pax)}pax_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('📥 PDF download initiated');

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
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
      setIsGenerating(true);
      const currentItem = generatedItems[0];

      console.log('🎁 Starting PDF generation using quotation system...');

      // Form inputs for transformation
      const formInputs = {
        pax,
        pricePerPerson,
        dietaryRestriction,
        specialInstructions
      };

      // Transform gift suggestion data to exact quotation format
      const quotationData = transformGiftSuggestionToQuotation(
        currentItem,
        companyInfo,
        formInputs,
        products,
        productVariants,
        'Gift Box Customer', // customerCompanyName
        'Sales Representative', // salesManager
        currencyConfig.currency // Pass detected currency
      );

      console.log('📋 Transformed quotation data:', quotationData);
      console.log('🔗 Calling quotation API directly...');

      // Call the quotation API directly - this will produce the EXACT same PDF as quotations
      const response = await fetch(`${BACKEND_API_DOMAIN}/quotations/generate`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      console.log('📊 Quotation API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Quotation API error:', errorText);
        throw new Error(`Failed to generate quotation PDF: ${response.status} - ${errorText}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      console.log('✅ PDF generated successfully, size:', pdfBlob.size, 'bytes');

      // Download the PDF with descriptive filename
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gift_Suggestion_Report_${parseInt(pax)}pax_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('📥 PDF download initiated');

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
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
                  {errors.pax && <div className="error-message">{errors.pax}</div>}
                </div>
                <div className="input-explanation">Range: 1-1000 people</div>
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
                  {errors.price && <div className="error-message">{errors.price}</div>}
                </div>
                <div className="input-explanation">Minimum: {currencyConfig.currency} {currencyConfig.minPrice}</div>
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
                    </div>

                    <div className="card-body">
                      {/* Left Side - Product Details */}
                      <div className="product-details">
                        <div className="product-section">
                          <div className="gift-box-display">
                            {item.giftBoxType && (
                              <>
                                <div className="gift-box-image">
                                  <img 
                                    src={item.giftBoxType.image_url} 
                                    alt={item.giftBoxType.name}
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                      console.error("Gift box image failed to load:", e.currentTarget.src);
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                                <div className="gift-box-name">{item.giftBoxType.name}</div>
                              </>
                            )}
                            {!item.giftBoxType && item.selectedProducts && item.selectedProducts.map((product, i) => (
                              <div key={i} className="product-item">
                                <div className="product-icon">📦</div>
                                <span className="product-name">{product.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="product-section">
                          <div className="section-title">Inside Contains ({item.variants?.length || 0})</div>
                          {item.brandCategories ? (
                            <div className="brand-categories">
                              <div className="brand-section">
                                <div className="brand-title">Brony's Brownie Crisps ({item.brandCategories.bronys.length})</div>
                                <div className="brand-flavors">
                                  {item.brandCategories.bronys.map((variant, i) => (
                                    <div key={i} className="flavor-item">
                                      <div className="flavor-image">
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
                                          <div className="flavor-dot"></div>
                                        )}
                                      </div>
                                      <div className="flavor-name">{variant.name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="brand-section">
                                <div className="brand-title">The Kettle Gourmet Popcorn ({item.brandCategories.kettleGourmet.length})</div>
                                <div className="brand-flavors">
                                  {item.brandCategories.kettleGourmet.map((variant, i) => (
                                    <div key={i} className="flavor-item">
                                      <div className="flavor-image">
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
                                          <div className="flavor-dot"></div>
                                        )}
                                      </div>
                                      <div className="flavor-name">{variant.name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="brand-section">
                                <div className="brand-title">Yumi Corn Curls ({item.brandCategories.yumiCurls.length})</div>
                                <div className="brand-flavors">
                                  {item.brandCategories.yumiCurls.map((variant, i) => (
                                    <div key={i} className="flavor-item">
                                      <div className="flavor-image">
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
                                          <div className="flavor-dot"></div>
                                        )}
                                      </div>
                                      <div className="flavor-name">{variant.name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="brand-section">
                                <div className="brand-title">Yumi Cornsticks Polybag ({item.brandCategories.yumiSticks.length})</div>
                                <div className="brand-flavors">
                                  {item.brandCategories.yumiSticks.map((variant, i) => (
                                    <div key={i} className="flavor-item">
                                      <div className="flavor-image">
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
                                          <div className="flavor-dot"></div>
                                        )}
                                      </div>
                                      <div className="flavor-name">{variant.name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flavor-chips">
                              {item.variants && item.variants.map((variant, i) => (
                                <span key={i} className="flavor-chip">
                                  {variant.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>


                      </div>

                      {/* Right Side - Pricing Panel */}
                      <div className="pricing-panel">
                        <div className="price-display">
                          <div className="quantity-label">Each staff will get</div>
                          <div className="quantity-value">{item.pax} boxes</div>
                          <div className="price-per-box">{currencyConfig.currency} {item.pricePerBox} per box</div>
                          <div className="total-price">Total: {currencyConfig.currency} {item.total}</div>
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
                                    {currencyConfig.currency} {tier.pricePerUnit.toFixed(2)}
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
                  className={`download-sample-link ${isGenerating ? 'disabled' : ''}`}
                  style={{
                    opacity: isGenerating ? 0.6 : 1,
                    cursor: isGenerating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isGenerating ? '📄 Generating PDF...' : '📄 Download Quotation PDF'}
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