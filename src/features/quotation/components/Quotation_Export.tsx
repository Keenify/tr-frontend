import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getCompanyProductExportDetails, transformToSelectableFormat } from '../../../services/useProductExportDetails';
import { ProductExportSelection } from '../../../shared/types/ProductExport';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { generateQuotationExportPDF } from '../services/useQuotationPDF';
import { QuotationExportPDFData } from '../types/QuotationPDF';
import { ExportPriceTierModal } from './ExportPriceTierModal';
import { TierEditModal } from './TierEditModal';
import { getProductExportPriceTiers, ProductExportPriceTier } from '../services/useProductsExportPriceTier';
import { getProductVariants } from '../../../services/useProductVariants';
import { ProductVariant } from '../../../shared/types/Product';

interface QuotationExportProps {
    session: Session;
}

export const QuotationExport: React.FC<QuotationExportProps> = ({ session }) => {
    // --- Base State ---
    const [selections, setSelections] = useState<ProductExportSelection[]>([]);
    const [editingCell, setEditingCell] = useState<{ id: number, field: string } | null>(null);
    const { companyInfo, isLoading: isLoadingCompany, error: companyError } = useUserAndCompanyData(session.user.id); // Renamed isLoading
    const [collapsedRows, setCollapsedRows] = useState<Set<number>>(new Set());
    const [customerCompanyName, setCustomerCompanyName] = useState<string>(() => {
        return localStorage.getItem('export_customer_name') || '';
    });
    const [salesAccountManager, setSalesAccountManager] = useState<string>(() => {
        return localStorage.getItem('export_sales_manager') || '';
    });
    const [showFOBPricePerUnit, setShowFOBPricePerUnit] = useState<boolean>(true);
    const [showCartonBarcode, setShowCartonBarcode] = useState<boolean>(false);
    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'SGD'>('USD');
    const currentDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
    const [isPriceTierModalOpen, setIsPriceTierModalOpen] = useState<boolean>(false);
    const [selectedProductIdForModal, setSelectedProductIdForModal] = useState<number | null>(null);
    const [selectedProductNameForModal, setSelectedProductNameForModal] = useState<string | null>(null);
    const [selectAllStatus, setSelectAllStatus] = useState<'none' | 'some' | 'all'>('none'); // State for Select All checkbox
    const [isTierEditModalOpen, setIsTierEditModalOpen] = useState<boolean>(false);

    // --- UI Toggles State ---
    const [showProductBarcode, setShowProductBarcode] = useState<boolean>(true);
    const [showShelfLife, setShowShelfLife] = useState<boolean>(true);
    const [showHsCode, setShowHsCode] = useState<boolean>(true);
    const [showCartonDimensions, setShowCartonDimensions] = useState<boolean>(true);
    const [showNetWeight, setShowNetWeight] = useState<boolean>(true);
    const [showGrossWeight, setShowGrossWeight] = useState<boolean>(true);
    const [showCountryOfOrigin, setShowCountryOfOrigin] = useState<boolean>(true);

    // --- Input Validation State & Refs ---
    const [customerNameError, setCustomerNameError] = useState<boolean>(false);
    const [salesManagerError, setSalesManagerError] = useState<boolean>(false);
    const customerNameRef = useRef<HTMLInputElement>(null);
    const salesManagerRef = useRef<HTMLInputElement>(null);

    // --- Global Price Tier State & Logic ---
    const [allApplicableTiers, setAllApplicableTiers] = useState<Map<number, ProductExportPriceTier[]>>(new Map());
    const [uniqueTierNames, setUniqueTierNames] = useState<string[]>([]);
    const [selectedGlobalTierName, setSelectedGlobalTierName] = useState<string>('');
    const [isFetchingTiers, setIsFetchingTiers] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null); // Consolidated error state

    const getDefaultPrices = useCallback((product: ProductExportSelection) => {
        const defaultVariant = product.variants.length > 0 ? product.variants[0] : null;
        const defaultFobCarton = defaultVariant ? defaultVariant.fob_price_per_carton : 0;
        const defaultFobUnit = defaultVariant ? defaultVariant.fob_price_per_unit : 0;
        const defaultRrp = defaultVariant ? parseFloat(defaultVariant.recommended_retail_price_usd ?? '0') : 0;
        return { defaultFobCarton, defaultFobUnit, defaultRrp };
    }, []);

    const fetchAndSetTiers = useCallback(async (products: ProductExportSelection[]) => {
        if (products.length === 0) {
            setAllApplicableTiers(new Map()); setUniqueTierNames([]); return;
        }
        setIsFetchingTiers(true); setFetchError(null); // Reset error on new fetch
        try {
            const tierPromises = products.map(p =>
                getProductExportPriceTiers(p.product_id) // Assumes this function exists and is imported
                    .then(tiers => ({ productId: p.product_id, tiers }))
                    .catch(err => {
                        // Log specific error but don't block UI, handle gracefully
                        console.error(`Error fetching tiers for product ${p.product_id}:`, err);
                        // Set an indicator or placeholder if needed, here just return empty
                        return { productId: p.product_id, tiers: [] };
                    })
            );
            const tierResults = await Promise.all(tierPromises);
            const tiersMap = new Map<number, ProductExportPriceTier[]>();
            const nameSet = new Set<string>();
            tierResults.forEach(result => {
                if (result) {
                    tiersMap.set(result.productId, result.tiers);
                    result.tiers.forEach(tier => { if (tier.is_active) nameSet.add(tier.tier_name); });
                }
            });
            setAllApplicableTiers(tiersMap);
            setUniqueTierNames(Array.from(nameSet).sort());
        } catch (err) {
             console.error('General error during tier fetching process:', err);
             setFetchError('Failed to load price tier information.'); // Set general error
             setAllApplicableTiers(new Map()); setUniqueTierNames([]);
        } finally {
             setIsFetchingTiers(false);
        }
    }, []); // Ensure dependencies are correct (should be empty if getProduct... is stable)

    // Fetch initial data and tiers
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!companyInfo?.id) return;
            setFetchError(null); // Clear previous errors
            try {
                // 1. Fetch base export details
                const exportDetailsData = await getCompanyProductExportDetails(companyInfo.id);

                // 2. Fetch detailed variant info for COGS
                const productIds = exportDetailsData.map(p => p.product_id);
                const variantPromises = productIds.map(id =>
                    getProductVariants(id.toString())
                        .catch(err => {
                            console.error(`Failed to fetch variants for product ${id}:`, err);
                            return []; // Return empty array on error for this product
                        })
                );
                const variantsResults = await Promise.all(variantPromises);

                // Create a map for easy lookup: Map<productId, ProductVariant[]>
                const variantsMap = new Map<number, ProductVariant[]>();
                productIds.forEach((id, index) => {
                    variantsMap.set(id, variantsResults[index]);
                });

                // 3. Transform data, passing in the detailed variants map
                const transformedData = transformToSelectableFormat(exportDetailsData, variantsMap);
                setSelections(transformedData);
                setCollapsedRows(new Set(transformedData.map(p => p.product_id)));

                // 4. Fetch tiers only after successfully getting products
                await fetchAndSetTiers(transformedData);

            } catch (err: unknown) {
                console.error('Failed to fetch initial export details or variants:', err);
                const errorMessage = (err instanceof Error) ? err.message : 'Failed to load product export details.';
                setFetchError(errorMessage);
                setSelections([]); // Clear selections on error
            }
        };
        if (companyInfo?.id) { // Only run if companyInfo is available
             fetchInitialData();
        }
     }, [companyInfo?.id, fetchAndSetTiers]); // Keep dependencies

    // Apply global tier pricing changes
    useEffect(() => {
        setSelections(currentSelections =>
            currentSelections.map(product => {
                // Always get defaults first
                const { defaultFobCarton, defaultFobUnit, defaultRrp } = getDefaultPrices(product);
                const defaultPackSize = product.variants.length > 0 ? product.variants[0].pack_size_per_carton : 1;

                // Initialize applied values with defaults
                let appliedFobCarton: number | null = defaultFobCarton;
                let appliedFobUnit: number | null = defaultFobUnit;
                let appliedRrp: number | null = defaultRrp;
                let appliedPackSize: number | null = defaultPackSize;
                let hasMatchedTier = false; // Initialize flag for this product/iteration

                if (selectedGlobalTierName) {
                    // If a global tier is selected, try to find it
                    const productTiers = allApplicableTiers.get(product.product_id) || [];
                    const matchedTier = productTiers.find(tier => tier.tier_name === selectedGlobalTierName && tier.is_active);

                    if (matchedTier) {
                        // Tier found: Apply its values and set flag
                        hasMatchedTier = true;
                        appliedFobCarton = matchedTier.fob_price_per_carton;
                        appliedFobUnit = matchedTier.fob_price_per_unit;
                        appliedRrp = matchedTier.recommended_rrp;
                        // Use tier pack size if valid, otherwise fall back to default
                        appliedPackSize = (matchedTier.pack_per_carton !== null && matchedTier.pack_per_carton > 0) 
                                            ? matchedTier.pack_per_carton 
                                            : defaultPackSize; // Fallback to default pack size
                    } else {
                        // Tier selected globally, but NOT found for this product: Apply zeros
                        hasMatchedTier = false; // Ensure flag is false
                        appliedFobCarton = 0;
                        appliedFobUnit = 0;
                        appliedRrp = 0;
                        appliedPackSize = 0; 
                    }
                } 
                // If no global tier is selected, defaults apply and hasMatchedTier remains false.

                // Check if any applied value changed OR the tier flag changed
                if (product.applied_fob_price_per_carton === appliedFobCarton &&
                    product.applied_fob_price_per_unit === appliedFobUnit &&
                    product.applied_recommended_rrp === appliedRrp &&
                    product.applied_pack_per_carton === appliedPackSize &&
                    product.has_selected_tier === hasMatchedTier) { // Check flag too
                    return product; // No change needed
                }
                
                // Return updated product object including the flag
                return {
                    ...product,
                    applied_fob_price_per_carton: appliedFobCarton,
                    applied_fob_price_per_unit: appliedFobUnit,
                    applied_recommended_rrp: appliedRrp,
                    applied_pack_per_carton: appliedPackSize,
                    has_selected_tier: hasMatchedTier // Set the flag on the product state
                };
            })
        );
     }, [selectedGlobalTierName, allApplicableTiers, getDefaultPrices]); 

    // --- Event Handlers ---
    const handleGlobalTierChange = (event: React.ChangeEvent<HTMLSelectElement>) => { setSelectedGlobalTierName(event.target.value); };
    const handleTiersUpdated = useCallback(() => { fetchAndSetTiers(selections); }, [fetchAndSetTiers, selections]);
    const handleProductSelect = (productId: number, isSelected: boolean) => { setSelections(prev => prev.map(p => p.product_id === productId ? { ...p, isSelected, variants: p.variants.map(v => ({ ...v, isSelected })) } : p)); };
    const handleVariantSelect = (productId: number, variantId: number, isSelected: boolean) => { setSelections(prev => prev.map(p => { if (p.product_id === productId) { const updatedV = p.variants.map(v => v.variant_id === variantId ? { ...v, isSelected } : v); const allVUnselected = updatedV.every(v => !v.isSelected); return { ...p, isSelected: !allVUnselected, variants: updatedV }; } return p; })); };
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setSelections(prev => 
            prev.map(p => ({
                ...p,
                isSelected: isChecked,
                variants: p.variants.map(v => ({ ...v, isSelected: isChecked }))
            }))
        );
    };
    const handleCellEdit = (productId: number, field: string, value: string) => {
        setSelections(prev => prev.map(p => {
            // Prevent editing price/pack fields directly in main table
            if (p.product_id === productId && !['fob_price_per_carton', 'fob_price_per_unit', 'recommended_retail_price_usd', 'pack_size_per_carton'].includes(field)) {
                
                // Update the first variant in the variants array (for UI consistency if needed)
                const updatedVariants = p.variants.map((v, i) => i === 0 ? { ...v, [field]: value } : v);
                
                // *** ALSO Update the firstVariantDetails object ***
                let updatedFirstVariantDetails = p.firstVariantDetails;
                if (updatedFirstVariantDetails) {
                    // Create a new object to avoid direct state mutation
                    updatedFirstVariantDetails = {
                        ...updatedFirstVariantDetails,
                        [field]: value // Update the specific field
                        // Note: Consider type conversion if necessary (e.g., for cartons_per_container)
                        // [field]: field === 'cartons_per_container' ? parseInt(value, 10) || 0 : value 
                    };
                }

                // Recalculate defaults based on potentially edited underlying variant data (e.g., container size)
                const { defaultFobCarton, defaultFobUnit, defaultRrp } = getDefaultPrices({ ...p, variants: updatedVariants });
                const defaultPackSize = updatedVariants.length > 0 ? updatedVariants[0].pack_size_per_carton : 1;

                // Update applied only if default pricing is active (no global tier selected)
                const shouldUpdateApplied = !selectedGlobalTierName;
                return {
                    ...p,
                    variants: updatedVariants, 
                    firstVariantDetails: updatedFirstVariantDetails, // Assign the updated details
                    applied_fob_price_per_carton: shouldUpdateApplied ? defaultFobCarton : p.applied_fob_price_per_carton, 
                    applied_fob_price_per_unit: shouldUpdateApplied ? defaultFobUnit : p.applied_fob_price_per_unit, 
                    applied_recommended_rrp: shouldUpdateApplied ? defaultRrp : p.applied_recommended_rrp,
                    applied_pack_per_carton: shouldUpdateApplied ? defaultPackSize : p.applied_pack_per_carton
                };
            } 
            return p;
        }));
        setEditingCell(null);
    };
    const handleCustomerNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        localStorage.setItem('export_customer_name', value);
    };
    const handleSalesManagerBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        localStorage.setItem('export_sales_manager', value);
    };
    const handleGeneratePDF = async () => {
        // Clear the cache
        localStorage.removeItem('export_customer_name');
        localStorage.removeItem('export_sales_manager');

        // 1. Check if at least one product is selected
        if (!selections.some(p => p.isSelected)) {
            alert("Please select at least one product before generating the PDF.");
            return;
        }

        // 2. Reset errors
        setCustomerNameError(false);
        setSalesManagerError(false);

        // 3. Validate inputs
        let hasError = false;
        if (!customerCompanyName.trim()) {
            setCustomerNameError(true);
            customerNameRef.current?.focus();
            hasError = true;
        }
        if (!salesAccountManager.trim()) {
            setSalesManagerError(true);
            if (!hasError) { // Only focus if customer name is okay
                salesManagerRef.current?.focus();
            }
            hasError = true;
        }

        // 4. Stop if there are errors
        if (hasError) {
            return;
        }

        // Proceed with PDF generation if checks pass
        setIsGeneratingPDF(true);
        const selectedProducts = selections
            .filter(p => p.isSelected)
            .map(p => {
                 const firstVariantDetails = p.firstVariantDetails; 
                 return {
                    product_name: p.product_name,
                    product_id: p.product_id,
                    // Use applied values where applicable
                    pack_size_per_carton: p.applied_pack_per_carton ?? 0,
                    fob_price_per_carton: p.applied_fob_price_per_carton ?? 0,
                    fob_price_per_unit: showFOBPricePerUnit ? (p.applied_fob_price_per_unit ?? 0) : undefined,
                    recommended_retail_price_usd: p.applied_recommended_rrp ?? 0,
                    // Get other details from the preserved first variant details, providing defaults
                    container_size: firstVariantDetails?.container_size ?? '', // Default to empty string
                    cartons_per_container: firstVariantDetails?.cartons_per_container ?? 0, // Default to 0
                    product_barcode: firstVariantDetails?.product_barcode ?? firstVariantDetails?.barcode ?? null,
                    shelf_life: firstVariantDetails?.shelf_life ?? '', // Default to empty string
                    hs_code: firstVariantDetails?.hs_code ?? '', // Default to empty string
                    carton_width: firstVariantDetails?.carton_width ?? '', // Default to empty string
                    carton_length: firstVariantDetails?.carton_length ?? '', // Default to empty string
                    carton_height: firstVariantDetails?.carton_height ?? '', // Default to empty string
                    net_weight: firstVariantDetails?.net_weight ?? '', // Default to empty string
                    gross_weight: firstVariantDetails?.gross_weight ?? '', // Default to empty string
                    country_of_origin: firstVariantDetails?.country_of_origin ?? '', // Default to empty string
                    // Map selected variants as before
                    variants: p.variants.filter(v => v.isSelected).map(v => ({
                        description: v.description,
                        variant_id: v.variant_id
                    }))
                };
            })
            .filter(p => p.variants.length > 0);

        const pdfData: QuotationExportPDFData = {
            selectedProducts,
            companyInfo: { name: companyInfo?.name || '', address: companyInfo?.address || '', website_url: companyInfo?.website_url || '', phone: companyInfo?.phone || '', logo_url: companyInfo?.logo_url || '', id: companyInfo?.id || '', created_at: companyInfo?.created_at || '', completed_sign_up_sequence: companyInfo?.completed_sign_up_sequence || false, company_brand_color: companyInfo?.company_brand_color || null },
            customerCompanyName, currentDate, sales_account_manager: salesAccountManager,
            tableSettings: {
                showFOBPricePerUnit,
                showCartonBarcode,
                currency: selectedCurrency,
                showProductBarcode,
                showShelfLife,
                showHsCode,
                showCartonDimensions,
                showNetWeight,
                showGrossWeight,
                showCountryOfOrigin
            }
        };
        console.log('Quotation Export Payload:', JSON.stringify(pdfData, null, 2));
        try {
            const pdfBlob = await generateQuotationExportPDF(pdfData as QuotationExportPDFData);
            const blobUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = blobUrl;
            // Format date as YYYY-MM-DD for the filename
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(now.getDate()).padStart(2, '0');
            const formattedDateForFilename = `${year}-${month}-${day}`;
            link.download = `Quotation - ${customerCompanyName} (${formattedDateForFilename}).pdf`;
            link.click();
            URL.revokeObjectURL(blobUrl);
        } catch (pdfError) { console.error("Error generating PDF:", pdfError); }
        finally { setIsGeneratingPDF(false); }
     };
    const toggleCollapse = (productId: number) => {
        setCollapsedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };
    const openPriceTierModal = (productId: number, productName: string) => { setSelectedProductIdForModal(productId); setSelectedProductNameForModal(productName); setIsPriceTierModalOpen(true); };
    const closePriceTierModal = () => { setIsPriceTierModalOpen(false); setSelectedProductIdForModal(null); setSelectedProductNameForModal(null); };
    const handleEditSelectedTier = () => {
        if (!selectedGlobalTierName) return;
        setIsTierEditModalOpen(true);
    };
    const closeTierEditModal = () => { setIsTierEditModalOpen(false); };
    const toggleFOBPricePerUnit = () => { setShowFOBPricePerUnit(prev => !prev); };
    const toggleCartonBarcode = () => { setShowCartonBarcode(prev => !prev); };
    const toggleProductBarcode = () => { setShowProductBarcode(prev => !prev); };
    const toggleShelfLife = () => { setShowShelfLife(prev => !prev); };
    const toggleHsCode = () => { setShowHsCode(prev => !prev); };
    const toggleCartonDimensions = () => { setShowCartonDimensions(prev => !prev); };
    const toggleNetWeight = () => { setShowNetWeight(prev => !prev); };
    const toggleGrossWeight = () => { setShowGrossWeight(prev => !prev); };
    const toggleCountryOfOrigin = () => { setShowCountryOfOrigin(prev => !prev); };
    const getTableColumns = () => {
         const base = ['container_size', 'cartons_per_container', 'pack_size_per_carton', 'fob_price_per_carton', 'recommended_retail_price_usd'];
        if (showFOBPricePerUnit) { const i = base.indexOf('fob_price_per_carton'); if (i !== -1) base.splice(i + 1, 0, 'fob_price_per_unit'); }
        return base;
    };

    // --- Effect for Select All Checkbox State ---
    useEffect(() => {
        if (selections.length === 0) {
            setSelectAllStatus('none');
            return;
        }
        const allSelected = selections.every(p => p.isSelected);
        const noneSelected = selections.every(p => !p.isSelected);

        if (allSelected) {
            setSelectAllStatus('all');
        } else if (noneSelected) {
            setSelectAllStatus('none');
        } else {
            setSelectAllStatus('some');
        }
    }, [selections]);

    // --- Render Logic ---
    const mainTableColumnCount = 3 + getTableColumns().length + 1;
    const variantTableColSpan = mainTableColumnCount;

    // Consolidated Loading State
     const isLoading = isLoadingCompany || (selections.length === 0 && !fetchError && !companyInfo?.id); // Adjust loading logic

    return (
        <div className="quotation-export-container p-4">
            {isLoading && <div className="text-center py-4">Loading...</div>}
            {/* Display company error or fetch error */}
            {(companyError || fetchError) && !isLoading && <div className="text-center py-4 text-red-500">Error: {companyError?.message || fetchError || 'Unknown error'}</div>}

             {/* Render content only if not initial loading and no critical errors */}
             {!isLoading && !(companyError) && ( // Render even if tier fetch fails, but show indication
                 <>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Customer Company Name"
                            value={customerCompanyName}
                            onChange={(e) => setCustomerCompanyName(e.target.value)}
                            onBlur={handleCustomerNameBlur}
                            ref={customerNameRef}
                            onFocus={() => setCustomerNameError(false)}
                            className={`border p-2 w-full mb-2 ${customerNameError ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        <input
                            type="text"
                            placeholder="Sales Account Manager"
                            value={salesAccountManager}
                            onChange={(e) => setSalesAccountManager(e.target.value)}
                            onBlur={handleSalesManagerBlur}
                            ref={salesManagerRef}
                            onFocus={() => setSalesManagerError(false)}
                            className={`border p-2 w-full ${salesManagerError ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        <div className="mt-2 text-sm text-gray-600">Updated At: {currentDate}</div>
                    </div>

                    {/* Settings Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* --- Column Display Toggles --- */}
                        <div className="border p-4 rounded-md shadow-sm">
                            <h3 className="text-lg font-semibold mb-3 border-b pb-2">PDF Column Visibility</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                <label className="inline-flex items-center cursor-pointer"> <input type="checkbox" checked={showFOBPricePerUnit} onChange={toggleFOBPricePerUnit} className="sr-only peer" /> <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show FOB Price/Unit</span> </label>
                                <label className="inline-flex items-center cursor-pointer"> <input type="checkbox" checked={showProductBarcode} onChange={toggleProductBarcode} className="sr-only peer" /> <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show Product Barcode</span> </label>
                                <label className="inline-flex items-center cursor-pointer"> <input type="checkbox" checked={showShelfLife} onChange={toggleShelfLife} className="sr-only peer" /> <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show Shelf Life</span> </label>
                                <label className="inline-flex items-center cursor-pointer"> <input type="checkbox" checked={showHsCode} onChange={toggleHsCode} className="sr-only peer" /> <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show HS Code</span> </label>
                                <label className="inline-flex items-center cursor-pointer"> <input type="checkbox" checked={showCartonDimensions} onChange={toggleCartonDimensions} className="sr-only peer" /> <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show Carton Dimensions</span> </label>
                                <label className="inline-flex items-center cursor-pointer"> <input type="checkbox" checked={showNetWeight} onChange={toggleNetWeight} className="sr-only peer" /> <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show Net Weight</span> </label>
                                <label className="inline-flex items-center cursor-pointer"> <input type="checkbox" checked={showGrossWeight} onChange={toggleGrossWeight} className="sr-only peer" /> <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show Gross Weight</span> </label>
                                <label className="inline-flex items-center cursor-pointer"> <input type="checkbox" checked={showCountryOfOrigin} onChange={toggleCountryOfOrigin} className="sr-only peer" /> <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show Country of Origin</span> </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-4">(Controls columns in the generated PDF)</p>
                        </div>

                        {/* --- Pricing & Variant Toggles --- */}
                        <div className="border p-4 rounded-md shadow-sm space-y-4">
                            <div> 
                                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Pricing Options</h3>
                                <div className="space-y-2">
                                    {/* Currency */}
                                    <div className="flex items-center"> 
                                        <label htmlFor="currency-select" className="text-sm font-medium text-gray-900 mr-2 w-20">Currency:</label>
                                        <select id="currency-select" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value as 'USD' | 'SGD')} className="border p-1 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-grow">
                                            <option value="USD">USD</option><option value="SGD">SGD</option>
                                        </select>
                                    </div>
                                    {/* Global Tier */}
                                    <div className="flex items-center"> 
                                        <label htmlFor="global-tier-select" className="text-sm font-medium text-gray-900 mr-2 w-20">Price Tier:</label>
                                        <select id="global-tier-select" value={selectedGlobalTierName} onChange={handleGlobalTierChange} disabled={isFetchingTiers || uniqueTierNames.length === 0} className="border p-1 rounded text-sm min-w-[150px] disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-grow" title="Apply a price tier">
                                            <option value="">-- Default Pricing --</option>
                                            {isFetchingTiers ? ( <option disabled>Loading...</option> ) : ( uniqueTierNames.map(name => (<option key={name} value={name}>{name}</option>)) ) || fetchError && <option disabled>Error loading tiers</option> }
                                        </select>
                                        {selectedGlobalTierName && (
                                            <button
                                                onClick={() => handleEditSelectedTier()}
                                                className="ml-2 bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                                                title={`Edit all items in ${selectedGlobalTierName} tier`}
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {uniqueTierNames.length === 0 && !isFetchingTiers && !fetchError && (
                                            <span className="ms-2 text-xs text-black italic">(No active tiers)</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Variant Table Options</h3>
                                <div className="space-y-2">
                                    {/* Use styled toggle for Variant Table Carton Barcode */} 
                                    <label className="inline-flex items-center cursor-pointer"> 
                                        <input type="checkbox" checked={showCartonBarcode} onChange={toggleCartonBarcode} className="sr-only peer" /> 
                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> 
                                        <span className="ms-3 text-sm font-medium text-black dark:text-gray-300">Show Carton Barcode</span> 
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">(Controls barcode column in the expanded variant view below)</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                         <thead>
                            <tr className="bg-orange-100 dark:bg-gray-700">
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>
                                    {/* Select All Checkbox */}
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 dark:bg-gray-600 dark:border-gray-500"
                                        aria-label="Select all products"
                                        checked={selectAllStatus === 'all'}
                                        ref={input => {
                                            if (input) {
                                                input.indeterminate = selectAllStatus === 'some';
                                            }
                                        }}
                                        onChange={handleSelectAll}
                                        disabled={selections.length === 0} // Disable if no products
                                    />
                                </th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>Product Name</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>Container Size</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>Cartons/Container</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>Pack Size/Carton</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>FOB Price/Carton</th>
                                {showFOBPricePerUnit && <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>FOB Price/Unit</th>}
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>{`RRP (${selectedCurrency})`}</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium" style={{ backgroundColor: "#FF9933" }}>Price Tiers</th>
                            </tr>
                         </thead>
                         <tbody>
                             {selections.map((product) => (
                                <React.Fragment key={product.product_id}>
                                     {/* Conditionally apply VERY light gray + lightest standard dark gray background based on tier match */}
                                     <tr className={`border-b border-gray-300 dark:border-gray-600 
                                                   ${selectedGlobalTierName && product.has_selected_tier ? 'bg-[#f8f9fa] dark:bg-gray-500' : 'dark:text-gray-300'}`}>
                                         {/* Select Cell */} 
                                         <td className="border border-gray-300 dark:border-gray-600 p-2 text-center"> <div className="flex items-center justify-center gap-2"> <button onClick={() => toggleCollapse(product.product_id)} className="w-4 h-4 flex items-center justify-center text-xs text-black" aria-label={collapsedRows.has(product.product_id) ? `Expand variants for ${product.product_name}` : `Collapse variants for ${product.product_name}`}>{collapsedRows.has(product.product_id) ? '►' : '▼'}</button> <input type="checkbox" checked={product.isSelected} onChange={(e) => handleProductSelect(product.product_id, e.target.checked)} className="h-4 w-4 dark:bg-gray-600 dark:border-gray-500" aria-label={`Select product ${product.product_name}`} /> </div> </td>
                                         {/* Product Name Cell */} 
                                         <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium text-center text-black">{product.product_name}</td>
                                         {/* Data Cells */} 
                                         {getTableColumns().map((field) => {
                                            let displayValue: string | number | undefined;
                                            // Check if the field is price-related or pack_size
                                            const isPriceField = ['fob_price_per_carton', 'fob_price_per_unit', 'recommended_retail_price_usd'].includes(field);
                                            const isPackSizeField = field === 'pack_size_per_carton';
                                            const isEditable = !isPriceField && !isPackSizeField; // Basic editable check
                                            const isTierActive = !!selectedGlobalTierName; // Check if a global tier is active
                                            const allowDoubleClick = isEditable || (isPackSizeField && !isTierActive);
                                            // Define which fields should *never* get the non-editable background override
                                            const alwaysDefaultBgFields = ['pack_size_per_carton', 'fob_price_per_carton', 'fob_price_per_unit', 'recommended_retail_price_usd'];

                                            if (field === 'fob_price_per_carton') displayValue = `$${Number(product.applied_fob_price_per_carton ?? 0).toFixed(2)}`;
                                            else if (field === 'fob_price_per_unit') displayValue = showFOBPricePerUnit ? `$${Number(product.applied_fob_price_per_unit ?? 0).toFixed(2)}` : undefined;
                                            else if (field === 'recommended_retail_price_usd') displayValue = `$${Number(product.applied_recommended_rrp ?? 0).toFixed(2)}`;
                                            else if (field === 'pack_size_per_carton') displayValue = product.applied_pack_per_carton ?? '-'; // Display applied pack size
                                            else { // Handle other fields like container_size, cartons_per_container
                                                const rawValue = product.variants[0]?.[field as keyof typeof product.variants[0]];
                                                displayValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);
                                            }

                                            if (field === 'fob_price_per_unit' && !showFOBPricePerUnit) return null;

                                            // Determine if the non-editable background should be applied
                                            const applyNonEditableBg = !allowDoubleClick && !alwaysDefaultBgFields.includes(field);

                                            return (
                                                <td 
                                                    key={field} 
                                                    // Apply dark background only if it's non-editable AND not one of the specified fields
                                                    className={`border border-gray-300 dark:border-gray-600 p-2 text-center text-sm text-black 
                                                               ${applyNonEditableBg ? 'dark:bg-gray-700' : ''}`} 
                                                    onDoubleClick={() => allowDoubleClick && setEditingCell({ id: product.product_id, field })} // Only allow edit if permitted
                                                >
                                                    {editingCell?.id === product.product_id && editingCell.field === field && allowDoubleClick ? 
                                                        <input 
                                                            type={field === 'cartons_per_container' ? 'number' : 'text'} // Use number type where appropriate
                                                            defaultValue={String(displayValue ?? '')} 
                                                            onBlur={(e) => handleCellEdit(product.product_id, field, e.target.value)} 
                                                            autoFocus 
                                                            className="w-full text-center dark:bg-gray-700 dark:text-white" 
                                                            aria-label={`Edit ${field.replace(/_/g, ' ')} for ${product.product_name}`}
                                                        /> 
                                                        : displayValue}
                                                </td>
                                            );
                                         })}
                                         {/* Manage Tiers Button Cell */} 
                                         <td className="border border-gray-300 dark:border-gray-600 p-1 text-center"><button onClick={() => openPriceTierModal(product.product_id, product.product_name)} className="bg-purple-500 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-800 text-white text-xs font-bold py-1 px-2 rounded" title={`Manage Price Tiers for ${product.product_name}`}> Manage </button></td>
                                     </tr>
                                     {!collapsedRows.has(product.product_id) && ( 
                                         <tr> 
                                             <td colSpan={variantTableColSpan} className="border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-900"> 
                                                 <div className="ml-8"> 
                                                     {/* Variant Table */} 
                                                     <table className="w-full border-collapse">
                                                         <thead>
                                                             <tr className="bg-orange-100 dark:bg-gray-700 text-sm text-black dark:text-white">
                                                                 <th className="border p-1 text-center">Select</th>
                                                                 <th className="border p-1 text-left">Description</th>
                                                                 {/* Update COGS Header Structure & Currency */}
                                                                 <th className="border p-1 text-center align-middle" style={{ backgroundColor: "#E6B3CC" }}>
                                                                     <div>COGS (SGD)</div> {/* Hardcode SGD here */}
                                                                     <div style={{ fontSize: "0.7em", color: "#666", fontStyle: "italic" }}>
                                                                         (Not in quotation)
                                                                     </div>
                                                                 </th> 
                                                                 {showCartonBarcode && <th className="border p-1 text-center">Carton Barcode</th>}
                                                             </tr>
                                                         </thead>
                                                         <tbody>
                                                             {product.variants.map(variant => (
                                                                 <tr key={variant.variant_id} className="text-sm text-black dark:text-gray-300">
                                                                     <td className="border border-gray-200 dark:border-gray-700 p-1 text-center">
                                                                         <input 
                                                                             type="checkbox" 
                                                                             checked={variant.isSelected} 
                                                                             onChange={e => handleVariantSelect(product.product_id, variant.variant_id, e.target.checked)} 
                                                                             className="h-4 w-4 dark:bg-gray-600 dark:border-gray-500 focus:ring-transparent"
                                                                             aria-label={`Select variant ${variant.description} for ${product.product_name}`} 
                                                                         />
                                                                     </td>
                                                                     <td className="border border-gray-200 dark:border-gray-700 p-1 text-left">{variant.description}</td>
                                                                     <td 
                                                                         className="border border-gray-200 dark:border-gray-700 p-1 text-center text-black" 
                                                                         style={{ backgroundColor: "#F9E6F0" }}
                                                                     >
                                                                         ${Number(variant.cost_of_goods_sold ?? 0).toFixed(2)}
                                                                     </td>
                                                                     {showCartonBarcode && <td className="border border-gray-200 dark:border-gray-700 p-1 text-center">{variant.barcode || '-'}</td>}
                                                                 </tr>
                                                             ))}
                                                         </tbody>
                                                     </table>
                                                 </div> 
                                             </td> 
                                         </tr> 
                                     )}
                                 </React.Fragment>
                             ))}
                         </tbody>
                     </table>

                    {selections.length === 0 && !isLoadingCompany && !fetchError && <div className="text-center py-4 text-black"> No products available for export </div>}

                    <div className="mt-4 flex justify-end">
                         <button
                            onClick={handleGeneratePDF}
                            disabled={isGeneratingPDF}
                            className={`font-bold py-2 px-4 rounded ${
                                isGeneratingPDF
                                ? 'bg-blue-300 text-white cursor-not-allowed opacity-50'
                                : 'bg-blue-500 hover:bg-blue-700 text-white'
                            }`}
                        >
                             {isGeneratingPDF ? <span className="flex items-center"><svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>Generating...</span> : 'Generate PDF'}
                         </button>
                     </div>
                 </>
             )}

            <ExportPriceTierModal
                isOpen={isPriceTierModalOpen}
                onClose={closePriceTierModal}
                productId={selectedProductIdForModal}
                productName={selectedProductNameForModal}
                onTiersUpdated={handleTiersUpdated}
            />

            <TierEditModal
                isOpen={isTierEditModalOpen}
                onClose={closeTierEditModal}
                selectedTierName={selectedGlobalTierName}
                allProducts={selections}
                allApplicableTiers={allApplicableTiers}
                onTiersUpdated={handleTiersUpdated}
            />
        </div>
    );
};
