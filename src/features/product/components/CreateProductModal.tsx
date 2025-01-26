import React, { useState } from 'react';
import { CreateProductRequest } from '../../../shared/types/Product';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: CreateProductRequest) => Promise<void>;
  companyId: string;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({ isOpen, onClose, onSubmit, companyId }) => {
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    pack_count_per_box: 0,
    recommended_retail_price: 0,
    company_id: companyId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Create New Product</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
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
              type="number"
              className="w-full border rounded p-2"
              value={formData.pack_count_per_box}
              onChange={(e) => setFormData({ ...formData, pack_count_per_box: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Recommended Retail Price</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded p-2"
              value={formData.recommended_retail_price}
              onChange={(e) => setFormData({ ...formData, recommended_retail_price: parseFloat(e.target.value) })}
              required
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal; 