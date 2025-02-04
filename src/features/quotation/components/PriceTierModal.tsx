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
}

const PriceTierModal: React.FC<PriceTierModalProps> = ({ open, onClose, products, productPriceTiers, onPriceTierUpdate }) => {
    const [isSideModalOpen, setIsSideModalOpen] = useState(false);
    const [newTier, setNewTier] = useState({ min_cartons: 0, price_per_unit: 0 });
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedTier, setSelectedTier] = useState<{ productId: number | null, tierId: number | null }>({ productId: null, tierId: null });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTier, setEditTier] = useState<{ min_cartons: number, price_per_unit: number, tierId: number | null }>({
        min_cartons: 0,
        price_per_unit: 0,
        tierId: null
    });

    const handleAddClick = (productId: number) => {
        setSelectedProductId(productId);
        setIsSideModalOpen(true);
    };

    const handleSaveNewTier = async (productId: number) => {
        try {
            const newPriceTier = await createPriceTier(newTier.min_cartons, newTier.price_per_unit, productId);
            if (!productPriceTiers[productId]) {
                productPriceTiers[productId] = [];
            }
            const updatedTiers = [...productPriceTiers[productId], newPriceTier];
            onPriceTierUpdate(productId, updatedTiers);
            setIsSideModalOpen(false);
            setNewTier({ min_cartons: 0, price_per_unit: 0 });
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
                const updatedTier = await updatePriceTier(editTier.tierId, editTier.min_cartons, editTier.price_per_unit);
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
            <div className="price-tier-modal">
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
                        maxHeight: '60vh',
                        overflow: 'auto'
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Price Tiers</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>
                                        {productPriceTiers[product.id]?.sort((a, b) => a.min_cartons - b.min_cartons).map(tier => (
                                            <div key={tier.id}>
                                                <input
                                                    title={`Price tier for ${tier.min_cartons} cartons at $${tier.price_per_unit} per unit`}
                                                    type="radio"
                                                    name={`tier-${product.id}`}
                                                    checked={selectedTier.productId === product.id && selectedTier.tierId === tier.id}
                                                    onChange={() => handleCheckboxChange(product.id, tier.id)}
                                                />
                                                {`≥${tier.min_cartons} cartons: $${tier.price_per_unit}`}
                                            </div>
                                        )) || 'No price tiers available'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleAddClick(product.id)}>
                                            <AddCircle />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => {
                                                const tierId = selectedTier.tierId;
                                                if (tierId !== null) {
                                                    handleEditClick(product.id, tierId);
                                                } else {
                                                    console.warn('No tier selected for editing');
                                                }
                                            }}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton onClick={() => handleDeleteClick(product.id)}>
                                            <Delete />
                                        </IconButton>
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
