import { useState } from 'react';
import { TrelloCard } from '../types/TrelloCard.types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CardModalProps {
  card: TrelloCard;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: Partial<TrelloCard>) => void;
}

const CardModal = ({ card, isOpen, onClose, onSave }: CardModalProps) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.due_date ? new Date(card.due_date) : null);
  const [colorCode, setColorCode] = useState(card.color_code || '#ffffff');

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

  return (
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
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
            >
              Cancel
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
  );
};

export default CardModal; 