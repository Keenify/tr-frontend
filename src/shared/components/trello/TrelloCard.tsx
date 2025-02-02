import React, { useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { deleteCard } from './services/useCard';
import { getCardAttachments, CardAttachment } from './services/useCardAttachment';
import { TrelloCardModal } from './TrelloCardModal';

interface TrelloCardProps {
  id: string;
  index: number;
  title: string;
  description?: string;
  colorCode?: string;
  thumbnailUrl?: string;
  onClick?: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedCard: {
    id: string;
    title: string;
    description?: string;
    colorCode?: string;
    attachments?: CardAttachment[];
  }) => void;
  userRole: string;
}

/**
 * TrelloCard Component
 * 
 * Responsibility:
 * - Represents a draggable card in the Trello-like board
 * - Manages drag state and interactions
 * - Provides visual feedback during drag operations
 * 
 * Features:
 * - Draggable functionality
 * - Visual feedback during drag (rotation, shadow, highlight)
 * - Handles click vs drag detection
 * - Displays card content (title, description, thumbnail)
 * - Custom color support
 * - Prevents text selection during drag
 * 
 * Props:
 * @param {string} id - Unique identifier for the card
 * @param {number} index - Position in the list
 * @param {string} title - Card title
 * @param {string} description - Optional card description
 * @param {string} colorCode - Optional background color
 * @param {string} thumbnailUrl - Optional thumbnail image URL
 * @param {Function} onClick - Handler for card click
 * @param {Function} onDelete - Handler for card deletion
 * @param {Function} onUpdate - Handler for card update
 * @param {string} userRole - User role for permissions
 */
export const TrelloCard: React.FC<TrelloCardProps> = ({
  id,
  index,
  title,
  description,
  colorCode,
  thumbnailUrl,
  onDelete,
  onUpdate,
  userRole,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [cardAttachments, setCardAttachments] = useState<CardAttachment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canManageCard = userRole === 'manager';

  // Prevent page scroll when dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      const deltaX = Math.abs(e.clientX - dragStartPosition.x);
      const deltaY = Math.abs(e.clientY - dragStartPosition.y);
      
      // If moved more than 5px in any direction, consider it a drag
      if (deltaX > 5 || deltaY > 5) {
        setIsDragging(true);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const success = await deleteCard(id);
      if (success) {
        setShowDeleteModal(false);
        // Ensure onDelete is called to trigger list refresh
        if (onDelete) {
          onDelete();
        }
      } else {
        console.error('Failed to delete card');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();  // Stop event from bubbling up
    setShowMenu(!showMenu);
  };

  const handleCardClick = async () => {
    if (!isDragging) {
      setIsModalOpen(true);
      setIsLoadingAttachments(true);
      try {
        if (!id.startsWith('temp-')) {
          const attachments = await getCardAttachments(id);
          setCardAttachments(attachments);
        }
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
        setCardAttachments([]);
      } finally {
        setIsLoadingAttachments(false);
      }
    }
  };

  return (
    <>
      <Draggable draggableId={`card-${id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`
              relative
              bg-white rounded p-3 mb-2
              cursor-pointer hover:bg-gray-50 
              transition-all duration-200 ease-in-out
              ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-3 z-50 ring-2 ring-blue-500 bg-blue-50' : ''}
              ${isDragging ? 'rotate-2 shadow-lg ring-1 ring-blue-400 bg-blue-50/50' : 'shadow-sm'}
              select-none
            `}
            style={{
              backgroundColor: colorCode || 'white',
              ...provided.draggableProps.style,
              transformOrigin: 'center',
              touchAction: 'none',
            }}
            onClick={!isDragging ? handleCardClick : undefined}
          >
            {/* Replace edit button with role-based icon */}
            <button
              title={canManageCard ? "Edit card" : "Read only"}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 z-10"
              onClick={canManageCard ? handleMenuClick : undefined}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {canManageCard ? (
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute top-8 right-2 bg-white shadow-lg rounded-md py-1 z-50">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={handleDeleteClick}
                >
                  Delete
                </button>
              </div>
            )}

            <div
              {...provided.dragHandleProps}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full pr-6" // Added right padding for edit button
            >
              {thumbnailUrl && (
                <img 
                  src={thumbnailUrl} 
                  alt="Card thumbnail" 
                  className="w-full h-32 object-cover mb-2 rounded select-none"
                  draggable={false}
                />
              )}
              <h3 className="font-medium text-gray-900 select-none truncate">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1 select-none line-clamp-2">{description}</p>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium mb-4">Delete Card</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this card? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <TrelloCardModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          onSave={(updatedCard) => {
            setCardAttachments(updatedCard.attachments || []);
            if (onUpdate) {
              onUpdate({
                id,
                title: updatedCard.title,
                description: updatedCard.description,
                colorCode: updatedCard.colorCode,
                attachments: updatedCard.attachments
              });
            }
            setIsModalOpen(false);
          }}
          card={{
            id,
            title,
            description,
            colorCode,
            attachments: cardAttachments
          }}
          isLoadingAttachments={isLoadingAttachments}
          userRole={userRole}
          readOnly={!canManageCard}
        />
      )}
    </>
  );
}; 