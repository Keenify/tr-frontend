import React, { useState, useEffect } from 'react';
import { Product } from '../../../shared/types/Product';
import { ProductExportDetails, UpdateProductExportDetails } from '../../../shared/types/ProductExport';
import { getProductExportDetails, updateProductExportDetails, createProductExportDetails } from '../../../services/useProductExportDetails';
import { ClipLoader } from 'react-spinners';

interface EditProductExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const EditProductExportModal: React.FC<EditProductExportModalProps> = ({ isOpen, onClose, product }) => {
  const [loading, setLoading] = useState(true);
  const [exportDetails, setExportDetails] = useState<ProductExportDetails | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [formData, setFormData] = useState<UpdateProductExportDetails>({
    pack_size_per_carton: 0,
    fob_price_per_carton: '',
    recommended_retail_price_usd: '',
    shelf_life: '',
    hs_code: '',
    carton_width: '',
    carton_length: '',
    carton_height: '',
    net_weight: '',
    gross_weight: '',
    country_of_origin: '',
    container_size: '',
    cartons_per_container: 0,
  });

  useEffect(() => {
    const fetchExportDetails = async () => {
      try {
        setLoading(true);
        const details = await getProductExportDetails(product.id);
        setExportDetails(details);
        setFormData({
          pack_size_per_carton: details?.pack_size_per_carton || 0,
          fob_price_per_carton: details?.fob_price_per_carton || '',
          recommended_retail_price_usd: details?.recommended_retail_price_usd || '',
          shelf_life: details?.shelf_life || '',
          hs_code: details?.hs_code || '',
          carton_width: details?.carton_width || '',
          carton_length: details?.carton_length || '',
          carton_height: details?.carton_height || '',
          net_weight: details?.net_weight || '',
          gross_weight: details?.gross_weight || '',
          country_of_origin: details?.country_of_origin || '',
          container_size: details?.container_size || '',
          cartons_per_container: details?.cartons_per_container || 0,
        });
        setIsNewRecord(!details);
      } catch (err: Error | unknown) {
        console.error('Error fetching export details:', err);
        setIsNewRecord(true);
        setExportDetails(null);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchExportDetails();
    }
  }, [product.id, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isNewRecord) {
        await createProductExportDetails({
          product_id: product.id,
          ...formData,
        });
      } else {
        await updateProductExportDetails(exportDetails!.id, formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg">
          <ClipLoader color="#36d7b7" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {isNewRecord ? 'Create' : 'Edit'} Product Export Details
        </h2>
        {isNewRecord && (
          <div className="text-red-500 mb-4">
            This product doesn't have export details yet. Please fill in the details below.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Pack Size per Carton</label>
              <input
                title="Pack Size per Carton"
                placeholder="Pack Size per Carton"
                type="number"
                className="w-full border rounded p-2"
                value={formData.pack_size_per_carton}
                onChange={(e) => setFormData({ ...formData, pack_size_per_carton: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">FOB Price per Carton</label>
              <input
                title="FOB Price per Carton"
                placeholder="FOB Price per Carton"
                type="text"
                className="w-full border rounded p-2"
                value={formData.fob_price_per_carton}
                onChange={(e) => setFormData({ ...formData, fob_price_per_carton: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Recommended Retail Price (USD)</label>
              <input
                title="Recommended Retail Price (USD)"
                placeholder="Recommended Retail Price (USD)"
                type="text"
                className="w-full border rounded p-2"
                value={formData.recommended_retail_price_usd}
                onChange={(e) => setFormData({ ...formData, recommended_retail_price_usd: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Shelf Life</label>
              <input
                title="Shelf Life"
                placeholder="Shelf Life"
                type="text"
                className="w-full border rounded p-2"
                value={formData.shelf_life}
                onChange={(e) => setFormData({ ...formData, shelf_life: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">HS Code</label>
              <input
                title="HS Code"
                placeholder="HS Code"
                type="text"
                className="w-full border rounded p-2"
                value={formData.hs_code}
                onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Carton Width</label>
              <input
                title="Carton Width"
                placeholder="Carton Width"
                type="text"
                className="w-full border rounded p-2"
                value={formData.carton_width}
                onChange={(e) => setFormData({ ...formData, carton_width: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Carton Length</label>
              <input
                title="Carton Length"
                placeholder="Carton Length"
                type="text"
                className="w-full border rounded p-2"
                value={formData.carton_length}
                onChange={(e) => setFormData({ ...formData, carton_length: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Carton Height</label>
              <input
                title="Carton Height"
                placeholder="Carton Height"
                type="text"
                className="w-full border rounded p-2"
                value={formData.carton_height}
                onChange={(e) => setFormData({ ...formData, carton_height: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Net Weight</label>
              <input
                title="Net Weight"
                placeholder="Net Weight"
                type="text"
                className="w-full border rounded p-2"
                value={formData.net_weight}
                onChange={(e) => setFormData({ ...formData, net_weight: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Gross Weight</label>
              <input
                title="Gross Weight"
                placeholder="Gross Weight"
                type="text"
                className="w-full border rounded p-2"
                value={formData.gross_weight}
                onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Country of Origin</label>
              <input
                title="Country of Origin"
                placeholder="Country of Origin"
                type="text"
                className="w-full border rounded p-2"
                value={formData.country_of_origin}
                onChange={(e) => setFormData({ ...formData, country_of_origin: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Container Size</label>
              <input
                title="Container Size"
                placeholder="Container Size"
                type="text"
                className="w-full border rounded p-2"
                value={formData.container_size}
                onChange={(e) => setFormData({ ...formData, container_size: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Cartons per Container</label>
              <input
                title="Cartons per Container"
                placeholder="Cartons per Container"
                type="number"
                className="w-full border rounded p-2"
                value={formData.cartons_per_container}
                onChange={(e) => setFormData({ ...formData, cartons_per_container: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
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
              {isNewRecord ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductExportModal;
