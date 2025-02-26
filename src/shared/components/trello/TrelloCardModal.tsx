import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createCardAttachment, deleteAttachment, getCardAttachments, getAttachmentUrl, CardAttachment } from './services/useCardAttachment';

interface TrelloCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: {
    title: string;
    description: string;
    colorCode?: string;
    attachments?: CardAttachment[];
  }) => void;
  card: {
    id: string;
    title: string;
    description?: string;
    colorCode?: string;
    attachments?: CardAttachment[];
  };
  isLoadingAttachments: boolean;
  userRole: string;
  readOnly?: boolean;
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
  card,
  isLoadingAttachments,
  userRole,
  readOnly = userRole !== 'manager',
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [colorCode, setColorCode] = useState(card.colorCode || '#ffffff');
  const [attachments, setAttachments] = useState<CardAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchAttachments = async () => {
      setIsUploading(true);
      try {
        const fetchedAttachments = await getCardAttachments(card.id);
        setAttachments(fetchedAttachments);
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
      } finally {
        setIsUploading(false);
      }
    };
    fetchAttachments();
  }, [card.id]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    console.log('Card ID:', card.id);
    console.log('Files to upload:', acceptedFiles);
    
    try {
      const uploadPromises = acceptedFiles.map(file => {
        return createCardAttachment(card.id, file, false);
      });
      const newAttachments = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('Failed to upload attachments:', error);
    } finally {
      setIsUploading(false);
    }
  }, [card.id]);

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
    onClose();
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const handleOpenAttachment = async (attachmentId: string) => {
    try {
      const url = await getAttachmentUrl(attachmentId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get attachment URL:', error);
    }
  };

  if (!isOpen) return null;

  if (isLoadingAttachments) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl p-6">
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title
            </label>
            <input
              title="Enter card title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              title="Enter card description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Color
            </label>
            <div className="flex items-center gap-4">
              <input
                title="Select card color"
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
            <div className="space-y-2 mb-4">
              {attachments.map((attachment) => (
                <div 
                  key={attachment.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <a
                      onClick={() => handleOpenAttachment(attachment.id)}
                      className="text-blue-500 hover:text-blue-600 cursor-pointer truncate"
                      title={attachment.file_url}
                    >
                      {attachment.file_url.split('_').length > 2 
                        ? attachment.file_url.split('_').slice(2).join('_')
                        : attachment.file_url}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-red-500 hover:text-red-600 flex-shrink-0 ml-2"
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
                  ${isUploading ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  {isUploading ? (
                    <p className="text-gray-600">Uploading...</p>
                  ) : (
                    <>
                      <p className="text-gray-600">
                        {isDragActive
                          ? 'Drop files here...'
                          : 'Drag & drop files here, or click to select files'
                        }
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports images, PDFs, and documents
                      </p>
                    </>
                  )}
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
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}; 