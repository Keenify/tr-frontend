import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { supabase } from '../../../lib/supabase';
import ImageUploadModal from '../modals/ImageUploadModal';

interface MediaToolbarProps {
  editor: Editor | null;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({ editor }) => {
  const [showImageModal, setShowImageModal] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;
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
    return data.publicUrl;
  };

  const handleImageUpload = async (file: File) => {
    if (editor) {
      try {
        const imageUrl = await uploadImage(file);
        editor.chain()
          .focus()
          .insertContent([
            {
              type: 'resizableImage',
              attrs: {
                src: imageUrl,
                width: '80%'
              }
            }
          ])
          .run();
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  return (
    <div className="relative flex gap-2">
      <button
        className="px-3 py-1 rounded bg-gray-200"
        onClick={() => setShowImageModal(true)}
      >
        Image
      </button>
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onUpload={handleImageUpload}
      />
    </div>
  );
};

export default MediaToolbar;
