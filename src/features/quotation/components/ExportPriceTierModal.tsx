import React, { useState, useEffect, useCallback } from 'react';
import {
    getProductExportPriceTiers,
    createExportPriceTier,
    updateExportPriceTier,
    deleteExportPriceTier,
    ProductExportPriceTier,
    CreateProductExportPriceTierRequest
} from '../services/useProductsExportPriceTier';

// Helper function to check if a value is a valid number string (allows empty and decimals)
const isValidNumberString = (value: string): boolean => {
    if (value === '') return true; // Allow empty string
    // Regex to allow integers and decimals (e.g., 123, 123.45, .45)
    const numberRegex = /^-?\d*(\.\d+)?$/;
    return numberRegex.test(value) && !isNaN(parseFloat(value));
};

// Helper function to check if a value is a valid non-negative integer string
const isValidIntegerString = (value: string): boolean => {
    if (value === '') return true; // Allow empty string
    const integerRegex = /^\d+$/;
    return integerRegex.test(value) && parseInt(value, 10) >= 0;
};

interface ExportPriceTierModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number | null;
    productName: string | null;
    onTiersUpdated?: () => void;
}

// Define type for error states
type TierFormErrors = {
    fob_price_per_carton?: boolean;
    fob_price_per_unit?: boolean;
    recommended_rrp?: boolean;
    pack_per_carton?: boolean; // Added error state for new field
    tier_name?: boolean; // Added for completeness if needed later
};

export const ExportPriceTierModal: React.FC<ExportPriceTierModalProps> = ({
    isOpen,
    onClose,
    productId,
    productName,
    onTiersUpdated
}) => {
    const [priceTiers, setPriceTiers] = useState<ProductExportPriceTier[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<number | null>(null); // Store the ID of the tier being edited
    // Use string for number fields initially to handle text input
    const [editFormData, setEditFormData] = useState<Partial<Omit<ProductExportPriceTier, 'fob_price_per_carton' | 'fob_price_per_unit' | 'recommended_rrp' | 'pack_per_carton'> & { fob_price_per_carton: string, fob_price_per_unit: string, recommended_rrp: string, pack_per_carton: string }>>({});
    const [editFormErrors, setEditFormErrors] = useState<TierFormErrors>({});
    const [newTierData, setNewTierData] = useState<Omit<CreateProductExportPriceTierRequest, 'product_id' | 'fob_price_per_carton' | 'fob_price_per_unit' | 'recommended_rrp'> & { fob_price_per_carton: string, fob_price_per_unit: string, recommended_rrp: string, pack_per_carton: string }>({
        tier_name: '',
        fob_price_per_carton: '',
        fob_price_per_unit: '',
        recommended_rrp: '',
        pack_per_carton: '',
        is_active: true,
    });
    const [newTierErrors, setNewTierErrors] = useState<TierFormErrors>({});
    const [showAddForm, setShowAddForm] = useState<boolean>(false);

    const fetchPriceTiers = useCallback(async () => {
        if (!productId) return;
        setIsLoading(true);
        setError(null);
        try {
            const tiers = await getProductExportPriceTiers(productId);
            setPriceTiers(tiers);
        } catch (err) {
            setError('Failed to fetch price tiers.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        if (isOpen && productId) {
            fetchPriceTiers();
            setShowAddForm(false); // Reset add form on open
            setIsEditing(null); // Reset editing state
            setEditFormErrors({});
            setNewTierErrors({});
        }
    }, [isOpen, productId, fetchPriceTiers]);

    // Effect to auto-calculate FOB/Unit for the NEW tier form
    useEffect(() => {
        const cartonPrice = parseFloat(newTierData.fob_price_per_carton);
        const packSize = parseInt(newTierData.pack_per_carton, 10);

        if (!isNaN(cartonPrice) && !isNaN(packSize) && packSize > 0) {
            const unitPrice = (cartonPrice / packSize).toFixed(2);
            // Only update if the calculated value is different to avoid infinite loops
            if (unitPrice !== newTierData.fob_price_per_unit) {
                 setNewTierData(prev => ({ ...prev, fob_price_per_unit: unitPrice }));
                 // Clear potential error for fob_price_per_unit as it's now calculated
                 setNewTierErrors(prev => ({ ...prev, fob_price_per_unit: false }));
            }
        } else if (newTierData.fob_price_per_unit !== '') {
             // Clear the unit price if inputs are invalid/incomplete, unless already empty
             setNewTierData(prev => ({ ...prev, fob_price_per_unit: '' }));
        }
    }, [newTierData.fob_price_per_carton, newTierData.pack_per_carton, newTierData.fob_price_per_unit]);

    // Effect to auto-calculate FOB/Unit for the EDIT tier form
    useEffect(() => {
        const cartonPrice = parseFloat(editFormData.fob_price_per_carton ?? '');
        const packSize = parseInt(editFormData.pack_per_carton ?? '', 10);

        if (!isNaN(cartonPrice) && !isNaN(packSize) && packSize > 0) {
            const unitPrice = (cartonPrice / packSize).toFixed(2);
             // Only update if the calculated value is different
             if (unitPrice !== editFormData.fob_price_per_unit) {
                setEditFormData(prev => ({ ...prev, fob_price_per_unit: unitPrice }));
                 // Clear potential error for fob_price_per_unit
                 setEditFormErrors(prev => ({ ...prev, fob_price_per_unit: false }));
            }
        } else if (editFormData.fob_price_per_unit !== ''){
            // Clear the unit price if inputs are invalid/incomplete, unless already empty
            setEditFormData(prev => ({ ...prev, fob_price_per_unit: '' }));
        }
    }, [editFormData.fob_price_per_carton, editFormData.pack_per_carton, editFormData.fob_price_per_unit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: number | null = null) => {
        const { name, value, type } = e.target;
        let processedValue: string | boolean = value;
        const isPriceField = ['fob_price_per_carton', 'recommended_rrp'].includes(name); // Removed fob_price_per_unit
        const isPackField = name === 'pack_per_carton';
        let isNumericValid = true;

        if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        } else if (isPriceField) {
            processedValue = value; // Keep as string
            isNumericValid = isValidNumberString(value);
        } else if (isPackField) {
            processedValue = value; // Keep as string
            isNumericValid = isValidIntegerString(value);
        }

        if (id !== null) { // Editing existing tier
            setEditFormData(prev => ({ ...prev, [name]: processedValue }));
            if (isPriceField || isPackField) {
                setEditFormErrors(prev => ({ ...prev, [name]: !isNumericValid }));
            }
        } else { // Adding new tier
            setNewTierData(prev => ({ ...prev, [name]: processedValue }));
             if (isPriceField || isPackField) {
                setNewTierErrors(prev => ({ ...prev, [name]: !isNumericValid }));
            }
        }
    };

    const hasErrors = (errors: TierFormErrors): boolean => {
        return Object.values(errors).some(error => error === true);
    };

    const isFormValid = (): boolean => {
        const isNewTier = !isEditing;
        const targetData = isNewTier ? newTierData : editFormData;
        const targetErrors = isNewTier ? newTierErrors : editFormErrors;

        const allFieldsFilled = 
            targetData.tier_name?.trim() !== '' &&
            targetData.fob_price_per_carton !== '' &&
            targetData.fob_price_per_unit !== '' && // Still check calculated field isn't empty
            targetData.recommended_rrp !== '' &&
            targetData.pack_per_carton !== '';

        const allNumericValid = 
            !targetErrors.fob_price_per_carton &&
            // !targetErrors.fob_price_per_unit && // No longer check error state for calculated field
            !targetErrors.recommended_rrp &&
            !targetErrors.pack_per_carton;

        return !!allFieldsFilled && allNumericValid; // Ensure boolean return
    };

    const handleAddTier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || newTierErrors.fob_price_per_carton || newTierErrors.recommended_rrp || newTierErrors.pack_per_carton) {
            setError("Please fix the errors in the form.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Validation
            if (!newTierData.tier_name.trim()) {
                throw new Error("Tier Name cannot be empty.");
            }
            const fobCarton = parseFloat(newTierData.fob_price_per_carton) || 0;
            const fobUnit = parseFloat(newTierData.fob_price_per_unit) || 0;
            const rrp = parseFloat(newTierData.recommended_rrp) || 0;
            const packPerCarton = parseInt(newTierData.pack_per_carton, 10);

            if (fobCarton < 0 || fobUnit < 0 || rrp < 0 || packPerCarton < 0) { 
                 throw new Error("Prices, RRP, and Pack Size cannot be negative.");
            }
             if (isNaN(packPerCarton)) {
                 throw new Error("Pack Size must be a valid integer.");
             }

            // Pass packPerCarton to createExportPriceTier
            await createExportPriceTier(
                newTierData.tier_name,
                fobCarton,
                fobUnit,
                rrp,
                packPerCarton, // Pass the value here
                newTierData.is_active,
                productId
            );
            setNewTierData({ 
                tier_name: '',
                fob_price_per_carton: '',
                fob_price_per_unit: '',
                recommended_rrp: '',
                pack_per_carton: '', 
                is_active: true,
            });
             setNewTierErrors({});
            setShowAddForm(false);
            fetchPriceTiers();
            onTiersUpdated?.();
        } catch (err) {
             const message = err instanceof Error ? err.message : 'Failed to add price tier.';
             setError(message);
             console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTier = async (id: number) => {
        if (!editFormData || editFormErrors.fob_price_per_carton || editFormErrors.recommended_rrp || editFormErrors.pack_per_carton) {
            setError("Please fix the errors in the form.");
            return;
        }
        setIsLoading(true);
         setError(null);
        try {
            // Validation
            if (!editFormData.tier_name?.trim()) {
                throw new Error("Tier Name cannot be empty.");
            }
            const fobCarton = parseFloat(editFormData.fob_price_per_carton ?? '') || 0;
            const fobUnit = parseFloat(editFormData.fob_price_per_unit ?? '') || 0;
            const rrp = parseFloat(editFormData.recommended_rrp ?? '') || 0;
            const packPerCarton = parseInt(editFormData.pack_per_carton ?? '', 10);

             if (fobCarton < 0 || fobUnit < 0 || rrp < 0 || packPerCarton < 0) { 
                 throw new Error("Prices, RRP, and Pack Size cannot be negative.");
            }
            if (isNaN(packPerCarton)) {
                 throw new Error("Pack Size must be a valid integer.");
             }

            // Pass packPerCarton to updateExportPriceTier
            await updateExportPriceTier(
                id,
                editFormData.tier_name ?? '',
                fobCarton,
                fobUnit,
                rrp,
                packPerCarton, // Pass the value here
                editFormData.is_active ?? true
            );
            setIsEditing(null);
            setEditFormData({});
            setEditFormErrors({});
            fetchPriceTiers();
            onTiersUpdated?.();
        } catch (err) {
             const message = err instanceof Error ? err.message : 'Failed to update price tier.';
             setError(message);
             console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTier = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this price tier?')) return;
        setIsLoading(true);
         setError(null);
        try {
            await deleteExportPriceTier(id);
            fetchPriceTiers();
            onTiersUpdated?.();
        } catch (err) {
             const message = err instanceof Error ? err.message : 'Failed to delete price tier.';
             setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (tier: ProductExportPriceTier) => {
        setIsEditing(tier.id);
        // Convert numbers to strings for the form state
        setEditFormData({
            ...tier,
            fob_price_per_carton: tier.fob_price_per_carton.toString(),
            fob_price_per_unit: tier.fob_price_per_unit.toString(),
            recommended_rrp: tier.recommended_rrp.toString(),
            pack_per_carton: tier.pack_per_carton?.toString() ?? '',
         });
        setEditFormErrors({}); // Clear errors when starting edit
        setShowAddForm(false);
        setError(null);
    };

    const cancelEditing = () => {
        setIsEditing(null);
        setEditFormData({});
        setEditFormErrors({});
        setError(null);
    };

    const cancelAdd = () => {
        setShowAddForm(false);
        setNewTierData({
            tier_name: '',
            fob_price_per_carton: '',
            fob_price_per_unit: '',
            recommended_rrp: '',
            pack_per_carton: '',
            is_active: true,
        });
        setNewTierErrors({});
        setError(null);
    };

     const handleModalClose = () => {
        setError(null);
        setEditFormErrors({});
        setNewTierErrors({});
        onClose();
    };


    if (!isOpen) return null;

    // Common input classes
    const inputBaseClass = "p-1 border rounded text-sm";
    const inputErrorClass = "border-red-500";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <h2 className="text-xl font-semibold">Price Tiers for <span className="font-bold">{productName || 'Product'}</span></h2>
                    <button onClick={handleModalClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
                 </div>

                 {/* Error Display Area */}
                 {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                         <strong className="font-bold">Error: </strong>
                         <span className="block sm:inline">{error}</span>
                    </div>
                 )}


                {isLoading && priceTiers.length === 0 ? (
                    <div className="text-center p-4">Loading price tiers...</div>
                ) : (
                    <>
                        {/* Price Tiers Table */}
                        <table className="min-w-full border-collapse border border-gray-300 mb-4 text-sm">
                             <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2 text-left">Tier Name</th>
                                    <th className="border p-2 text-right">FOB/Carton</th>
                                    <th className="border p-2 text-right">FOB/Unit</th>
                                    <th className="border p-2 text-right">RRP</th>
                                    <th className="border p-2 text-right">Pack/Carton</th>
                                    <th className="border p-2 text-center">Active</th>
                                    <th className="border p-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceTiers.map((tier) => (
                                    <tr key={tier.id} className={`hover:bg-gray-50 ${isEditing === tier.id ? 'bg-blue-50' : ''}`}>
                                        {isEditing === tier.id ? (
                                            <>
                                                {/* Editing Row */}
                                                <td className="border p-1"><input type="text" name="tier_name" value={editFormData.tier_name ?? ''} onChange={(e) => handleInputChange(e, tier.id)} className={`w-full ${inputBaseClass}`} aria-label="Edit Tier Name"/></td>
                                                <td className="border p-1"><input type="text" inputMode="decimal" name="fob_price_per_carton" value={editFormData.fob_price_per_carton ?? ''} onChange={(e) => handleInputChange(e, tier.id)} className={`w-24 text-right ${inputBaseClass} ${editFormErrors.fob_price_per_carton ? inputErrorClass : ''}`} aria-label="Edit FOB Price Per Carton"/></td>
                                                <td className="border p-1"><input type="text" inputMode="decimal" name="fob_price_per_unit" value={editFormData.fob_price_per_unit ?? ''} readOnly className={`w-24 text-right bg-gray-100 ${inputBaseClass}`} aria-label="Calculated FOB Price Per Unit"/></td>
                                                <td className="border p-1"><input type="text" inputMode="decimal" name="recommended_rrp" value={editFormData.recommended_rrp ?? ''} onChange={(e) => handleInputChange(e, tier.id)} className={`w-24 text-right ${inputBaseClass} ${editFormErrors.recommended_rrp ? inputErrorClass : ''}`} aria-label="Edit Recommended RRP"/></td>
                                                <td className="border p-1"><input type="text" inputMode="numeric" pattern="[0-9]*" name="pack_per_carton" value={editFormData.pack_per_carton ?? ''} onChange={(e) => handleInputChange(e, tier.id)} className={`w-20 text-right ${inputBaseClass} ${editFormErrors.pack_per_carton ? inputErrorClass : ''}`} aria-label="Edit Pack Per Carton"/></td>
                                                <td className="border p-1 text-center"><input type="checkbox" name="is_active" checked={editFormData.is_active ?? false} onChange={(e) => handleInputChange(e, tier.id)} className="h-4 w-4" aria-label="Edit Active Status"/></td>
                                                <td className="border p-1 text-center whitespace-nowrap">
                                                    <button onClick={() => handleUpdateTier(tier.id)} className="text-green-600 hover:text-green-800 mr-2 text-sm font-medium" disabled={isLoading || hasErrors(editFormErrors)}>Save</button>
                                                    <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700 text-sm font-medium" disabled={isLoading}>Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {/* Display Row */}
                                                <td className="border p-2 text-left">{tier.tier_name}</td>
                                                <td className="border p-2 text-right">${tier.fob_price_per_carton.toFixed(2)}</td>
                                                <td className="border p-2 text-right">${tier.fob_price_per_unit.toFixed(2)}</td>
                                                <td className="border p-2 text-right">${tier.recommended_rrp.toFixed(2)}</td>
                                                <td className="border p-2 text-right">{tier.pack_per_carton ?? '-'}</td>
                                                <td className="border p-2 text-center">{tier.is_active ? 'Yes' : 'No'}</td>
                                                <td className="border p-2 text-center whitespace-nowrap">
                                                    <button onClick={() => startEditing(tier)} className="text-blue-600 hover:text-blue-800 mr-2 text-sm font-medium" disabled={isLoading || isEditing !== null || showAddForm}>Edit</button>
                                                    <button onClick={() => handleDeleteTier(tier.id)} className="text-red-600 hover:text-red-800 text-sm font-medium" disabled={isLoading || isEditing !== null || showAddForm}>Delete</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {priceTiers.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7} className="text-center p-4 text-gray-500">No price tiers found for this product.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                         {/* Add/Edit Section Separator */}
                         {!isEditing && !showAddForm && <hr className="my-4"/>}

                        {/* Add New Tier Form Section */}
                        {!isEditing && (
                            showAddForm ? (
                                <form onSubmit={handleAddTier} className="border p-4 rounded bg-gray-50">
                                    <h3 className="text-lg font-medium mb-3">Add New Price Tier</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                         <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name*</label>
                                             <input type="text" name="tier_name" placeholder="e.g., Wholesale" value={newTierData.tier_name} onChange={(e) => handleInputChange(e)} required className={`w-full ${inputBaseClass}`}/>
                                         </div>
                                         <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">FOB/Carton*</label>
                                              <div className="relative">
                                                  <input type="text" inputMode="decimal" name="fob_price_per_carton" placeholder="0.00" value={newTierData.fob_price_per_carton} onChange={(e) => handleInputChange(e)} required className={`w-full ${inputBaseClass} ${newTierErrors.fob_price_per_carton ? inputErrorClass : ''}`}/>
                                                  {newTierErrors.fob_price_per_carton && (
                                                      <p className="text-red-500 text-xs mt-1">Please enter a valid number</p>
                                                  )}
                                              </div>
                                         </div>
                                          <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">FOB/Unit*</label>
                                             <div className="relative">
                                                 <input type="text" inputMode="decimal" name="fob_price_per_unit" placeholder="Auto-calculated" value={newTierData.fob_price_per_unit} readOnly required className={`w-full bg-gray-100 ${inputBaseClass}`}/>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">RRP*</label>
                                             <div className="relative">
                                                 <input type="text" inputMode="decimal" name="recommended_rrp" placeholder="0.00" value={newTierData.recommended_rrp} onChange={(e) => handleInputChange(e)} required className={`w-full ${inputBaseClass} ${newTierErrors.recommended_rrp ? inputErrorClass : ''}`}/>
                                                 {newTierErrors.recommended_rrp && (
                                                     <p className="text-red-500 text-xs mt-1">Please enter a valid number</p>
                                                 )}
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">Pack/Carton*</label>
                                             <div className="relative">
                                                 <input type="text" inputMode="numeric" pattern="[0-9]*" name="pack_per_carton" placeholder="e.g., 12" value={newTierData.pack_per_carton} onChange={(e) => handleInputChange(e)} required className={`w-full ${inputBaseClass} ${newTierErrors.pack_per_carton ? inputErrorClass : ''}`}/>
                                                 {newTierErrors.pack_per_carton && (
                                                     <p className="text-red-500 text-xs mt-1">Please enter a valid integer</p>
                                                 )}
                                             </div>
                                         </div>
                                        <div className="flex items-end pb-1">
                                             <label className="flex items-center space-x-2 cursor-pointer">
                                                 <input type="checkbox" name="is_active" checked={newTierData.is_active} onChange={(e) => handleInputChange(e)} className="h-4 w-4"/>
                                                 <span className="text-sm font-medium text-gray-700">Active</span>
                                             </label>
                                         </div>
                                    </div>
                                     <div className="flex justify-end space-x-2 mt-1">
                                        <button 
                                            type="submit" 
                                            className={`font-bold py-2 px-4 rounded text-sm ${
                                                isFormValid() 
                                                    ? 'bg-green-500 hover:bg-green-700 text-white' 
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`} 
                                            disabled={isLoading || !isFormValid()}
                                        >
                                            {isLoading ? 'Adding...' : 'Add Tier'}
                                        </button>
                                        <button type="button" onClick={cancelAdd} className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded text-sm" disabled={isLoading}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                 /* Add New Tier Button */
                                <div className="text-right">
                                    <button
                                        onClick={() => { setShowAddForm(true); setError(null); setNewTierErrors({}); }} // Clear errors
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                                        disabled={isLoading || isEditing !== null}
                                    >
                                        + Add New Tier
                                    </button>
                                 </div>
                            )
                        )}
                    </>
                 )}

                 {/* Separator before Close button, unless adding/editing */}
                 {(!showAddForm && !isEditing) && <hr className="my-4"/> }

                {/* Close Button */}
                <div className="mt-6 text-right">
                    <button
                        onClick={handleModalClose}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}; 