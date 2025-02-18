import React, { useState } from 'react';
import { Product, UpdateProductRequest } from '../../../shared/types/Product';
import { updateProduct } from '../../../services/useProducts';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateProductRequest) => Promise<void>;
  product: Product;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, onSubmit, product }) => {
  const [formData, setFormData] = useState<UpdateProductRequest>({
    name: product.name,
    pack_count_per_box: Number(product.pack_count_per_box),
    rrp_sgd: product.rrp_sgd,
    rrp_myr: product.rrp_myr,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProduct(product.id, formData);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update product:', error);
      // You might want to add error handling/display here
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Edit Product</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              title="Name"
              placeholder="Name"
              type="text"
              className="w-full border rounded p-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Pack Count per Box</label>
            <input
              title="Pack Count per Box"
              placeholder="Pack Count per Box"
              type="number"
              className="w-full border rounded p-2"
              value={formData.pack_count_per_box}
              onChange={(e) => setFormData({ ...formData, pack_count_per_box: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Retail Price (SGD)</label>
            <input
              title="Retail Price (SGD)"
              placeholder="Retail Price (SGD)"
              type="number"
              step="0.01"
              className="w-full border rounded p-2"
              value={formData.rrp_sgd || ''}
              onChange={(e) => setFormData({ ...formData, rrp_sgd: e.target.value || null })}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Retail Price (MYR)</label>
            <input
              title="Retail Price (MYR)"
              placeholder="Retail Price (MYR)"
              type="number"
              step="0.01"
              className="w-full border rounded p-2"
              value={formData.rrp_myr || ''}
              onChange={(e) => setFormData({ ...formData, rrp_myr: e.target.value || null })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal; 