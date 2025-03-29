import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { getCompanyProductExportDetails, transformToSelectableFormat } from '../../../services/useProductExportDetails';
import { ProductExportSelection } from '../../../shared/types/ProductExport';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { generateQuotationExportPDF } from '../services/useQuotationPDF';
import { QuotationExportPDFData } from '../types/QuotationPDF';

interface QuotationExportProps {
    session: Session;
}

export const QuotationExport: React.FC<QuotationExportProps> = ({ session }) => {
    const [selections, setSelections] = useState<ProductExportSelection[]>([]);
    const [editingCell, setEditingCell] = useState<{ id: number, field: string } | null>(null);
    const { companyInfo, isLoading, error } = useUserAndCompanyData(session.user.id);
    const [collapsedRows, setCollapsedRows] = useState<Set<number>>(new Set());
    const [customerCompanyName, setCustomerCompanyName] = useState<string>('');
    const [salesAccountManager, setSalesAccountManager] = useState<string>('');
    const [showFOBPricePerUnit, setShowFOBPricePerUnit] = useState<boolean>(true);
    const [showCartonBarcode, setShowCartonBarcode] = useState<boolean>(false);
    const currentDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!companyInfo?.id) return;
            
            try {
                const data = await getCompanyProductExportDetails(companyInfo.id);
                console.log('Raw export details:', data);
                const transformedData = transformToSelectableFormat(data);
                console.log('Transformed export details:', transformedData);
                setSelections(transformedData);
                setCollapsedRows(new Set(transformedData.map(product => product.product_id)));
            } catch (error) {
                console.error('Failed to fetch export details:', error);
            }
        };

        fetchData();
    }, [companyInfo?.id]);

    if (isLoading) {
        return <div className="text-center py-4">Loading...</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">Error loading data</div>;
    }

    const handleProductSelect = (productId: number, isSelected: boolean) => {
        setSelections(prev => prev.map(product => {
            if (product.product_id === productId) {
                return {
                    ...product,
                    isSelected,
                    variants: product.variants.map(variant => ({
                        ...variant,
                        isSelected
                    }))
                };
            }
            return product;
        }));
    };

    const handleVariantSelect = (productId: number, variantId: number, isSelected: boolean) => {
        setSelections(prev => prev.map(product => {
            if (product.product_id === productId) {
                const updatedVariants = product.variants.map(variant => 
                    variant.variant_id === variantId 
                        ? { ...variant, isSelected }
                        : variant
                );
                // Product is unselected only if all variants are unselected
                const allVariantsUnselected = updatedVariants.every(v => !v.isSelected);
                return {
                    ...product,
                    isSelected: !allVariantsUnselected,
                    variants: updatedVariants
                };
            }
            return product;
        }));
    };

    const handleCellEdit = (productId: number, field: string, value: string) => {
        setSelections(prev => prev.map(product => {
            if (product.product_id === productId) {
                return {
                    ...product,
                    variants: product.variants.map((variant, index) => 
                        index === 0 ? { ...variant, [field]: value } : variant
                    )
                };
            }
            return product;
        }));
        setEditingCell(null);
    };

    const handleGeneratePDF = async () => {
        if (!customerCompanyName || !salesAccountManager || !selections.some(product => product.isSelected)) {
            console.error('Cannot generate PDF: Missing required information or no products selected.');
            return;
        }

        setIsGeneratingPDF(true);

        const selectedProducts = selections
            .filter(product => product.isSelected)
            .map(product => ({
                product_name: product.product_name,
                product_id: product.product_id,
                container_size: product.variants[0]?.container_size,
                cartons_per_container: product.variants[0]?.cartons_per_container,
                pack_size_per_carton: product.variants[0]?.pack_size_per_carton,
                fob_price_per_carton: product.variants[0]?.fob_price_per_carton,
                recommended_retail_price_usd: product.variants[0]?.recommended_retail_price_usd,
                variants: product.variants
                    .filter(variant => variant.isSelected)
                    .map(variant => ({
                        description: variant.description,
                        variant_id: variant.variant_id
                    }))
            }))
            .filter(product => product.variants.length > 0);

        const pdfData: QuotationExportPDFData = {
            selectedProducts,
            companyInfo: {
                name: companyInfo?.name || '',
                address: companyInfo?.address || '',
                website_url: companyInfo?.website_url || '',
                phone: companyInfo?.phone || '',
                logo_url: companyInfo?.logo_url || '',
                id: companyInfo?.id || '',
                created_at: companyInfo?.created_at || '',
                completed_sign_up_sequence: companyInfo?.completed_sign_up_sequence || false,
                company_brand_color: companyInfo?.company_brand_color || null
            },
            customerCompanyName,
            currentDate,
            sales_account_manager: salesAccountManager,
            tableSettings: {
                showFOBPricePerUnit: showFOBPricePerUnit,
                showCartonBarcode: showCartonBarcode
            }
        };

        // Log the payload being sent to the backend
        console.log('Quotation Export Payload:', JSON.stringify(pdfData, null, 2));

        try {
            const pdfBlob = await generateQuotationExportPDF(pdfData as QuotationExportPDFData);
            console.log("PDF generated successfully");

            const blobUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `export-quotation-${customerCompanyName}-${currentDate}.pdf`;
            link.click();

            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGeneratingPDF(false);
        }
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

    // Function to toggle FOB Price/Unit visibility
    const toggleFOBPricePerUnit = () => {
        setShowFOBPricePerUnit(prev => !prev);
    };

    // Function to toggle Carton Barcode visibility
    const toggleCartonBarcode = () => {
        setShowCartonBarcode(prev => !prev);
    };

    // Get the columns to display based on the toggle state
    const getTableColumns = () => {
        const baseColumns = [
            'container_size',
            'cartons_per_container',
            'pack_size_per_carton',
            'fob_price_per_carton',
            'recommended_retail_price_usd'
        ];
        
        if (showFOBPricePerUnit) {
            // Insert 'fob_price_per_unit' after 'fob_price_per_carton'
            const index = baseColumns.indexOf('fob_price_per_carton');
            if (index !== -1) {
                baseColumns.splice(index + 1, 0, 'fob_price_per_unit');
            }
        }
        
        return baseColumns;
    };

    return (
        <div className="quotation-export-container p-4">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Customer Company Name"
                    value={customerCompanyName}
                    onChange={(e) => setCustomerCompanyName(e.target.value)}
                    className="border p-2 w-full mb-2"
                />
                <input
                    type="text"
                    placeholder="Sales Account Manager"
                    value={salesAccountManager}
                    onChange={(e) => setSalesAccountManager(e.target.value)}
                    className="border p-2 w-full"
                />
                <div className="mt-2">Updated At: {currentDate}</div>
            </div>
            
            <div className="flex items-center mb-4 space-x-4">
                <label className="inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={showFOBPricePerUnit}
                        onChange={toggleFOBPricePerUnit}
                        className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-900">Show FOB Price/Unit</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={showCartonBarcode}
                        onChange={toggleCartonBarcode}
                        className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-900">Show Carton Barcode</span>
                </label>
            </div>
            
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-orange-100">
                        <th className="border border-gray-300 p-2" style={{ backgroundColor: "#FF9933" }}>Select</th>
                        <th className="border border-gray-300 p-2" style={{ backgroundColor: "#FF9933" }}>Product Name</th>
                        <th className="border border-gray-300 p-2" style={{ backgroundColor: "#FF9933" }}>Container Size</th>
                        <th className="border border-gray-300 p-2" style={{ backgroundColor: "#FF9933" }}>Cartons/Container</th>
                        <th className="border border-gray-300 p-2" style={{ backgroundColor: "#FF9933" }}>Pack Size/Carton</th>
                        <th className="border border-gray-300 p-2" style={{ backgroundColor: "#FF9933" }}>FOB Price/Carton</th>
                        {showFOBPricePerUnit && (
                            <th className="border border-gray-300 p-2" style={{ backgroundColor: "#FF9933" }}>FOB Price/Unit</th>
                        )}
                        <th className="border border-gray-300 p-2" style={{ backgroundColor: "#FF9933" }}>RRP (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    {selections.map((product) => (
                        <React.Fragment key={product.product_id}>
                            <tr className="border-b border-gray-300">
                                <td className="border border-gray-300 p-2">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => toggleCollapse(product.product_id)}
                                            className="w-4 h-4 flex items-center justify-center"
                                        >
                                            {collapsedRows.has(product.product_id) ? '+' : '-'}
                                        </button>
                                        <input
                                            title="Select Product"
                                            type="checkbox"
                                            checked={product.isSelected}
                                            onChange={(e) => handleProductSelect(product.product_id, e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                </td>
                                <td className="border border-gray-300 p-2 font-medium">
                                    {product.product_name}
                                </td>
                                {getTableColumns().map((field) => (
                                    <td 
                                        key={field}
                                        className="border border-gray-300 p-2"
                                        onDoubleClick={() => field !== 'fob_price_per_unit' && setEditingCell({ id: product.product_id, field })}
                                    >
                                        {editingCell?.id === product.product_id && editingCell.field === field ? (
                                            <input
                                                title="Edit Field"
                                                type="text"
                                                defaultValue={String(product.variants[0]?.[field as keyof typeof product.variants[0]])}
                                                onBlur={(e) => handleCellEdit(product.product_id, field, e.target.value)}
                                                autoFocus
                                                className="w-full"
                                            />
                                        ) : (
                                            field === 'fob_price_per_unit' 
                                                ? `$${(Number(product.variants[0]?.fob_price_per_carton) / Number(product.variants[0]?.pack_size_per_carton)).toFixed(2)}`
                                                : ['fob_price_per_carton', 'recommended_retail_price_usd'].includes(field)
                                                    ? `$${Number(product.variants[0]?.[field as keyof typeof product.variants[0]]).toFixed(2)}`
                                                    : product.variants[0]?.[field as keyof typeof product.variants[0]]
                                        )}
                                    </td>
                                ))}
                            </tr>
                            {!collapsedRows.has(product.product_id) && (
                                <tr>
                                    <td colSpan={showFOBPricePerUnit ? 8 : 7} className="border border-gray-300 p-2 bg-gray-50">
                                        <div className="ml-8">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-orange-100 text-sm">
                                                        <th className="border border-gray-200 p-1">Select</th>
                                                        <th className="border border-gray-200 p-1">Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {product.variants.map((variant) => (
                                                        <tr key={variant.variant_id} className="text-sm">
                                                            <td className="border border-gray-200 p-1">
                                                                <input
                                                                    title="Select Variant"
                                                                    type="checkbox"
                                                                    checked={variant.isSelected}
                                                                    onChange={(e) => handleVariantSelect(
                                                                        product.product_id,
                                                                        variant.variant_id,
                                                                        e.target.checked
                                                                    )}
                                                                    className="h-4 w-4"
                                                                />
                                                            </td>
                                                            <td className="border border-gray-200 p-1">{variant.description}</td>
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
            
            {selections.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                    No products available for export
                </div>
            )}
            
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={handleGeneratePDF}
                    disabled={
                        isGeneratingPDF || 
                        !customerCompanyName || 
                        !salesAccountManager || 
                        !selections.some(product => product.isSelected)
                    }
                    className={`font-bold py-2 px-4 rounded ${
                        isGeneratingPDF
                            ? 'bg-blue-300 text-white cursor-not-allowed'
                            : customerCompanyName && 
                              salesAccountManager && 
                              selections.some(product => product.isSelected)
                                ? 'bg-blue-500 hover:bg-blue-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isGeneratingPDF ? (
                        <span className="flex items-center">
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            Generating...
                        </span>
                    ) : (
                        'Generate PDF'
                    )}
                </button>
            </div>
        </div>
    );
};
