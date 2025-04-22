import React, { useState } from 'react';
import { Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { Product, ProductPriceTier } from '../../../shared/types/Product';
import CloseIcon from '@mui/icons-material/Close';
import { AddCircle, Edit, Delete } from '@mui/icons-material';
import '../styles/PriceTierModal.css';
import { createPriceTier, deletePriceTier, updatePriceTier } from '../services/useProductsPriceTier';

interface PriceTierModalProps {
    open: boolean;
    onClose: () => void;
    products: Product[];
    productPriceTiers: { [key: number]: ProductPriceTier[] };
    onPriceTierUpdate: (productId: number, updatedTiers: ProductPriceTier[]) => void;
    selectedCurrency: 'SGD' | 'MYR';
}

const PriceTierModal: React.FC<PriceTierModalProps> = ({ open, onClose, products, productPriceTiers, onPriceTierUpdate, selectedCurrency }) => {
    const [isSideModalOpen, setIsSideModalOpen] = useState(false);
    const [newTier, setNewTier] = useState({ min_cartons: 0, min_packs: 0, price_per_unit: 0, currency: selectedCurrency });
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedTier, setSelectedTier] = useState<{ productId: number | null, tierId: number | null }>({ productId: null, tierId: null });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTier, setEditTier] = useState<{ min_cartons: number, min_packs: number, price_per_unit: number, tierId: number | null }>({
        min_cartons: 0,
        min_packs: 0,
        price_per_unit: 0,
        tierId: null
    });

    const handleAddClick = (productId: number) => {
        setSelectedProductId(productId);
        setIsSideModalOpen(true);
    };

    const handleSaveNewTier = async (productId: number) => {
        try {
            const newPriceTier = await createPriceTier(
                newTier.min_cartons,
                newTier.min_packs,
                newTier.price_per_unit,
                productId,
                selectedCurrency
            );
            if (!productPriceTiers[productId]) {
                productPriceTiers[productId] = [];
            }
            const updatedTiers = [...productPriceTiers[productId], newPriceTier];
            onPriceTierUpdate(productId, updatedTiers as ProductPriceTier[]);
            setIsSideModalOpen(false);
            setNewTier({ min_cartons: 0, min_packs: 0, price_per_unit: 0, currency: selectedCurrency });
        } catch (error) {
            console.error('Error saving new price tier:', error);
        }
    };

    const handleDeleteClick = (productId: number) => {
        setSelectedProductId(productId);
        setIsDeleteModalOpen(true);
    };

    const handleCheckboxChange = (productId: number, tierId: number) => {
        setSelectedTier({ productId, tierId });
        console.log(`Selected Price Tier ID: ${tierId}`);
    };

    const handleConfirmDelete = async () => {
        if (selectedTier.productId !== null && selectedTier.tierId !== null) {
            try {
                const success = await deletePriceTier(selectedTier.tierId);
                if (success) {
                    const updatedTiers = productPriceTiers[selectedTier.productId].filter(
                        tier => tier.id !== selectedTier.tierId
                    );
                    onPriceTierUpdate(selectedTier.productId, updatedTiers);
                    setSelectedTier({ productId: null, tierId: null });
                    setIsDeleteModalOpen(false);
                }
            } catch (error) {
                console.error('Error deleting price tier:', error);
            }
        }
    };

    const handleEditClick = (productId: number, tierId: number) => {
        const tier = productPriceTiers[productId].find(t => t.id === tierId);
        if (tier) {
            setEditTier({
                min_cartons: Number(tier.min_cartons),
                min_packs: Number(tier.min_packs),
                price_per_unit: Number(tier.price_per_unit),
                tierId: tier.id
            });
            setSelectedProductId(productId);
            setIsEditModalOpen(true);
        }
    };

    const handleSaveEditTier = async () => {
        if (editTier.tierId !== null && selectedProductId !== null) {
            try {
                const updatedTier = await updatePriceTier(editTier.tierId, editTier.min_cartons, editTier.min_packs, editTier.price_per_unit, selectedCurrency);
                const productTiers = [...productPriceTiers[selectedProductId]];
                const tierIndex = productTiers.findIndex(t => t.id === editTier.tierId);
                if (tierIndex !== -1) {
                    productTiers[tierIndex] = updatedTier;
                    onPriceTierUpdate(selectedProductId, productTiers);
                }
                setIsEditModalOpen(false);
            } catch (error) {
                console.error('Error updating price tier:', error);
            }
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="price-tier-modal" style={{ width: '80%', height: '80%' }}>
                <div className="modal-header">
                    <IconButton 
                        onClick={onClose} 
                        className="close-button"
                        sx={{
                            position: 'absolute',
                            right: '24px',
                            top: '8px'
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </div>
                <TableContainer 
                    component={Paper} 
                    sx={{ 
                        maxHeight: '70vh',
                        overflow: 'auto'
                    }}
                >
                    <Table size="small" sx={{ '& td, & th': { padding: '8px' } }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: '20%' }}>Product Name</TableCell>
                                <TableCell sx={{ width: '15%' }}>Carton Price Tiers ({selectedCurrency})</TableCell>
                                <TableCell sx={{ width: '15%' }}>Pack Price Tiers ({selectedCurrency})</TableCell>
                                <TableCell sx={{ width: '10%' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell sx={{ verticalAlign: 'top' }}>{product.name}</TableCell>
                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                        {productPriceTiers[product.id]?.filter(tier => 
                                            tier.min_cartons !== null && 
                                            tier.min_cartons !== 0 &&
                                            tier.currency === selectedCurrency
                                        )
                                        .sort((a, b) => a.min_cartons! - b.min_cartons!)
                                        .map(tier => (
                                            <div key={tier.id} style={{ marginBottom: '4px' }}>
                                                <input
                                                    style={{ marginRight: '4px' }}
                                                    title={`Price tier for ≥${tier.min_cartons} cartons at $${tier.price_per_unit} per unit`}
                                                    type="radio"
                                                    name={`tier-carton-${product.id}`}
                                                    checked={selectedTier.productId === product.id && selectedTier.tierId === tier.id}
                                                    onChange={() => handleCheckboxChange(product.id, tier.id)}
                                                />
                                                ≥{tier.min_cartons} cartons: {tier.currency} ${tier.price_per_unit}
                                            </div>
                                        )) || 'No carton price tiers available'}
                                    </TableCell>
                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                        {productPriceTiers[product.id]?.filter(tier => 
                                            tier.min_packs !== 0 &&
                                            tier.currency === selectedCurrency
                                        )
                                        .sort((a, b) => (a.min_packs ?? 0) - (b.min_packs ?? 0))
                                        .map(tier => (
                                            <div key={tier.id} style={{ marginBottom: '4px' }}>
                                                <input
                                                    style={{ marginRight: '4px' }}
                                                    title={`Price tier for ≥${tier.min_packs} packs at $${tier.price_per_unit} per unit`}
                                                    type="radio"
                                                    name={`tier-pack-${product.id}`}
                                                    checked={selectedTier.productId === product.id && selectedTier.tierId === tier.id}
                                                    onChange={() => handleCheckboxChange(product.id, tier.id)}
                                                />
                                                ≥{tier.min_packs} packs: {tier.currency} ${tier.price_per_unit}
                                            </div>
                                        )) || 'No pack price tiers available'}
                                    </TableCell>
                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                        <IconButton onClick={() => handleAddClick(product.id)}>
                                            <AddCircle />
                                        </IconButton>
                                        {selectedTier.productId === product.id && selectedTier.tierId !== null && (
                                            <>
                                                <IconButton 
                                                    onClick={() => handleEditClick(product.id, selectedTier.tierId!)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                                <IconButton onClick={() => handleDeleteClick(product.id)}>
                                                    <Delete />
                                                </IconButton>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {isSideModalOpen && selectedProductId !== null && (
                    <div className="side-modal">
                        <h3>Add New Price Tier</h3>
                        <label>
                            Min Cartons
                            <input
                                type="number"
                                placeholder="Min Cartons"
                                value={newTier.min_cartons}
                                onChange={(e) => setNewTier({ ...newTier, min_cartons: parseInt(e.target.value) })}
                            />
                        </label>
                        <label>
                            Min Packs
                            <input
                                type="number"
                                placeholder="Min Packs"
                                value={newTier.min_packs}
                                onChange={(e) => setNewTier({ ...newTier, min_packs: parseInt(e.target.value) })}
                            />
                        </label>
                        <label>
                            Price per Unit
                            <input
                                type="number"
                                placeholder="Price per Unit"
                                value={newTier.price_per_unit}
                                onChange={(e) => setNewTier({ ...newTier, price_per_unit: parseFloat(e.target.value) })}
                            />
                        </label>
                        <button onClick={() => handleSaveNewTier(selectedProductId)}>Save</button>
                        <button onClick={() => setIsSideModalOpen(false)}>Cancel</button>
                    </div>
                )}
                {isDeleteModalOpen && (
                    <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                        <div className="confirmation-modal">
                            <h3>Confirm Deletion</h3>
                            <p>Are you sure you want to delete the selected price tier?</p>
                            <button onClick={handleConfirmDelete}>Confirm</button>
                            <button onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                        </div>
                    </Modal>
                )}
                {isEditModalOpen && (
                    <div className="edit-modal">
                        <h3>Edit Price Tier</h3>
                        <label>
                            Min Cartons
                            <input
                                type="number"
                                placeholder="Min Cartons"
                                value={editTier.min_cartons}
                                onChange={(e) => setEditTier({ ...editTier, min_cartons: parseInt(e.target.value) })}
                            />
                        </label>
                        <label>
                            Min Packs
                            <input
                                type="number"
                                placeholder="Min Packs"
                                value={editTier.min_packs}
                                onChange={(e) => setEditTier({ ...editTier, min_packs: parseInt(e.target.value) })}
                            />
                        </label>
                        <label>
                            Price per Unit
                            <input
                                type="number"
                                placeholder="Price per Unit"
                                value={editTier.price_per_unit}
                                onChange={(e) => setEditTier({ ...editTier, price_per_unit: parseFloat(e.target.value) })}
                            />
                        </label>
                        <button onClick={handleSaveEditTier}>Save</button>
                        <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PriceTierModal;
