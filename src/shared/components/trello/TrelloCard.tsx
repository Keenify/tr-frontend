import React, { useState, useEffect, useMemo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { deleteCard } from './services/useCard';
import { getCardAttachments, CardAttachment, getAttachmentUrl } from './services/useCardAttachment';
import { TrelloCardModal } from './TrelloCardModal';
import { Card, CardUpdate } from './types/card.types';
import { Label } from '../../types/label.types';
import { Employee } from '@/shared/types/directory.types';
import { useUserAndCompanyData } from '../../hooks/useUserAndCompanyData';
import { logDeletion } from '../../services/deletionLogService';
import '../../styles/TrelloCardDescription.css';

// Safe HTML renderer component
const HtmlContent: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  // Basic HTML sanitization to prevent XSS
  const sanitizeHtml = (htmlContent: string): string => {
    // Create a new DOM parser
    const parser = new DOMParser();
    // Parse the HTML content
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Get the body content - this removes <script> tags
    const sanitized = doc.body.innerHTML;
    
    // Additional cleanup for card preview
    // Strip some excessive formatting that might break the card layout
    return sanitized
      .replace(/<iframe.*?<\/iframe>/gi, '[embedded content]')
      .replace(/<table.*?<\/table>/gi, '[table]')
      .replace(/<form.*?<\/form>/gi, '')
      .replace(/<button.*?<\/button>/gi, '')
      .replace(/<input.*?>/gi, '')
      .replace(/<textarea.*?<\/textarea>/gi, '');
  };
  
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
};

interface TrelloCardProps {
  id: string;
  index: number;
  title: string;
  description?: string;
  colorCode?: string;
  thumbnailUrl?: string;
  assignees?: string[];
  attachmentCount?: number;
  start_date?: string;
  end_date?: string;
  onClick?: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedCard: CardUpdate & { 
    id: string; 
    title: string; 
  }) => void;
  userRole: string;
  onCardClick?: (card: Card) => void;
  employees: Employee[];
  userId?: string;
  is_locked: boolean;
  locked_by: string;
  labels?: Label[];
  labelIds?: string[];
  companyLabels?: Label[];
  boardModule?: string;
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
 * @param {number} attachmentCount - Count of card attachments
 * @param {string} start_date - Optional start date
 * @param {string} end_date - Optional end date
 * @param {Function} onClick - Handler for card click
 * @param {Function} onDelete - Handler for card deletion
 * @param {Function} onUpdate - Handler for card update
 * @param {string} userRole - User role for permissions
 * @param {Function} onCardClick - Handler for card click
 * @param {Employee[]} employees - Array of employees
 * @param {string} userId - User ID for permissions and data fetching
 * @param {boolean} is_locked - Indicates if the card is locked
 * @param {string} locked_by - ID of the user who locked the card
 * @param {Label[]} labels - Array of labels for the card
 * @param {string[]} labelIds - Array of label IDs for the card
 * @param {Label[]} companyLabels - Array of company labels for the card
 */
export const TrelloCard: React.FC<TrelloCardProps> = ({
  id,
  index,
  title,
  description,
  colorCode,
  thumbnailUrl: propsThumbnailUrl,
  assignees = [],
  attachmentCount = 0,
  start_date,
  end_date,
  onDelete,
  onUpdate,
  userRole,
  onCardClick,
  employees = [],
  userId = '',
  is_locked,
  locked_by,
  labels: initialLabels = [],
  labelIds = [],
  companyLabels = [],
  boardModule = 'unknown',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [cardAttachments, setCardAttachments] = useState<CardAttachment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userInfo } = useUserAndCompanyData(userId || '');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(propsThumbnailUrl);

  useEffect(() => {
    setThumbnailUrl(propsThumbnailUrl);
  }, [propsThumbnailUrl]);

  const canManageCard = true; // Everyone can edit

  // Add check for locked state
  const isLocked = is_locked || false;

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
        // Log the deletion
        if (userInfo && userInfo.id && userInfo.company_id) {
          const fullName = `${userInfo.first_name} ${userInfo.last_name}`.trim() || 'Unknown User';
          await logDeletion(
            'delete_card',
            id,
            title,
            userInfo.id,
            fullName,
            userInfo.company_id,
            boardModule
          );
        }
        
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
        const card: Card = {
          id,
          title,
          description,
          colorCode,
          thumbnailUrl,
          assignees,
          start_date,
          end_date,
          is_locked,
          locked_by
        };
        onCardClick(card);
      } else {
        setIsModalOpen(true);
        setIsLoadingAttachments(true);
        try {
          if (!id.startsWith('temp-')) {
            const fetchedAttachments = await getCardAttachments(id);
            setCardAttachments(fetchedAttachments);
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

  // Calculate duration between start and end date
  const calculateDuration = () => {
    if (!start_date || !end_date) return null;
    
    try {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      // Calculate difference in days
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch {
      return null;
    }
  };

  const duration = calculateDuration();

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Find employee data for assignees, filtering out non-employees
  const assigneeEmployees = assignees
    .map(assignee => {
      // Handle both string IDs and object format with employee_id
      const employeeId = typeof assignee === 'string' 
        ? assignee 
        : (assignee as { employee_id: string }).employee_id;
      
      return employees.find(emp => emp.id === employeeId);
    })
    .filter(emp => emp && emp.Is_Employed) as Employee[];

  const handleAttachmentCountChange = (newCount: number) => {
    if (onUpdate) {
      onUpdate({ id, title, attachmentCount: newCount });
    }
  };

  const handleThumbnailChange = async (updatedCard: CardUpdate) => {
    if (onUpdate) {
      // Find the new thumbnail attachment
      const newThumbnail = updatedCard.attachments?.find(att => att.is_thumbnail);
      
      let newThumbnailUrl: string | undefined = undefined;
      
      // If we have a thumbnail, get its proper signed URL
      if (newThumbnail) {
        try {
          // Use getAttachmentUrl to get the proper signed URL instead of using file_url directly
          newThumbnailUrl = await getAttachmentUrl(newThumbnail.id);
        } catch (error) {
          console.error('Failed to get signed thumbnail URL:', error);
          // Fallback to the file_url if we couldn't get the signed URL
          newThumbnailUrl = newThumbnail.file_url;
        }
      }

      // Update the internal state for immediate visual feedback
      setThumbnailUrl(newThumbnailUrl);
      
      // Update the attachments state as well to maintain consistency
      setCardAttachments(updatedCard.attachments || []);

      // Then propagate the change to parent components
      onUpdate({ 
        id, 
        title: updatedCard.title || title,
        description: updatedCard.description,
        colorCode: updatedCard.colorCode,
        assignees: updatedCard.assignees,
        start_date: updatedCard.start_date,
        end_date: updatedCard.end_date,
        attachmentCount: updatedCard.attachmentCount,
        is_locked: updatedCard.is_locked,
        locked_by: updatedCard.locked_by,
      });
    }
    // Keep the modal open, do not call setIsModalOpen(false)
  };

  const handleLockStatusChange = (isLocked: boolean, lockedBy: string) => {
    if (onUpdate) {
      onUpdate({ id, title, is_locked: isLocked, locked_by: lockedBy });
    }
  };

  // Derive displayed labels from IDs and companyLabels for reactivity
  const derivedLabels = useMemo(() => {
    if (labelIds && labelIds.length > 0 && companyLabels && companyLabels.length > 0) {
      return labelIds.map(id => companyLabels.find(cl => cl.id === id)).filter(Boolean) as Label[];
    } 
    // Fallback to initialLabels if IDs/companyLabels aren't available/populated yet
    return initialLabels;
  }, [labelIds, companyLabels, initialLabels]);

  return (
    <>
      <Draggable draggableId={`card-${id}`} index={index} isDragDisabled={isLocked}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`
              relative
              bg-white rounded p-2 mb-1.5
              cursor-pointer hover:bg-gray-50 
              transition-all duration-200 ease-in-out
              ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-3 z-50 ring-2 ring-blue-500 bg-blue-50' : ''}
              ${isDragging ? 'rotate-2 shadow-lg ring-1 ring-blue-400 bg-blue-50/50' : 'shadow-sm'}
              select-none
              group
              ${isLocked ? 'opacity-75' : ''}
            `}
            style={{
              backgroundColor: colorCode || 'white',
              ...provided.draggableProps.style,
              transformOrigin: 'center',
              touchAction: 'manipulation',
            }}
            onClick={!isDragging ? handleCardClick : undefined}
          >
            {/* Add lock indicator */}
            {isLocked && (
              <div className="absolute top-1 right-1 text-gray-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            )}

            {/* Only show edit button if not locked and user is manager */}
            {!isLocked && userRole.toLowerCase().includes('manager') && (
              <button
                title="Edit card"
                className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-gray-100 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={handleMenuClick}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
            )}

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute top-5 right-1 bg-white shadow-lg rounded-md py-1 z-50">
                {userRole.toLowerCase().includes('manager') && (
                  <button
                    className="w-full px-3 py-1 text-left text-xs text-red-600 hover:bg-red-50"
                    onClick={handleDeleteClick}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}

            <div
              {...provided.dragHandleProps}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full pr-4" // Reduced right padding for edit button
            >
              {thumbnailUrl && (
                <img 
                  src={thumbnailUrl} 
                  alt="Card thumbnail" 
                  className="w-full h-32 object-cover mb-2 rounded select-none"
                  draggable={false}
                />
              )}
              
              {/* Header row with title */}
              <div className="mb-1">
                <h3 className="font-medium text-gray-900 select-none truncate">{title}</h3>
              </div>
              
              {/* Description - only if present */}
              {description && (
                <div className="text-xs overflow-hidden max-h-[2.4em] mb-1 trello-card-preview-description">
                  <HtmlContent 
                    html={description}
                    className="max-w-none" 
                  />
                </div>
              )}
              
              {/* Labels - Use derivedLabels */} 
              {derivedLabels && derivedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {derivedLabels.slice(0, 3).map((label) => (
                    <span
                      key={label.id}
                      className="px-1.5 py-0.5 rounded-full text-xs font-medium truncate max-w-[80px]"
                      style={{ backgroundColor: label.color_code + '33', color: label.color_code }}
                      title={label.text}
                    >
                      {label.text.length > 10 ? `${label.text.substring(0, 10)}...` : label.text}
                    </span>
                  ))}
                  {derivedLabels.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600"
                          title={`${derivedLabels.length - 3} more labels`}>
                       +{derivedLabels.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              {/* Middle row with assignees */}
              {assignees && assignees.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {assigneeEmployees.slice(0, 2).map((employee, i) => (
                    <div 
                      key={`${employee?.id || i}`}
                      className="flex-shrink-0 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-medium truncate max-w-[80px]"
                      title={employee?.first_name ? `${employee.first_name} ${employee.last_name || ''}` : (employee?.email || 'Assignee')}
                    >
                      {employee?.first_name || employee?.email?.split('@')[0] || 'A'}
                    </div>
                  ))}
                  
                  {/* Show count for additional assignees */}
                  {assignees.length > 2 && (
                    <div className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-medium" title={`${assignees.length - 2} more assignees`}>
                      +{assignees.length - 2}
                    </div>
                  )}
                </div>
              )}
              
              {/* Footer row with dates and attachments */}
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                {/* Date information - compact format */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {(start_date || end_date) && (
                    <div className="flex items-center gap-1 truncate" 
                         title={`${start_date ? 'Start: ' + formatDate(start_date) : ''} ${start_date && end_date ? ' → ' : ''} ${end_date ? 'End: ' + formatDate(end_date) : ''}`}>
                      <svg className="w-3 h-3 flex-shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="truncate">
                        {start_date && formatDate(start_date)}
                        {start_date && end_date && " → "}
                        {end_date && formatDate(end_date)}
                      </span>
                    </div>
                  )}
                  
                  {duration !== null && (
                    <div className="flex items-center gap-1 flex-shrink-0" title={`Duration: ${duration} day${duration !== 1 ? 's' : ''}`}>
                      <svg className="w-3 h-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{duration}d</span>
                    </div>
                  )}
                </div>
                
                {/* Attachment count */}
                {attachmentCount > 0 && (
                  <div className="flex items-center text-gray-500 text-xs flex-shrink-0">
                    <svg className="w-3.5 h-3.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    {attachmentCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {/* Delete Confirmation Modal */}
      {!isLocked && showDeleteModal && (
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
            if (onUpdate) {
              // onUpdate in TrelloCard should handle general card updates, not label-specific ones
              // Labels are updated via updateCardLabels in the modal
              const generalUpdates: CardUpdate & { id: string } = {
                id,
                title: updatedCard.title || title,
                description: updatedCard.description,
                colorCode: updatedCard.colorCode,
                assignees: updatedCard.assignees,
                start_date: updatedCard.start_date,
                end_date: updatedCard.end_date,
                // attachments: updatedCard.attachments || cardAttachments, // Attachments handled separately?
                attachmentCount: updatedCard.attachmentCount,
                is_locked: updatedCard.is_locked,
                locked_by: updatedCard.locked_by,
                // Do NOT pass labels here
              };
              // Explicitly cast to satisfy the stricter onUpdate prop type
              onUpdate(generalUpdates as CardUpdate & { id: string; title: string });
            }
            setIsModalOpen(false);
          }}
          card={{
            id,
            title,
            description,
            colorCode,
            assignees,
            attachments: cardAttachments,
            start_date,
            end_date,
            is_locked,
            locked_by,
            labels: derivedLabels,
            label_ids: labelIds,
          }}
          isLoadingAttachments={isLoadingAttachments}
          userRole={userRole}
          readOnly={!canManageCard || (isLocked && locked_by !== userId)}
          employees={employees}
          userId={userId}
          onAttachmentChange={handleAttachmentCountChange}
          onLockChange={handleLockStatusChange}
          onThumbnailChange={handleThumbnailChange}
          boardModule={boardModule}
        />
      )}
    </>
  );
}; 