import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { supabase } from '../../../lib/supabase';

interface MediaToolbarProps {
  editor: Editor | null;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({ editor }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;

    try {
      const fileKey = `content/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileKey, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(fileKey);
      const publicUrl = data.publicUrl;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleImageUpload = async () => {
    if (editor && imageFile) {
      try {
        setIsUploading(true);
        const imageUrl = await uploadImage(imageFile);
        editor.chain()
          .focus()
          .insertContent([
            {
              type: 'resizableImage',
              attrs: {
                src: imageUrl,
                width: '60%'
              }
            }
          ])
          .run();
        setImageFile(null);
        setShowImageModal(false);
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

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

  const handleCloseModal = () => {
    setShowImageModal(false);
    setImagePreview(null);
    setImageFile(null);
  };

  return (
    <div className="relative flex gap-2">
      <button
        className="px-3 py-1 rounded bg-gray-200"
        onClick={() => setShowImageModal(true)}
      >
        Image
      </button>
      {showImageModal && (
        <div className="absolute left-0 top-full mt-1 z-50">
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
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleImageUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Add Image'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaToolbar;
