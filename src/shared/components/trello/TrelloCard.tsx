import React, { useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { deleteCard } from './services/useCard';
import { getCardAttachments, CardAttachment } from './services/useCardAttachment';
import { TrelloCardModal } from './TrelloCardModal';
import { Card, CardUpdate } from './types/card.types';
import { Employee } from '@/shared/types/directory.types';

interface TrelloCardProps {
  id: string;
  index: number;
  title: string;
  description?: string;
  colorCode?: string;
  thumbnailUrl?: string;
  assignees?: string[];
  onClick?: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedCard: CardUpdate & { id: string }) => void;
  userRole: string;
  onCardClick?: (card: Card) => void;
  employees: Employee[];
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
 * @param {string[]} assignees - Array of assignee IDs
 * @param {Function} onClick - Handler for card click
 * @param {Function} onDelete - Handler for card deletion
 * @param {Function} onUpdate - Handler for card update
 * @param {string} userRole - User role for permissions
 * @param {Function} onCardClick - Handler for card click
 * @param {Employee[]} employees - Array of employees
 */
export const TrelloCard: React.FC<TrelloCardProps> = ({
  id,
  index,
  title,
  description,
  colorCode,
  thumbnailUrl,
  assignees = [],
  onDelete,
  onUpdate,
  userRole,
  onCardClick,
  employees = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [cardAttachments, setCardAttachments] = useState<CardAttachment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canManageCard = true; // Everyone can edit

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
      if (onCardClick) {
        // Create a Card object using the Card interface
        const card: Card = {
          id,
          title,
          description,
          colorCode,
          thumbnailUrl,
          assignees
        };
        onCardClick(card);
      } else {
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
    }
  };

  // Find employee data for assignees
  const assigneeEmployees = assignees
    .map(assignee => {
      // Handle both string IDs and object format with employee_id
      const employeeId = typeof assignee === 'string' 
        ? assignee 
        : (assignee as { employee_id: string }).employee_id;
      
      return employees.find(emp => emp.id === employeeId);
    })
    .filter(Boolean) as Employee[];

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
              group
            `}
            style={{
              backgroundColor: colorCode || 'white',
              ...provided.draggableProps.style,
              transformOrigin: 'center',
              touchAction: 'none',
            }}
            onClick={!isDragging ? handleCardClick : undefined}
          >
            {/* Replace edit button with edit icon that only appears on hover */}
            <button
              title="Edit card"
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={handleMenuClick}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
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
              
              {/* Assignees section - Make sure this is visible */}
              {assignees && assignees.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {assigneeEmployees.slice(0, 3).map((employee, i) => (
                    <div 
                      key={`${employee?.id || i}`}
                      className="flex-shrink-0 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                      title={employee?.first_name || employee?.email || 'Assignee'}
                    >
                      {employee?.first_name || employee?.email?.split('@')[0] || 'Assignee'}
                    </div>
                  ))}
                  
                  {/* Show count for additional assignees */}
                  {assignees.length > 3 && (
                    <div className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium" title={`${assignees.length - 3} more assignees`}>
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>
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
            console.log('Card updated with assignees:', updatedCard.assignees);
            if (onUpdate) {
              onUpdate({
                id,
                title: updatedCard.title || title,
                description: updatedCard.description,
                colorCode: updatedCard.colorCode,
                assignees: updatedCard.assignees
              });
            }
            setIsModalOpen(false);
          }}
          card={{
            id,
            title,
            description,
            colorCode,
            assignees,
            attachments: cardAttachments
          }}
          isLoadingAttachments={isLoadingAttachments}
          userRole={userRole}
          readOnly={!canManageCard}
          employees={employees}
        />
      )}
    </>
  );
}; 