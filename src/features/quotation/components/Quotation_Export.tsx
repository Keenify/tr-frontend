import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { getCompanyProductExportDetails, transformToSelectableFormat } from '../../../services/useProductExportDetails';
import { ProductExportSelection } from '../../../shared/types/ProductExport';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';

interface QuotationExportProps {
    session: Session;
}

export const QuotationExport: React.FC<QuotationExportProps> = ({ session }) => {
    const [selections, setSelections] = useState<ProductExportSelection[]>([]);
    const [editingCell, setEditingCell] = useState<{ id: number, field: string } | null>(null);
    const { companyInfo, isLoading, error } = useUserAndCompanyData(session.user.id);
    const [collapsedRows, setCollapsedRows] = useState<Set<number>>(new Set());

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

    const handleGeneratePDF = () => {
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

        console.log('Selected products for PDF with full details:', selectedProducts);
        console.log(JSON.stringify(selectedProducts, null, 1));
        // TODO: Add PDF generation logic here
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

    return (
        <div className="quotation-export-container p-4">
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-orange-100">
                        <th className="border border-gray-300 p-2">Select</th>
                        <th className="border border-gray-300 p-2">Product Name</th>
                        <th className="border border-gray-300 p-2">Container Size</th>
                        <th className="border border-gray-300 p-2">Cartons/Container</th>
                        <th className="border border-gray-300 p-2">Pack Size/Carton</th>
                        <th className="border border-gray-300 p-2">FOB Price/Carton</th>
                        <th className="border border-gray-300 p-2">FOB Price/Unit</th>
                        <th className="border border-gray-300 p-2">RRP (USD)</th>
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
                                {[
                                    'container_size',
                                    'cartons_per_container',
                                    'pack_size_per_carton',
                                    'fob_price_per_carton',
                                    'fob_price_per_unit',
                                    'recommended_retail_price_usd'
                                ].map((field) => (
                                    <td 
                                        key={field}
                                        className="border border-gray-300 p-2"
                                        onDoubleClick={() => field !== 'fob_price_per_unit' && setEditingCell({ id: product.product_id, field })}
                                    >
                                        {editingCell?.id === product.product_id && editingCell.field === field ? (
                                            <input
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
                                    <td colSpan={8} className="border border-gray-300 p-2 bg-gray-50">
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
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Generate PDF
                </button>
            </div>
        </div>
    );
};
