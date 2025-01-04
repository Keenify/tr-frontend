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

  const uploadImage = async (file: File): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;

    try {
      const fileKey = `content/${Date.now()}_${file.name}`;

      // Upload the file to Supabase Storage
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

      // Generate a public URL for the uploaded file
      const { data } = supabase.storage.from(bucketName).getPublicUrl(fileKey);
      const publicUrl = data.publicUrl;

      console.log(data);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleImageUpload = async () => {
    if (editor && imageFile) {
      const imageUrl = await uploadImage(imageFile);
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageFile(null);
      setShowImageModal(false);
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

  return (
    <div className="flex gap-2">
      <button
        className="px-3 py-1 rounded bg-gray-200"
        onClick={() => setShowImageModal(true)}
      >
        Image
      </button>
      {showImageModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
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
                onClick={() => setShowImageModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleImageUpload}
              >
                Add Image
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add more media toolbar items as needed */}
    </div>
  );
};

export default MediaToolbar;
