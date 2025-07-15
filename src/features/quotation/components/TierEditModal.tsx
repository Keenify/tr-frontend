import React, { useState } from 'react';
import { ProductExportSelection } from '../../../shared/types/ProductExport';
import { ProductExportPriceTier, updateExportPriceTier, createExportPriceTier } from '../services/useProductsExportPriceTier';

interface TierEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTierName: string;
    allProducts: ProductExportSelection[];
    allApplicableTiers: Map<number, ProductExportPriceTier[]>;
    onTiersUpdated: () => void;
}

export const TierEditModal: React.FC<TierEditModalProps> = ({
    isOpen,
    onClose,
    selectedTierName,
    allProducts,
    allApplicableTiers,
    onTiersUpdated
}) => {
    const [localTiers, setLocalTiers] = useState<Map<number, ProductExportPriceTier>>(new Map());
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            const tierMap = new Map<number, ProductExportPriceTier>();
            allProducts.forEach(product => {
                const productTiers = allApplicableTiers.get(product.product_id) || [];
                const tier = productTiers.find(t => t.tier_name === selectedTierName && t.is_active);
                if (tier) {
                    tierMap.set(product.product_id, { ...tier });
                } else {
                    // Create empty tier structure for products without the selected tier
                    tierMap.set(product.product_id, {
                        id: 0,
                        tier_name: selectedTierName,
                        fob_price_per_carton: 0,
                        fob_price_per_unit: 0,
                        recommended_rrp: 0,
                        pack_per_carton: 0,
                        is_active: true,
                        product_id: product.product_id,
                        created_at: '',
                        updated_at: ''
                    });
                }
            });
            setLocalTiers(tierMap);
        }
    }, [isOpen, allProducts, allApplicableTiers, selectedTierName]);

    const handleFieldUpdate = (productId: number, field: string, value: number) => {
        setLocalTiers(prev => {
            const newMap = new Map(prev);
            const tier = newMap.get(productId);
            if (tier) {
                const updatedTier = { ...tier, [field]: value };
                
                // Auto-calculate FOB/carton based on FOB/unit and pack size
                if (field === 'fob_price_per_unit' || field === 'pack_per_carton') {
                    const fobUnit = field === 'fob_price_per_unit' ? value : updatedTier.fob_price_per_unit;
                    const packSize = field === 'pack_per_carton' ? value : updatedTier.pack_per_carton;
                    updatedTier.fob_price_per_carton = fobUnit * packSize;
                }
                
                newMap.set(productId, updatedTier);
            }
            return newMap;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const promises = Array.from(localTiers.entries()).map(async ([, tier]) => {
                // Only save if the tier has actual values (not all zeros)
                if (tier.fob_price_per_unit > 0 || tier.pack_per_carton > 0 || tier.recommended_rrp > 0) {
                    if (tier.id > 0) {
                        // Update existing tier
                        return updateExportPriceTier(
                            tier.id,
                            tier.tier_name,
                            tier.fob_price_per_carton,
                            tier.fob_price_per_unit,
                            tier.recommended_rrp,
                            tier.pack_per_carton,
                            tier.is_active
                        );
                    } else {
                        // Create new tier
                        return createExportPriceTier(
                            tier.tier_name,
                            tier.fob_price_per_carton,
                            tier.fob_price_per_unit,
                            tier.recommended_rrp,
                            tier.pack_per_carton,
                            tier.is_active,
                            tier.product_id
                        );
                    }
                }
                return null;
            });
            
            await Promise.all(promises);
            onTiersUpdated();
            onClose();
        } catch (error) {
            console.error('Error saving tier changes:', error);
            alert('Failed to save tier changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Edit "{selectedTierName}" Price Tier
                    </h2>
                    <button
                        title="Close"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700">
                                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                                        Product
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium text-gray-900 dark:text-white">
                                        FOB/Unit
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium text-gray-900 dark:text-white">
                                        Pack/Carton
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600">
                                        FOB/Carton (Auto)
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium text-gray-900 dark:text-white">
                                        RRP
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {allProducts.map((product) => {
                                    const tier = localTiers.get(product.product_id);
                                    if (!tier) return null;

                                    const hasExistingTier = tier.id > 0;
                                    const displayFobUnit = tier.fob_price_per_unit > 0 ? tier.fob_price_per_unit : '';
                                    const displayPackCarton = tier.pack_per_carton > 0 ? tier.pack_per_carton : '';
                                    const displayRrp = tier.recommended_rrp > 0 ? tier.recommended_rrp : '';
                                    const displayFobCarton = tier.fob_price_per_carton > 0 ? `$${tier.fob_price_per_carton.toFixed(2)}` : '-';

                                    return (
                                        <tr key={product.product_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${hasExistingTier ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-white font-medium">
                                                {product.product_name}
                                                {hasExistingTier && (
                                                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full">
                                                        Has Tier
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={displayFobUnit}
                                                    placeholder="-"
                                                    onChange={(e) => handleFieldUpdate(product.product_id, 'fob_price_per_unit', parseFloat(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center dark:bg-gray-800 dark:text-white"
                                                />
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    value={displayPackCarton}
                                                    placeholder="-"
                                                    onChange={(e) => handleFieldUpdate(product.product_id, 'pack_per_carton', parseInt(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center dark:bg-gray-800 dark:text-white"
                                                />
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-center bg-gray-100 dark:bg-gray-600">
                                                <span className="text-sm text-gray-900 dark:text-white font-medium">
                                                    {displayFobCarton}
                                                </span>
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={displayRrp}
                                                    placeholder="-"
                                                    onChange={(e) => handleFieldUpdate(product.product_id, 'recommended_rrp', parseFloat(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center dark:bg-gray-800 dark:text-white"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};