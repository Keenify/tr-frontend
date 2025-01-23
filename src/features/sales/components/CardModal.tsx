import { useState } from 'react';
import { TrelloCard } from '../types/TrelloCard.types';
import { deleteTrelloCard } from '../services/useTrelloCards';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CardModalProps {
  card: TrelloCard;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: Partial<TrelloCard>) => void;
  onDeleteSuccess: () => void;
}

// New ConfirmationModal component
const ConfirmationModal: React.FC<{ isOpen: boolean; onConfirm: () => void; onCancel: () => void }> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
        <p className="mb-6">Are you sure you want to delete this card?</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const CardModal: React.FC<CardModalProps> = ({ card, isOpen, onClose, onSave, onDeleteSuccess }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.due_date ? new Date(card.due_date) : null);
  const [colorCode, setColorCode] = useState(card.color_code || '#ffffff');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      due_date: dueDate?.toISOString() || null,
      color_code: colorCode,
    });
    onClose();
  };

  const handleDelete = async () => {
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const success = await deleteTrelloCard(card.id);
    if (success) {
      console.log('Card deleted successfully');
      onDeleteSuccess();
      onClose();
    } else {
      console.error('Failed to delete card');
    }
    setIsDeleting(false);
    setShowConfirmModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Card</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <DatePicker
                  selected={dueDate}
                  onChange={(date) => setDueDate(date)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  dateFormat="yyyy-MM-dd"
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="mt-1"
                  />
                  <input
                    type="text"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  );
};

export default CardModal; 