import React, { useState, useEffect, useCallback } from 'react';
import {
    getProductExportPriceTiers,
    createExportPriceTier,
    updateExportPriceTier,
    deleteExportPriceTier,
    ProductExportPriceTier,
    CreateProductExportPriceTierRequest
} from '../services/useProductsExportPriceTier';

interface ExportPriceTierModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number | null;
    productName: string | null;
    onTiersUpdated?: () => void;
}

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
    const [editFormData, setEditFormData] = useState<Partial<ProductExportPriceTier>>({});
    const [newTierData, setNewTierData] = useState<Omit<CreateProductExportPriceTierRequest, 'product_id'>>({
        tier_name: '',
        fob_price_per_carton: 0,
        fob_price_per_unit: 0, // This might be calculated or entered
        recommended_rrp: 0,
        is_active: true,
    });
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
        }
    }, [isOpen, productId, fetchPriceTiers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: number | null = null) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | boolean = value;

        if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        } else if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        }

        if (id !== null) { // Editing existing tier
            setEditFormData(prev => ({ ...prev, [name]: processedValue }));
        } else { // Adding new tier
            setNewTierData(prev => ({ ...prev, [name]: processedValue }));
        }
    };

    const handleAddTier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId) return;
        setIsLoading(true);
        setError(null); // Clear previous errors
        try {
            // Basic validation
            if (!newTierData.tier_name.trim()) {
                throw new Error("Tier Name cannot be empty.");
            }
            if (newTierData.fob_price_per_carton < 0 || newTierData.fob_price_per_unit < 0 || newTierData.recommended_rrp < 0) {
                 throw new Error("Prices and RRP cannot be negative.");
            }

            await createExportPriceTier(
                newTierData.tier_name,
                newTierData.fob_price_per_carton,
                newTierData.fob_price_per_unit,
                newTierData.recommended_rrp,
                newTierData.is_active,
                productId
            );
            setNewTierData({ // Reset form
                tier_name: '',
                fob_price_per_carton: 0,
                fob_price_per_unit: 0,
                recommended_rrp: 0,
                is_active: true,
            });
            setShowAddForm(false);
            fetchPriceTiers(); // Refresh modal's list
            onTiersUpdated?.(); // Call the callback if provided
        } catch (err) {
             const message = err instanceof Error ? err.message : 'Failed to add price tier.';
             setError(message);
             console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTier = async (id: number) => {
        if (!editFormData) return;
        setIsLoading(true);
         setError(null); // Clear previous errors
        try {
             // Basic validation
            if (!editFormData.tier_name?.trim()) {
                throw new Error("Tier Name cannot be empty.");
            }
             if ((editFormData.fob_price_per_carton ?? 0) < 0 || (editFormData.fob_price_per_unit ?? 0) < 0 || (editFormData.recommended_rrp ?? 0) < 0) {
                 throw new Error("Prices and RRP cannot be negative.");
            }

            await updateExportPriceTier(
                id,
                editFormData.tier_name ?? '',
                editFormData.fob_price_per_carton ?? 0,
                editFormData.fob_price_per_unit ?? 0,
                editFormData.recommended_rrp ?? 0,
                editFormData.is_active ?? true
            );
            setIsEditing(null);
            setEditFormData({});
            fetchPriceTiers(); // Refresh modal's list
            onTiersUpdated?.(); // Call the callback if provided
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
         setError(null); // Clear previous errors
        try {
            await deleteExportPriceTier(id);
            fetchPriceTiers(); // Refresh modal's list
            onTiersUpdated?.(); // Call the callback if provided
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
        setEditFormData({ ...tier });
        setShowAddForm(false);
        setError(null);
    };

    const cancelEditing = () => {
        setIsEditing(null);
        setEditFormData({});
        setError(null);
    };

    const cancelAdd = () => {
        setShowAddForm(false);
        setNewTierData({
            tier_name: '',
            fob_price_per_carton: 0,
            fob_price_per_unit: 0,
            recommended_rrp: 0,
            is_active: true,
        });
        setError(null);
    };

     const handleModalClose = () => {
        setError(null);
        onClose();
    };


    if (!isOpen) return null;

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
                                    <th className="border p-2 text-center">Active</th>
                                    <th className="border p-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceTiers.map((tier) => (
                                    <tr key={tier.id} className={`hover:bg-gray-50 ${isEditing === tier.id ? 'bg-blue-50' : ''}`}>
                                        {isEditing === tier.id ? (
                                            <>
                                                <td className="border p-1"><input type="text" name="tier_name" value={editFormData.tier_name ?? ''} onChange={(e) => handleInputChange(e, tier.id)} className="w-full p-1 border rounded text-sm"/></td>
                                                <td className="border p-1"><input type="number" step="0.01" name="fob_price_per_carton" value={editFormData.fob_price_per_carton ?? 0} onChange={(e) => handleInputChange(e, tier.id)} className="w-24 p-1 border rounded text-right text-sm"/></td>
                                                <td className="border p-1"><input type="number" step="0.01" name="fob_price_per_unit" value={editFormData.fob_price_per_unit ?? 0} onChange={(e) => handleInputChange(e, tier.id)} className="w-24 p-1 border rounded text-right text-sm"/></td>
                                                <td className="border p-1"><input type="number" step="0.01" name="recommended_rrp" value={editFormData.recommended_rrp ?? 0} onChange={(e) => handleInputChange(e, tier.id)} className="w-24 p-1 border rounded text-right text-sm"/></td>
                                                <td className="border p-1 text-center"><input type="checkbox" name="is_active" checked={editFormData.is_active ?? false} onChange={(e) => handleInputChange(e, tier.id)} className="h-4 w-4"/></td>
                                                <td className="border p-1 text-center whitespace-nowrap">
                                                    <button onClick={() => handleUpdateTier(tier.id)} className="text-green-600 hover:text-green-800 mr-2 text-sm font-medium" disabled={isLoading}>Save</button>
                                                    <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700 text-sm font-medium" disabled={isLoading}>Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="border p-2 text-left">{tier.tier_name}</td>
                                                <td className="border p-2 text-right">${tier.fob_price_per_carton.toFixed(2)}</td>
                                                <td className="border p-2 text-right">${tier.fob_price_per_unit.toFixed(2)}</td>
                                                <td className="border p-2 text-right">${tier.recommended_rrp.toFixed(2)}</td>
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
                                        <td colSpan={6} className="text-center p-4 text-gray-500">No price tiers found for this product.</td>
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
                                             <input type="text" name="tier_name" placeholder="e.g., Wholesale" value={newTierData.tier_name} onChange={(e) => handleInputChange(e)} required className="p-2 border rounded w-full text-sm"/>
                                         </div>
                                         <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">FOB/Carton*</label>
                                             <input type="number" step="0.01" min="0" name="fob_price_per_carton" placeholder="0.00" value={newTierData.fob_price_per_carton} onChange={(e) => handleInputChange(e)} required className="p-2 border rounded w-full text-sm"/>
                                         </div>
                                          <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">FOB/Unit*</label>
                                             <input type="number" step="0.01" min="0" name="fob_price_per_unit" placeholder="0.00" value={newTierData.fob_price_per_unit} onChange={(e) => handleInputChange(e)} required className="p-2 border rounded w-full text-sm"/>
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">RRP*</label>
                                             <input type="number" step="0.01" min="0" name="recommended_rrp" placeholder="0.00" value={newTierData.recommended_rrp} onChange={(e) => handleInputChange(e)} required className="p-2 border rounded w-full text-sm"/>
                                         </div>
                                        <div className="flex items-end pb-1">
                                             <label className="flex items-center space-x-2 cursor-pointer">
                                                 <input type="checkbox" name="is_active" checked={newTierData.is_active} onChange={(e) => handleInputChange(e)} className="h-4 w-4"/>
                                                 <span className="text-sm font-medium text-gray-700">Active</span>
                                             </label>
                                         </div>
                                    </div>
                                     <div className="flex justify-end space-x-2 mt-1">
                                        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm" disabled={isLoading}>
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
                                        onClick={() => { setShowAddForm(true); setError(null); }} // Clear error when showing form
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