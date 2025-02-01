import React from 'react';
import { ProductVariant } from '../../../shared/types/Product';
import { deleteProductVariant, updateProductVariant } from '../../../services/useProductVariants';

interface EditVariantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; image?: File }) => void;
    onDelete?: () => void;
    variant: ProductVariant;
}

const EditVariantModal: React.FC<EditVariantModalProps> = ({ isOpen, onClose, onSubmit, onDelete, variant }) => {
    const [name, setName] = React.useState(variant.name);
    const [image, setImage] = React.useState<File | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Reset form state when variant changes
    React.useEffect(() => {
        setName(variant.name);
        setImage(null);
    }, [variant]);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImage(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProductVariant(variant.id, { name, image: image || undefined });
            onSubmit({ name, image: image || undefined });
            setImage(null);
            onClose();
        } catch (error) {
            console.error('Failed to update variant:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this variant?')) {
            try {
                await deleteProductVariant(variant.id);
                onDelete?.();
                onClose();
            } catch (error) {
                console.error('Failed to delete variant:', error);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Edit Variant</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Variant Name</label>
                        <input
                            title="Enter variant name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Image</label>
                        <div
                            onClick={handleClick}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                                ${image || variant.image_url ? 'bg-gray-50' : ''}`}
                        >
                            <input
                                title="Upload variant image"
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            {image ? (
                                <div className="space-y-2">
                                    <img
                                        src={URL.createObjectURL(image)}
                                        alt="New variant preview"
                                        className="mx-auto h-24 object-cover rounded-md"
                                    />
                                    <p className="text-sm text-gray-500">{image.name}</p>
                                </div>
                            ) : variant.image_url ? (
                                <div className="space-y-2">
                                    <img
                                        src={variant.image_url}
                                        alt="Current variant"
                                        className="mx-auto h-24 object-cover rounded-md"
                                    />
                                    <p className="text-sm text-gray-500">Current image</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="text-sm text-gray-600">
                                        <span className="text-blue-500 hover:text-blue-600">Click to upload</span> or drag and drop
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between gap-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                        >
                            Delete
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVariantModal; 