import { useState, useEffect } from "react";
import { TrelloCard, TrelloCardAttachment } from "../types/TrelloCard.types";
import {
  deleteTrelloCard,
  getTrelloCardAttachments,
  getTrelloCardAttachmentUrl,
  deleteTrelloCardAttachment,
} from "../services/useTrelloCards";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AttachmentUploadModal from "./AttachmentUploadModal";

interface CardModalProps {
  card: TrelloCard;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: Partial<TrelloCard>) => void;
  onDeleteSuccess: () => void;
}

// New ConfirmationModal component
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
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

const CardModal: React.FC<CardModalProps> = ({
  card,
  isOpen,
  onClose,
  onSave,
  onDeleteSuccess,
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.due_date ? new Date(card.due_date) : null
  );
  const [colorCode, setColorCode] = useState(card.color_code || "#ffffff");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachments, setAttachments] = useState<TrelloCardAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchAttachments = async () => {
        setLoadingAttachments(true);
        const fetchedAttachments = await getTrelloCardAttachments(card.id);
        setAttachments(fetchedAttachments);
        setLoadingAttachments(false);
      };
      fetchAttachments();
    }
  }, [isOpen, card.id]);

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
      console.log("Card deleted successfully");
      onDeleteSuccess();
      onClose();
    } else {
      console.error("Failed to delete card");
    }
    setIsDeleting(false);
    setShowConfirmModal(false);
  };

  const handleAddAttachment = () => {
    setShowAttachmentModal(true);
  };

  const updateAttachments = async () => {
    const fetchedAttachments = await getTrelloCardAttachments(card.id);
    setAttachments(fetchedAttachments);
  };

  const handleAttachmentClick = async (attachmentId: string) => {
    try {
      const url = await getTrelloCardAttachmentUrl(attachmentId);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Failed to fetch attachment URL", error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const success = await deleteTrelloCardAttachment(attachmentId);
      if (success) {
        console.log("Attachment deleted successfully");
        updateAttachments();
      } else {
        console.error("Failed to delete attachment");
      }
    } catch (error) {
      console.error("Error deleting attachment", error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
          {loadingAttachments ? (
            <div className="flex justify-center items-center h-full">
              <div className="loader">Loading...</div>
            </div>
          ) : (
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
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <DatePicker
                    selected={dueDate}
                    onChange={(date) => setDueDate(date)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    dateFormat="yyyy-MM-dd"
                    isClearable
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Color
                  </label>
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

                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-2">Attachments</h3>
                  <ul>
                    {attachments.map((attachment) => (
                      <li key={attachment.id} className="flex justify-between items-center">
                        <span
                          onClick={() => handleAttachmentClick(attachment.id)}
                          className="cursor-pointer text-blue-500 hover:underline"
                        >
                          {attachment.file_url.split('/').pop()}
                        </span>
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          style={{
                            color: '#f56565',
                            transition: 'transform 0.2s, color 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = '#c53030';
                            e.currentTarget.style.transform = 'scale(1.2)'; // Increased scale for better visibility
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = '#f56565';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {showAttachmentModal && (
          <div className="absolute right-0 top-0 bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <AttachmentUploadModal
              isOpen={showAttachmentModal}
              onClose={() => setShowAttachmentModal(false)}
              cardId={card.id}
              onUploadSuccess={updateAttachments}
            />
          </div>
        )}
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
