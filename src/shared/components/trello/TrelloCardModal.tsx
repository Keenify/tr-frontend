import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface TrelloCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: {
    title: string;
    description: string;
    colorCode?: string;
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
    }>;
  }) => void;
  card: {
    id: string;
    title: string;
    description?: string;
    colorCode?: string;
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
    }>;
  };
}

/**
 * TrelloCardModal Component
 * 
 * Responsibility:
 * - Provides a modal interface for editing card details
 * - Manages form state for card editing
 * - Handles card updates
 * 
 * Features:
 * - Edit card title
 * - Edit card description
 * - Color picker for card background
 * - Form validation
 * - Save and cancel actions
 * - Modal overlay with backdrop
 * 
 * Props:
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Handler for modal close action
 * @param {Function} onSave - Handler for save action with updated card data
 * @param {Object} card - Current card data for editing
 */

export const TrelloCardModal: React.FC<TrelloCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  card
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [colorCode, setColorCode] = useState(card.colorCode || '#ffffff');
  const [attachments, setAttachments] = useState(card.attachments || []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newAttachments = acceptedFiles.map(file => ({
      id: `attachment-${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      colorCode,
      attachments
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="w-12 h-12 p-1 rounded border"
              />
              <input
                type="text"
                value={colorCode}
                onChange={(e) => {
                  const hex = e.target.value;
                  if (hex.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                    setColorCode(hex);
                  }
                }}
                placeholder="#000000"
                className="px-3 py-2 border rounded-md w-32"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Attachments
            </label>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div 
                  key={attachment.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{attachment.name}</span>
                    <a 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      View
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <div
                {...getRootProps()}
                className={`
                  w-full py-8 px-3 border-2 border-dashed rounded-md 
                  transition-colors duration-200 cursor-pointer
                  ${isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <p className="text-gray-600">
                    {isDragActive
                      ? 'Drop files here...'
                      : 'Drag & drop files here, or click to select files'
                    }
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports images, PDFs, and documents
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 