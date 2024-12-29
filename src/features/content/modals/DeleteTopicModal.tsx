import React from 'react';

interface DeleteTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  topicTitle: string;
}

/**
 * Modal component for confirming topic deletion
 */
const DeleteTopicModal: React.FC<DeleteTopicModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  topicTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Delete Topic</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to permanently delete {topicTitle}?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTopicModal; 