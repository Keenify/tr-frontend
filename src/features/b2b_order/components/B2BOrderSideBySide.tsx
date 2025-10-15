import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { Product, ProductVariant } from '../../../shared/types/Product';
import { generateAutomatedGiftBox, formatGiftBoxForDisplay } from '../utils/giftSuggestionHelper';
import { getCachedProducts, initializePublicCache, getCacheInfo, cacheAllProducts } from '../utils/productCache';
import { categorizeVariantsByBrand, GIFT_BOX_TYPES, getStaticProducts } from '../utils/staticProductData';
import { transformGiftSuggestionToQuotation } from '../utils/giftSuggestionToQuotation';
import { useCurrencyDetection } from '../hooks/useCurrencyDetection';
import { BACKEND_API_DOMAIN } from '../../../config';
import SelectionModeHeader from './SelectionModeBox';
import ManualSelectionModal from './ManualSelectionModal';
import '../styles/B2BOrder.css';
import '../styles/GiftSuggestion.css';
import '../styles/SplitScreenGift.css';
import '../styles/ManualModeLayout.css';

interface B2BOrderSideBySideProps {
  session: Session | null;
}

const B2BOrderSideBySide: React.FC<B2BOrderSideBySideProps> = ({ session }) => {
  const userId = session?.user?.id || '';
  const { companyInfo } = useUserAndCompanyData(userId);
  const { currencyConfig, loading: currencyLoading, error: currencyError } = useCurrencyDetection();

  // Debug currency detection
  useEffect(() => {
    console.log('=== CURRENCY DETECTION ===');
    console.log('Currency Config:', currencyConfig);
    console.log('Currency Loading:', currencyLoading);
    console.log('Currency Error:', currencyError);
    console.log('=========================');
  }, [currencyConfig, currencyLoading, currencyError]);

  // Product data
  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<{[key: number]: ProductVariant[]}>({});

  // Random mode state
  const [randomPax, setRandomPax] = useState<string>('');
  const [randomPrice, setRandomPrice] = useState<string>('');
  const [randomInstructions, setRandomInstructions] = useState<string>('');
  const [randomGenerating, setRandomGenerating] = useState(false);
  const [randomResult, setRandomResult] = useState<any>(null);
  const [randomErrors, setRandomErrors] = useState<{pax?: string; price?: string}>({});

  // Manual mode state
  const [manualPax, setManualPax] = useState<string>('');
  const [manualInstructions, setManualInstructions] = useState<string>('');
  const [manualGenerating, setManualGenerating] = useState(false);
  const [manualGiftBoxType, setManualGiftBoxType] = useState<any>(null);
  const [manualSelections, setManualSelections] = useState<{
    bronys: ProductVariant[];
    kettleGourmet: ProductVariant[];
    yumiCurls: ProductVariant[];
    yumiSticks: ProductVariant[];
  }>({
    bronys: [],
    kettleGourmet: [],
    yumiCurls: [],
    yumiSticks: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<'bronys' | 'kettleGourmet' | 'yumiCurls' | 'yumiSticks' | null>(null);
  const [manualPaxError, setManualPaxError] = useState<string>('');

  // Track which panel is active
  const [activePanel, setActivePanel] = useState<'random' | 'manual' | null>(null);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
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
          setProducts(cachedProducts);
          setProductVariants(cachedVariants);
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
        console.log('=== END PRODUCT CACHE SYSTEM ===');
      }
    };

    loadProducts();
  }, [companyInfo?.id]);

  // Auto-populate Yumi Curls on mount
  useEffect(() => {
    const brandCats = categorizeVariantsByBrand();
    setManualSelections(prev => ({
      ...prev,
      yumiCurls: brandCats.yumiCurls
    }));
  }, []);

  // Initialize manual gift box type
  useEffect(() => {
    const selected = GIFT_BOX_TYPES[Math.floor(Math.random() * GIFT_BOX_TYPES.length)];
    setManualGiftBoxType(selected);
  }, []);

  // Manual mode helper functions
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

  const calculateManualTotal = () => {
    const paxNum = parseInt(manualPax) || 0;
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

  // Random mode handlers
  const handleRandomGenerate = async () => {
    const paxNum = parseInt(randomPax);
    const priceNum = parseFloat(randomPrice);
    const newErrors: any = {};

    if (!randomPax || isNaN(paxNum) || paxNum < 1) {
      newErrors.pax = 'Please enter valid number of people';
    }
    if (!randomPrice || isNaN(priceNum) || priceNum < currencyConfig.minPrice) {
      newErrors.price = `Minimum ${currencyConfig.currency} ${currencyConfig.minPrice}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setRandomErrors(newErrors);
      return;
    }

    setRandomGenerating(true);
    setRandomErrors({});

    const automatedGiftBox = generateAutomatedGiftBox(
      { pax: paxNum, budgetPerPerson: priceNum, dietaryRestriction: 'halal' },
      products,
      productVariants,
      currencyConfig.countryCode === 'SG' ? 'SG' : 'MY',
      currencyConfig.basePrice
    );

    if (automatedGiftBox) {
      const formatted = formatGiftBoxForDisplay(automatedGiftBox);
      setRandomResult({
        ...formatted,
        specialInstructions: randomInstructions,
        name: automatedGiftBox.name,
        description: automatedGiftBox.description,
        tierPricing: automatedGiftBox.tierPricing,
        giftBoxType: automatedGiftBox.giftBoxType,
        brandCategories: automatedGiftBox.brandCategories
      });
    }

    setRandomGenerating(false);
  };

  const handleRandomDownload = async () => {
    if (!randomResult) return;

    setRandomGenerating(true);
    const formInputs = {
      pax: randomPax,
      pricePerPerson: randomPrice,
      dietaryRestriction: 'halal' as 'halal' | 'non-halal',
      specialInstructions: randomInstructions
    };

    const quotationData = transformGiftSuggestionToQuotation(
      randomResult,
      companyInfo,
      formInputs,
      products,
      productVariants,
      'Gift Box Customer',
      'Sales Representative',
      currencyConfig.currency
    );

    const response = await fetch(`${BACKEND_API_DOMAIN}/quotations/generate`, {
      method: 'POST',
      headers: { 'Accept': '*/*', 'Content-Type': 'application/json' },
      body: JSON.stringify(quotationData),
    });

    if (response.ok) {
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gift_Random_${parseInt(randomPax)}pax_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setRandomGenerating(false);
  };

  // Manual mode handlers
  const handleManualSelectionChange = (brand: 'bronys' | 'kettleGourmet' | 'yumiCurls' | 'yumiSticks', variants: ProductVariant[]) => {
    setManualSelections(prev => ({ ...prev, [brand]: variants }));
  };

  const handleManualDownload = async () => {
    const { bronys, kettleGourmet, yumiCurls, yumiSticks } = manualSelections;

    if (bronys.length !== 2 || kettleGourmet.length !== 4 || yumiCurls.length !== 3 || yumiSticks.length !== 1) {
      alert('Please select exactly:\n- 2 Brony\'s Brownie Crisps\n- 4 Kettle Gourmet Popcorn\n- 3 Yumi Corn Curls\n- 1 Yumi Cornsticks Polybag');
      return;
    }

    const paxNum = parseInt(manualPax);
    if (!manualPax || isNaN(paxNum) || paxNum < 1) {
      setManualPaxError('Quantity is required');
      return;
    }

    setManualPaxError('');
    setManualGenerating(true);

    const allSelectedVariants = [...bronys, ...kettleGourmet, ...yumiCurls, ...yumiSticks];
    const priceNum = currencyConfig.basePrice;

    const tiers = [
      { minQuantity: 1, maxQuantity: 49, pricePerUnit: priceNum },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: priceNum * 0.95 },
      { minQuantity: 100, maxQuantity: 199, pricePerUnit: priceNum * 0.90 },
      { minQuantity: 200, maxQuantity: 499, pricePerUnit: priceNum * 0.85 },
      { minQuantity: 500, maxQuantity: Infinity, pricePerUnit: priceNum * 0.80 },
    ];

    const tier = tiers.find(t => paxNum >= t.minQuantity && paxNum <= t.maxQuantity);
    const pricePerBox = tier ? tier.pricePerUnit : priceNum;
    const selectedGiftBoxType = manualGiftBoxType || GIFT_BOX_TYPES[0];

    const itemToExport = {
      name: selectedGiftBoxType.name,
      description: 'Custom selected gift box',
      pax: paxNum,
      pricePerBox: pricePerBox.toFixed(2),
      total: (paxNum * pricePerBox).toFixed(2),
      productDescription: 'Custom selected gift box',
      specialInstructions: manualInstructions,
      tierPricing: tiers,
      giftBoxType: selectedGiftBoxType,
      brandCategories: manualSelections,
      selectedProducts: [],
      variants: allSelectedVariants.map(v => ({
        name: v.name,
        image_url: v.image_url,
        productName: 'Gift Box'
      })),
      priceBreakdown: { baseCost: pricePerBox, markup: 0, discount: 0 }
    };

    const formInputs = {
      pax: manualPax,
      pricePerPerson: currencyConfig.basePrice.toString(),
      dietaryRestriction: 'halal' as 'halal' | 'non-halal',
      specialInstructions: manualInstructions
    };

    const quotationData = transformGiftSuggestionToQuotation(
      itemToExport,
      companyInfo,
      formInputs,
      products,
      productVariants,
      'Gift Box Customer',
      'Sales Representative',
      currencyConfig.currency
    );

    const response = await fetch(`${BACKEND_API_DOMAIN}/quotations/generate`, {
      method: 'POST',
      headers: { 'Accept': '*/*', 'Content-Type': 'application/json' },
      body: JSON.stringify(quotationData),
    });

    if (response.ok) {
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gift_Manual_${parseInt(manualPax)}pax_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setManualGenerating(false);
  };

  return (
    <div className="gift-suggestion-page">
      <SelectionModeHeader />

      <div className="split-screen-container">
        {/* Random Mode Panel */}
        <div
          className="mode-panel random-mode-panel"
          onClick={() => setActivePanel('random')}
          style={{
            filter: activePanel === 'manual' ? 'grayscale(100%)' : 'none',
            opacity: activePanel === 'manual' ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: activePanel === 'random' ? 'scale(1.01)' : 'scale(1)',
            border: activePanel === 'random' ? '2px solid #667eea' : 'none'
          }}
        >
          <div className="mode-panel-header">
            <h3 className="mode-panel-title">Let us surprise you with our selection</h3>
          </div>

          <div className="form-content">
            {/* Two input fields side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="input-group">
                <label htmlFor="random-pax">Number of People</label>
                <input
                  id="random-pax"
                  type="text"
                  value={randomPax}
                  onChange={(e) => setRandomPax(e.target.value)}
                  placeholder="Enter number"
                  className="form-input"
                />
                {randomErrors.pax && <div className="error-message">{randomErrors.pax}</div>}
              </div>

              <div className="input-group">
                <label htmlFor="random-price">Price per Person</label>
                <input
                  id="random-price"
                  type="text"
                  value={randomPrice}
                  onChange={(e) => setRandomPrice(e.target.value)}
                  placeholder="0.00"
                  className="form-input"
                />
                {randomErrors.price && <div className="error-message">{randomErrors.price}</div>}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="random-instructions">Special Instructions (Optional)</label>
              <textarea
                id="random-instructions"
                value={randomInstructions}
                onChange={(e) => setRandomInstructions(e.target.value)}
                placeholder="Any specific requirements..."
                className="instructions-textarea"
                rows={3}
              />
            </div>

            {/* Generate/Regenerate Button - Only show when no results */}
            {!randomResult && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0', width: '100%' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRandomGenerate(); }}
                  disabled={randomGenerating}
                  className="generate-btn"
                  style={{ width: 'auto', padding: '12px 32px', margin: '0 auto' }}
                >
                  {randomGenerating ? 'Generating...' : 'Generate Gift Box'}
                </button>
              </div>
            )}

            {/* Results Section */}
            {randomResult && (
              <div style={{ marginTop: '30px' }}>
                {/* Gift Box Display */}
                <div style={{ marginBottom: '20px' }}>
                  {randomResult.giftBoxType && (
                    <div className="gift-box-display" style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <div className="gift-box-image" style={{ maxWidth: '200px', margin: '0 auto 10px' }}>
                        <img
                          src={randomResult.giftBoxType.image_url}
                          alt={randomResult.giftBoxType.name}
                          crossOrigin="anonymous"
                          style={{ width: '100%', borderRadius: '12px' }}
                        />
                      </div>
                      <div className="gift-box-name" style={{ fontWeight: '600', fontSize: '18px' }}>
                        {randomResult.giftBoxType.name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Brand Categories */}
                <div style={{ marginBottom: '30px' }}>
                  <div className="section-title" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>
                    Inside Contains ({randomResult.variants?.length || 0})
                  </div>
                  {randomResult.brandCategories && (
                    <div className="brand-categories">
                      {Object.entries(randomResult.brandCategories).map(([key, variants]: [string, any]) => {
                        const brandNames = {
                          bronys: "Brony's Brownie Crisps",
                          kettleGourmet: "The Kettle Gourmet Popcorn",
                          yumiCurls: "Yumi Corn Curls",
                          yumiSticks: "Yumi Cornsticks Polybag"
                        };
                        return (
                          <div key={key} className="brand-section" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <div className="brand-title" style={{ fontWeight: '600', marginBottom: '10px', fontSize: '14px' }}>
                              {brandNames[key as keyof typeof brandNames]} ({variants.length})
                            </div>
                            <div className="brand-flavors" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                              {variants.map((variant: any, i: number) => (
                                <div key={i} className="flavor-item" style={{ flex: '0 0 calc(50% - 5px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className="flavor-image" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                    {variant.image_url ? (
                                      <img
                                        src={variant.image_url}
                                        alt={variant.name}
                                        crossOrigin="anonymous"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                      />
                                    ) : (
                                      <div className="flavor-dot" style={{ width: '100%', height: '100%', background: '#dee2e6', borderRadius: '4px' }}></div>
                                    )}
                                  </div>
                                  <div className="flavor-name" style={{ fontSize: '12px', flex: 1 }}>{variant.name}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pricing Display - Matching Manual Selection Style */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Box Price:</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#9b59b6' }}>
                      {currencyConfig.currency} {randomResult.pricePerBox}
                    </span>
                  </div>
                  {(() => {
                    const tiers = [
                      { min: 1, max: 49, discountPercent: 0 },
                      { min: 50, max: 99, discountPercent: 5 },
                      { min: 100, max: 199, discountPercent: 10 },
                      { min: 200, max: 499, discountPercent: 15 },
                      { min: 500, max: Infinity, discountPercent: 20 },
                    ];
                    const tier = tiers.find(t => randomResult.pax >= t.min && randomResult.pax <= t.max);
                    const discountPercent = tier ? tier.discountPercent : 0;

                    return discountPercent > 0 && (
                      <div style={{ fontSize: '11px', color: '#4CAF50', textAlign: 'right' }}>
                        {discountPercent}% discount applied
                      </div>
                    );
                  })()}
                  <div style={{
                    borderTop: '1px solid #dee2e6',
                    marginTop: '10px',
                    paddingTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>Total:</span>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#9b59b6' }}>
                      {currencyConfig.currency} {randomResult.total}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '6px' }}>
                    {currencyConfig.currency} {randomResult.pricePerBox} × {randomResult.pax} boxes
                  </div>
                </div>

                {/* Volume Discounts */}
                {randomResult.tierPricing && (
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Volume Discounts
                    </div>
                    <div>
                      {randomResult.tierPricing.slice(0, 5).map((tier: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '10px 15px',
                            marginBottom: '6px',
                            borderRadius: '6px',
                            background: randomResult.pax >= tier.minQuantity && randomResult.pax <= tier.maxQuantity ? '#e8f5e9' : '#f8f9fa',
                            border: randomResult.pax >= tier.minQuantity && randomResult.pax <= tier.maxQuantity ? '2px solid #4CAF50' : '1px solid #dee2e6'
                          }}
                        >
                          <span style={{ fontWeight: randomResult.pax >= tier.minQuantity && randomResult.pax <= tier.maxQuantity ? '600' : '400' }}>
                            {tier.minQuantity}{tier.maxQuantity === Infinity ? '+' : `-${tier.maxQuantity}`} boxes
                          </span>
                          <span style={{ fontWeight: randomResult.pax >= tier.minQuantity && randomResult.pax <= tier.maxQuantity ? '700' : '500', color: '#9b59b6' }}>
                            {currencyConfig.currency} {tier.pricePerUnit.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regenerate Button */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px', width: '100%' }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setRandomResult(null); handleRandomGenerate(); }}
                    disabled={randomGenerating}
                    className="generate-btn"
                    style={{
                      width: 'auto',
                      padding: '12px 32px',
                      margin: '0 auto'
                    }}
                  >
                    {randomGenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>

                {/* Download Button - Text Link Style */}
                <div className="download-sample-container" style={{ textAlign: 'center', marginTop: '15px' }}>
                  <span
                    onClick={(e) => { e.stopPropagation(); handleRandomDownload(); }}
                    style={{
                      color: '#9b59b6',
                      textDecoration: 'underline',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: randomGenerating ? 'not-allowed' : 'pointer',
                      opacity: randomGenerating ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      if (!randomGenerating) {
                        e.currentTarget.style.background = '#f3e5f5';
                        e.currentTarget.style.padding = '4px 8px';
                        e.currentTarget.style.borderRadius = '4px';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.padding = '0';
                      e.currentTarget.style.borderRadius = '0';
                    }}
                  >
                    {randomGenerating ? 'Generating PDF...' : 'Download Quotation PDF'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Mode Panel */}
        <div
          className="mode-panel manual-mode-panel"
          onClick={() => setActivePanel('manual')}
          style={{
            filter: activePanel === 'random' ? 'grayscale(100%)' : 'none',
            opacity: activePanel === 'random' ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: activePanel === 'manual' ? 'scale(1.01)' : 'scale(1)',
            border: activePanel === 'manual' ? '2px solid #9b59b6' : 'none'
          }}
        >
          <div className="mode-panel-header">
            <h3 className="mode-panel-title">Pick your own flavors</h3>
          </div>

          <div className="form-content">
            {/* Gift Box Display */}
            <div className="gift-box-display">
              {manualGiftBoxType && (
                <>
                  <div className="gift-box-image">
                    <img
                      src={manualGiftBoxType.image_url}
                      alt={manualGiftBoxType.name}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error("Gift box image failed to load:", e.currentTarget.src);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="gift-box-name">{manualGiftBoxType.name}</div>
                </>
              )}
            </div>

            {/* Inside Contains */}
            <div className="section-title-manual">Inside Contains ({getTotalSelected()})</div>
            <div className="brand-categories-manual">
                    <div
                      className="brand-section-manual"
                      onClick={(e) => { e.stopPropagation(); handleBrandClick('bronys'); }}
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
                      onClick={(e) => { e.stopPropagation(); handleBrandClick('kettleGourmet'); }}
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
                      onClick={(e) => { e.stopPropagation(); handleBrandClick('yumiSticks'); }}
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

            {/* Quantity & Total Section */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>QUANTITY & TOTAL</h3>

              {/* Quantity Input */}
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="manual-pax" style={{ fontSize: '13px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>How many people need gift boxes?</label>
                <input
                  id="manual-pax"
                  type="text"
                  value={manualPax}
                  onChange={(e) => {
                    setManualPax(e.target.value);
                    setManualPaxError('');
                  }}
                  placeholder="Enter number"
                  className="quantity-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: manualPaxError ? '3px solid #dc3545' : '3px solid #e9ecef',
                    backgroundColor: manualPaxError ? '#fff5f5' : 'white'
                  }}
                />
                {manualPaxError && (
                  <div style={{
                    color: '#dc3545',
                    fontSize: '11px',
                    marginTop: '4px',
                    fontWeight: '400'
                  }}>
                    {manualPaxError}
                  </div>
                )}
              </div>

              {/* Pricing Summary Box */}
              {(() => {
                const { pricePerBox, total, paxNum, discountPercent } = calculateManualTotal();
                return (
                  <div style={{
                    background: '#f8f9fa',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#666' }}>Box Price:</span>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#9b59b6' }}>
                        {currencyConfig.currency} {pricePerBox.toFixed(2)}
                      </span>
                    </div>
                    {discountPercent > 0 && (
                      <div style={{ fontSize: '11px', color: '#4CAF50', textAlign: 'right' }}>
                        {discountPercent}% discount applied
                      </div>
                    )}
                    <div style={{
                      borderTop: '1px solid #dee2e6',
                      marginTop: '10px',
                      paddingTop: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>Total:</span>
                      <span style={{ fontSize: '24px', fontWeight: '700', color: '#9b59b6' }}>
                        {currencyConfig.currency} {total.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '6px' }}>
                      {currencyConfig.currency} {pricePerBox.toFixed(2)} × {paxNum} boxes
                    </div>
                  </div>
                );
              })()}

              {/* Special Instructions */}
              <div style={{ marginBottom: '0' }}>
                <label htmlFor="manual-instructions" style={{ fontSize: '13px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Special Instructions (Optional)</label>
                <textarea
                  id="manual-instructions"
                  value={manualInstructions}
                  onChange={(e) => setManualInstructions(e.target.value)}
                  placeholder="Any specific requirements, preferences, or notes..."
                  className="instructions-textarea-manual"
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Volume Discounts */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>VOLUME DISCOUNT TIERS</h3>

              <div className="discount-tiers">
                {(() => {
                  const { paxNum } = calculateManualTotal();
                  return [
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
                  });
                })()}
              </div>
            </div>

            {/* Download Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleManualDownload(); }}
                disabled={manualGenerating || !getSelectionComplete() || !manualPax || parseInt(manualPax) === 0}
                className="download-pdf-btn"
                style={{
                  width: 'auto',
                  padding: '10px 24px',
                  fontSize: '14px',
                  display: 'block',
                  margin: '20px auto 0',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                {manualGenerating ? 'Generating PDF...' : 'Download Quotation PDF'}
              </button>

              {/* Helper text when button is disabled */}
              {(manualGenerating || !getSelectionComplete() || !manualPax || parseInt(manualPax) === 0) && (
                <div style={{
                  fontSize: '11px',
                  color: '#999',
                  marginTop: '8px',
                  marginBottom: '32px',
                  fontStyle: 'italic'
                }}>
                  {!getSelectionComplete()
                    ? 'Please select all required products to continue'
                    : (!manualPax || parseInt(manualPax) === 0)
                    ? 'Please enter quantity above to continue'
                    : 'Generating your PDF...'}
                </div>
              )}
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
                onSelectionChange={(variants) => handleManualSelectionChange(currentBrand, variants)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2BOrderSideBySide;
