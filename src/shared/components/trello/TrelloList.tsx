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
  onCardClick?: (cardId: string) => void;
  onTitleChange?: (newTitle: string) => void;
  onAddCard?: (title: string) => void;
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
 * @param {Function} onCardClick - Handler for card click events
 * @param {Function} onTitleChange - Handler for title change events
 * @param {Function} onAddCard - Handler for add card button click
 */

export const TrelloList: React.FC<TrelloListProps> = ({
  id,
  index,
  title,
  cards,
  onCardClick,
  onTitleChange,
  onAddCard
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [listTitle, setListTitle] = useState(title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

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

  return (
    <Draggable draggableId={`list-${id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-80"
        >
          <div className="bg-gray-100 rounded-lg p-4 flex flex-col h-full min-h-[150px]">
            {/* List Header with Drag Handle */}
            <div 
              {...provided.dragHandleProps}
              className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing select-none"
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
              <span className="bg-gray-200 px-2 py-1 rounded-full text-sm ml-2">
                {cards.length}
              </span>
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
                      onClick={() => onCardClick?.(card.id)}
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
          </div>
        </div>
      )}
    </Draggable>
  );
}; 