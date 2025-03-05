import React, { useState } from 'react';
import { TrelloCard } from './TrelloCard';
import { StrictModeDroppable } from './StrictModeDroppable';
import { Draggable } from 'react-beautiful-dnd';
import { CardAttachment } from './services/useCardAttachment';
import { Card } from './types/card.types';
import { Employee } from '@/shared/types/directory.types';

interface TrelloListProps {
  id: string;
  index: number;
  title: string;
  country?: string;
  cards: Array<{
    id: string;
    title: string;
    description?: string;
    colorCode?: string;
    thumbnailUrl?: string;
    assignees?: string[];
    attachments?: CardAttachment[];
  }>;
  onTitleChange?: (newTitle: string) => void;
  onCountryChange?: (newCountry: string) => void;
  onAddCard?: (title: string) => void;
  onCardDelete?: (cardId: string) => void;
  onDelete?: () => void;
  onCardUpdate?: (cardId: string, updates: {
    id: string;
    title: string;
    description?: string;
    colorCode?: string;
    attachments?: CardAttachment[];
  }) => void;
  userRole: string;
  searchTerm?: string;
  onCardClick?: (card: Card) => void;
  employees: Employee[];
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
 * @param {string} country - List country
 * @param {Array} cards - Array of card objects
 * @param {Function} onTitleChange - Handler for title change events
 * @param {Function} onCountryChange - Handler for country change events
 * @param {Function} onAddCard - Handler for add card button click
 * @param {Function} onCardDelete - Handler for card delete events
 * @param {Function} onDelete - Handler for list delete events
 * @param {Function} onCardUpdate - Handler for card update events
 * @param {string} userRole - User role for permissions
 * @param {string} searchTerm - Search term for filtering cards
 * @param {Function} onCardClick - Handler for card click events
 * @param {Array} employees - Array of employee objects
 */

export const TrelloList: React.FC<TrelloListProps> = ({
  id,
  index,
  title,
  country = '',
  cards,
  onTitleChange,
  onCountryChange,
  onAddCard,
  onCardDelete,
  onDelete,
  onCardUpdate,
  userRole,
  searchTerm = '',
  onCardClick,
  employees = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [listTitle, setListTitle] = useState(title);
  const [listCountry, setListCountry] = useState(country);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const canManageList = userRole === 'manager';

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTitleSubmit = () => {
    if (onTitleChange) {
      onTitleChange(listTitle);
    }
    setIsEditing(false);
  };

  const handleCountrySubmit = async () => {
    if (onCountryChange) {
      try {
        await onCountryChange(listCountry);
        showToast('Country updated successfully', 'success');
      } catch (error) {
        console.error('Failed to update country:', error);
        showToast('Failed to update country', 'error');
        // Reset to original value on error
        setListCountry(country);
      }
    }
    setIsEditingCountry(false);
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

  // Filter cards based on search term - now including assignees
  const filteredCards = searchTerm 
    ? cards.filter(card => {
        // Search in title and description
        const titleMatch = card.title.toLowerCase().includes(searchTerm.toLowerCase());
        const descriptionMatch = card.description && card.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Search in assignees
        const assigneeMatch = card.assignees && card.assignees.some(assignee => {
          // Handle both string IDs and object format
          const assigneeId = typeof assignee === 'string' 
            ? assignee 
            : (assignee as { employee_id: string }).employee_id;
          
          const employee = employees.find(emp => emp.id === assigneeId);
          
          // Match against employee name or email
          return employee && (
            (employee.first_name && employee.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (employee.last_name && employee.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        });
        
        return titleMatch || descriptionMatch || assigneeMatch;
      })
    : cards;

  // Don't render the list at all if searching and no matches found
  if (searchTerm && filteredCards.length === 0) {
    return null;
  }

  return (
    <Draggable draggableId={`list-${id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-80"
        >
          <div className="bg-gray-100 rounded-lg p-4 flex flex-col h-full min-h-[150px] relative">
            {/* Toast notification */}
            {toast && (
              <div 
                className={`absolute top-2 right-2 left-2 px-4 py-2 rounded-md shadow-lg z-50 transition-all duration-300 text-white text-sm
                  ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
              >
                {toast.message}
              </div>
            )}
            
            {/* List Header with Drag Handle and Menu */}
            <div 
              {...provided.dragHandleProps}
              className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing select-none relative"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-shrink-0 text-gray-400">
                  ⋮⋮
                </div>
                {isEditing ? (
                  <input
                    title="Enter list title"
                    type="text"
                    value={listTitle}
                    onChange={(e) => setListTitle(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyPress={(e) => e.key === 'Enter' && handleTitleSubmit()}
                    className="px-2 py-1 rounded border border-gray-300 w-full"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h2 
                      className="font-semibold text-gray-700 cursor-pointer break-words w-full"
                      onClick={() => canManageList && setIsEditing(true)}
                      title={listTitle}
                    >
                      {listTitle}
                    </h2>
                    {!canManageList && (
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-sm">
                  {filteredCards.length}
                </span>
                {canManageList && (
                  <div className="relative">
                    <button
                      title="Open list menu"
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
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          onClick={() => {
                            setShowMenu(false);
                            setIsEditingCountry(true);
                          }}
                        >
                          Edit Country
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          onClick={handleDeleteClick}
                        >
                          Delete List
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Country Editor */}
            {isEditingCountry && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-full">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setListCountry("SG")}
                        className={`flex-1 px-3 py-2 rounded-md border ${
                          listCountry === "SG" 
                            ? "bg-blue-50 border-blue-300 text-blue-700" 
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        SG
                      </button>
                      <button
                        type="button"
                        onClick={() => setListCountry("MY")}
                        className={`flex-1 px-3 py-2 rounded-md border ${
                          listCountry === "MY" 
                            ? "bg-blue-50 border-blue-300 text-blue-700" 
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        MY
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleCountrySubmit}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCountry(false);
                      setListCountry(country);
                    }}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Country Display (when not editing) */}
            {!isEditingCountry && country && (
              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    <path d="M2 12h20" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                    {country}
                  </span>
                </div>
              </div>
            )}

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
                    ${filteredCards.length === 0 ? 'border-2 border-dashed border-gray-300' : ''}
                  `}
                >
                  {filteredCards.map((card, cardIndex) => (
                    <TrelloCard
                      key={card.id}
                      {...card}
                      index={cardIndex}
                      onDelete={() => onCardDelete?.(card.id)}
                      onUpdate={(updatedCard) => onCardUpdate?.(card.id, {
                        ...updatedCard,
                        title: updatedCard.title || card.title
                      })}
                      userRole={userRole}
                      onClick={() => onCardClick?.(card)}
                      employees={employees}
                      assignees={card.assignees || []}
                      attachments={card.attachments || []}
                    />
                  ))}
                  {dropProvided.placeholder}
                  {filteredCards.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      {searchTerm ? 'No matching cards or assignees' : 'Drop cards here'}
                    </div>
                  )}
                </div>
              )}
            </StrictModeDroppable>

            {/* Add Card Form/Button - Only show when not searching */}
            {!searchTerm && (
              <>
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
              </>
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