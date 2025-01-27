import React, { useState } from 'react';
import { TrelloCard } from './TrelloCard';
import { StrictModeDroppable } from './StrictModeDroppable';
import { Draggable } from 'react-beautiful-dnd';

interface TrelloListProps {
  id: string;
  index: number;
  title: string;
  cards: Array<{
    id: string;
    title: string;
    description?: string;
    colorCode?: string;
    thumbnailUrl?: string;
  }>;
  onTitleChange?: (newTitle: string) => void;
  onAddCard?: (title: string) => void;
  onCardDelete?: (cardId: string) => void;
  onDelete?: () => void;
  onCardUpdate?: (cardId: string, updates: any) => void;
}

/**
 * TrelloList Component
 * 
 * Responsibility:
 * - Represents a column/list in the Trello-like board
 * - Manages the droppable area for cards
 * - Handles list title editing
 * - Displays card count
 * - Contains multiple TrelloCard components
 * 
 * Features:
 * - Editable title with inline editing
 * - Visual feedback for drag and drop operations
 * - Card counter badge
 * - Add card button
 * - Droppable area for cards
 * 
 * Props:
 * @param {string} id - Unique identifier for the list
 * @param {number} index - Index of the list in the board
 * @param {string} title - List title
 * @param {Array} cards - Array of card objects
 * @param {Function} onTitleChange - Handler for title change events
 * @param {Function} onAddCard - Handler for add card button click
 * @param {Function} onCardDelete - Handler for card delete events
 * @param {Function} onDelete - Handler for list delete events
 * @param {Function} onCardUpdate - Handler for card update events
 */

export const TrelloList: React.FC<TrelloListProps> = ({
  id,
  index,
  title,
  cards,
  onTitleChange,
  onAddCard,
  onCardDelete,
  onDelete,
  onCardUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [listTitle, setListTitle] = useState(title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleTitleSubmit = () => {
    if (onTitleChange) {
      onTitleChange(listTitle);
    }
    setIsEditing(false);
  };

  const handleAddCardClick = () => {
    setIsAddingCard(true);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardTitle.trim() && onAddCard) {
     onAddCard(newCardTitle);
      setNewCardTitle('');
    }
    setIsAddingCard(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (onDelete) {
        await onDelete();
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting list:', error);
      // Optionally show an error message to the user
    }
  };

  return (
    <Draggable draggableId={`list-${id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-80"
        >
          <div className="bg-gray-100 rounded-lg p-4 flex flex-col h-full min-h-[150px]">
            {/* List Header with Drag Handle and Menu */}
            <div 
              {...provided.dragHandleProps}
              className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing select-none relative"
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-shrink-0 text-gray-400">
                  ⋮⋮
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={listTitle}
                    onChange={(e) => setListTitle(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyPress={(e) => e.key === 'Enter' && handleTitleSubmit()}
                    className="px-2 py-1 rounded border border-gray-300 w-full"
                    autoFocus
                  />
                ) : (
                  <h2 
                    className="font-semibold text-gray-700 cursor-pointer"
                    onClick={() => setIsEditing(true)}
                  >
                    {listTitle}
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-sm">
                  {cards.length}
                </span>
                <div className="relative">
                  <button
                    className="p-1 rounded-full hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                  >
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 16 4">
                      <circle cx="2" cy="2" r="1.5" />
                      <circle cx="8" cy="2" r="1.5" />
                      <circle cx="14" cy="2" r="1.5" />
                    </svg>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md py-1 z-50 min-w-[100px]">
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        onClick={handleDeleteClick}
                      >
                        Delete List
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cards Container */}
            <StrictModeDroppable droppableId={`list-${id}`} type="card">
              {(dropProvided, snapshot) => (
                <div
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                  className={`
                    flex-grow
                    flex flex-col
                    min-h-[100px]
                    ${snapshot.isDraggingOver ? 'bg-gray-200/50' : 'bg-gray-100'}
                    rounded-lg
                    transition-colors
                    duration-200
                    ${cards.length === 0 ? 'border-2 border-dashed border-gray-300' : ''}
                  `}
                >
                  {cards.map((card, cardIndex) => (
                    <TrelloCard
                      key={card.id}
                      {...card}
                      index={cardIndex}
                      onDelete={() => onCardDelete?.(card.id)}
                      onUpdate={(updatedCard) => onCardUpdate?.(card.id, updatedCard)}
                    />
                  ))}
                  {dropProvided.placeholder}
                  {cards.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Drop cards here
                    </div>
                  )}
                </div>
              )}
            </StrictModeDroppable>

            {/* Add Card Form/Button */}
            {isAddingCard ? (
              <form onSubmit={handleCardSubmit} className="mt-2">
                <textarea
                  autoFocus
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Enter a title for this card..."
                  className="w-full p-2 rounded border border-gray-300 shadow-sm min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCardSubmit(e);
                    }
                    if (e.key === 'Escape') {
                      setIsAddingCard(false);
                      setNewCardTitle('');
                    }
                  }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Card
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCard(false);
                      setNewCardTitle('');
                    }}
                    className="px-2 py-1.5 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={handleAddCardClick}
                className="mt-2 w-full py-2 px-3 text-gray-600 hover:bg-gray-200 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>+</span>
                Add a Card
              </button>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                  <h3 className="text-lg font-medium mb-4">Delete List</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this list and all its cards? This action cannot be undone.
                  </p>
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
          </div>
        </div>
      )}
    </Draggable>
  );
}; 