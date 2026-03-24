import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { uploadFileToR2, getPublicUrl } from '../../../services/storageService';
import ImageUploadModal from '../modals/ImageUploadModal';

interface MediaToolbarProps {
  editor: Editor | null;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({ editor }) => {
  const [showImageModal, setShowImageModal] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    const fileKey = await uploadFileToR2(file, 'content-image', 'content');
    return getPublicUrl('content-image', fileKey);
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
