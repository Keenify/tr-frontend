import React, { useState } from 'react';
import { Editor } from '@tiptap/react';

interface MediaToolbarProps {
  editor: Editor | null;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({ editor }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleImageUpload = () => {
    if (editor && imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageModal(false);
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Add Image</h2>
            <div className="mb-4">
              <label htmlFor="imageUrl" className="block mb-1">
                Image URL:
              </label>
              <input
                type="text"
                id="imageUrl"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            {imageUrl && (
              <div className="mb-4">
                <img src={imageUrl} alt="Preview" className="max-w-full h-auto" />
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
