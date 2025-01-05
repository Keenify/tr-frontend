import React, { useState } from 'react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleUpload = async () => {
    if (imageFile) {
      setIsUploading(true);
      try {
        await onUpload(imageFile);
        onClose();
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[101]">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[500px]">
        <h2 className="text-xl font-bold mb-4">Add Image</h2>
        <div className="mb-4">
          <label htmlFor="imageFile" className="block mb-1">
            Image File:
          </label>
          <input
            type="file"
            id="imageFile"
            className="w-full px-3 py-2 border border-gray-300 rounded"
            onChange={handleImageChange}
          />
        </div>
        {imagePreview && (
          <div className="mb-4 flex justify-center">
            <img src={imagePreview} alt="Image Preview" className="max-w-full max-h-64 object-contain" />
          </div>
        )}
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Add Image'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal; 