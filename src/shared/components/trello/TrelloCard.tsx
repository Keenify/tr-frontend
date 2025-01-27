import React, { useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { deleteCard } from './services/useCard';

interface TrelloCardProps {
  id: string;
  index: number;
  title: string;
  description?: string;
  colorCode?: string;
  thumbnailUrl?: string;
  onClick?: () => void;
  onDelete?: () => void;
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
 */
export const TrelloCard: React.FC<TrelloCardProps> = ({
  id,
  index,
  title,
  description,
  colorCode,
  thumbnailUrl,
  onClick,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
    e.stopPropagation();
    setShowMenu(!showMenu);
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
            onClick={!isDragging ? onClick : undefined}
          >
            {/* Add menu button */}
            <button
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
              onClick={handleMenuClick}
            >
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 16 16">
                <circle cx="8" cy="2" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="14" r="1.5" />
              </svg>
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
              className="w-full h-full"
            >
              {thumbnailUrl && (
                <img 
                  src={thumbnailUrl} 
                  alt="Card thumbnail" 
                  className="w-full h-32 object-cover mb-2 rounded select-none"
                  draggable={false}
                />
              )}
              <h3 className="font-medium text-gray-900 select-none">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1 select-none">{description}</p>
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
    </>
  );
}; 