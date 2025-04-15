import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { createCardAttachment, deleteAttachment, getCardAttachments, getAttachmentUrl, updateAttachmentThumbnailStatus, CardAttachment } from './services/useCardAttachment';
import { assignEmployeeToCard, unassignEmployeeFromCard, getCardAssignees } from './services/useCardAssignee';
import { Employee } from '../../../shared/types/directory.types';
import { Card, CardUpdate } from './types/card.types';
import { Label } from '../../types/label.types';
import { useUserAndCompanyData } from '../../hooks/useUserAndCompanyData';
import { updateCard } from './services/useCard';
import { labelService } from '../../services/labelService';
import { TrelloCardDescription } from './TrelloCardDescription';
import { TrelloCardLabelManager } from './TrelloCardLabelManager';
import '../../styles/TrelloCardDescription.css';

// --- Remove Placeholder Label Data and Service ---
/*
const MOCK_COMPANY_LABELS: Label[] = [
  // ... mock data ...
];
const MOCK_CARD_LABELS: { [cardId: string]: string[] } = {
  'card-1': ['label-1', 'label-3'] 
};

const placeholderLabelService = {
  // ... placeholder functions ...
};
*/
// --- End Removal ---

interface TrelloCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: CardUpdate) => void;
  onThumbnailChange?: (updatedCard: CardUpdate) => void;
  card: Card & { attachments?: CardAttachment[] };
  isLoadingAttachments: boolean;
  userRole: string;
  readOnly?: boolean;
  employees: Employee[];
  userId?: string;
  onAttachmentChange?: (newCount: number) => void;
  onLockChange?: (isLocked: boolean, lockedBy: string) => void;
}

// Predefined color options for quick selection
const PREDEFINED_COLORS = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#F8D7DA', name: 'Light Red' },
  { hex: '#D4EDDA', name: 'Light Green' },
  { hex: '#CCE5FF', name: 'Light Blue' },
  { hex: '#FFF3CD', name: 'Light Yellow' },
  { hex: '#E2E3E5', name: 'Light Gray' },
];

/**
 * TrelloCardModal Component
 * 
 * Responsibility:
 * - Provides a modal interface for editing card details
 * - Manages form state for card editing
 * - Handles card updates
 * 
 * Features:
 * - Edit card title
 * - Edit card description
 * - Color picker for card background
 * - Form validation
 * - Save and cancel actions
 * - Modal overlay with backdrop
 * 
 * Props:
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Handler for modal close action
 * @param {Function} onSave - Handler for save action with updated card data
 * @param {Object} card - Current card data for editing
 */

export const TrelloCardModal: React.FC<TrelloCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onThumbnailChange,
  card,
  isLoadingAttachments,
  userRole,
  readOnly = false,
  employees,
  userId = '',
  onAttachmentChange,
  onLockChange
}) => {
  // Always call the hook with a string value, even if it's empty
  const { userInfo } = useUserAndCompanyData(userId);
  const companyId = userInfo?.company_id || '';

  // Log the employee ID when userInfo changes and userId is provided
  useEffect(() => {
    if (userInfo && userId) {
      console.log('Current employee ID:', userInfo.id);
      // You might also want to log other user information
      console.log('User data:', userInfo);
    }
  }, [userInfo, userId]);

  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Invalid date:', dateString, error);
      return '';
    }
  };

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [colorCode, setColorCode] = useState(card.colorCode || card.color_code || '#ffffff');
  const [attachments, setAttachments] = useState<CardAttachment[]>([]);
  const [assignees, setAssignees] = useState<string[]>(card.assignees || []);
  const [startDate, setStartDate] = useState(formatDateForInput(card.start_date));
  const [endDate, setEndDate] = useState(formatDateForInput(card.end_date));
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLocked, setIsLocked] = useState(card.is_locked || false);
  const [lockedBy, setLockedBy] = useState(card.locked_by || '');
  const [isUpdatingThumbnailId, setIsUpdatingThumbnailId] = useState<string | null>(null);
  
  // Label State
  const [companyLabels, setCompanyLabels] = useState<Label[]>([]);
  const [assignedLabelIds, setAssignedLabelIds] = useState<string[]>([]);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  
  // Check if the current user is the one who locked the card
  const isLockedByCurrentUser = userInfo?.id === lockedBy;
  
  // Determine if the card is editable
  const isEditable = (!isLocked || isLockedByCurrentUser) && !readOnly;

  // Determine if the user can manage the lock
  const canManageLock = userInfo?.id === lockedBy || (!isLocked && userInfo?.id);

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => 
      emp.first_name.toLowerCase().includes(term) || 
      emp.last_name.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  // Get assigned employee names for display
  const assignedEmployees = useMemo(() => {
    return employees.filter(emp => assignees.includes(emp.id));
  }, [employees, assignees]);

  // Get assigned label objects for display
  const assignedLabels = useMemo(() => {
      return companyLabels.filter(label => assignedLabelIds.includes(label.id));
  }, [companyLabels, assignedLabelIds]);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check if user can delete attachments (only managers can)
  const canDeleteAttachments = userRole.toLowerCase().includes('manager') && isEditable;

  // Fetch current assignees when the modal opens
  useEffect(() => {
    const fetchAssignees = async () => {
      if (card.id.startsWith('temp-')) return; // Skip for temporary cards
      
      try {
        const fetchedAssignees = await getCardAssignees(card.id);
        // Extract just the employee IDs from the assignees
        const employeeIds = fetchedAssignees.map(assignee => assignee.employee_id);
        setAssignees(employeeIds);
      } catch (error) {
        console.error('Failed to fetch assignees:', error);
      }
    };
    
    fetchAssignees();
  }, [card.id]);

  useEffect(() => {
    const fetchAttachments = async () => {
      setIsUploading(true);
      try {
        const fetchedAttachments = await getCardAttachments(card.id);
        setAttachments(fetchedAttachments);
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
      } finally {
        setIsUploading(false);
      }
    };
    fetchAttachments();
  }, [card.id]);

  // Fetch Labels using actual service
  useEffect(() => {
    const fetchLabels = async () => {
        if (!companyId || !card.id) return;
        setIsLoadingLabels(true);
        try {
            // Use labelService
            const [fetchedCompanyLabels, fetchedCardLabelIds] = await Promise.all([
                labelService.fetchLabelsByCompany(companyId),
                card.id.startsWith('temp-') ? Promise.resolve([]) : labelService.fetchLabelsByCard(card.id)
            ]);
            setCompanyLabels(fetchedCompanyLabels);
            setAssignedLabelIds(fetchedCardLabelIds);
        } catch (error) {
            console.error("Failed to fetch labels:", error);
            showToast("Failed to load labels", "error");
        } finally {
            setIsLoadingLabels(false);
        }
    };
    fetchLabels();
  }, [companyId, card.id]);

  // Update dates when card changes
  useEffect(() => {
    setStartDate(formatDateForInput(card.start_date));
    setEndDate(formatDateForInput(card.end_date));
  }, [card]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!isEditable) {
      showToast('Cannot add attachments to a locked card', 'error');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const uploadPromises = acceptedFiles.map(file => {
        return createCardAttachment(card.id, file, false);
      });
      const newAttachments = await Promise.all(uploadPromises);
      setAttachments(prev => {
        const updatedAttachments = [...prev, ...newAttachments];
        if (onAttachmentChange) {
          onAttachmentChange(updatedAttachments.length);
        }
        return updatedAttachments;
      });
      showToast(`${acceptedFiles.length} file(s) uploaded successfully`, 'success');
    } catch (error) {
      console.error('Failed to upload attachments:', error);
      showToast('Failed to upload attachments', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [card.id, isEditable, onAttachmentChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      // Image formats
      'image/*': [],
      'image/vnd.adobe.photoshop': ['.psd'],
      'application/photoshop': ['.psd'],
      
      // Document formats
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      
      // Email formats
      'message/rfc822': ['.eml'],
      'application/octet-stream': ['.eml'],
      
      // Archive formats
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip']
    }
  });

  const handleAssigneeToggle = async (employeeId: string) => {
    if (!isEditable) {
      showToast('Cannot modify assignees on a locked card', 'error');
      return;
    }
    
    setIsUpdatingAssignees(true);
    
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'Employee';
      
      if (assignees.includes(employeeId)) {
        // Unassign employee
        const success = await unassignEmployeeFromCard(card.id, employeeId);
        if (success) {
          setAssignees(prev => prev.filter(id => id !== employeeId));
          showToast(`${employeeName} unassigned from card`, 'success');
        } else {
          showToast(`Failed to unassign ${employeeName}`, 'error');
        }
      } else {
        // Assign employee
        const result = await assignEmployeeToCard(card.id, employeeId);
        if (result) {
          setAssignees(prev => [...prev, employeeId]);
          showToast(`${employeeName} assigned to card`, 'success');
        } else {
          showToast(`Failed to assign ${employeeName}`, 'error');
        }
      }
    } catch (error) {
      console.error('Failed to update assignee:', error);
      showToast('Failed to update assignee', 'error');
    } finally {
      setIsUpdatingAssignees(false);
      setSearchTerm('');
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!isEditable) {
      showToast('Cannot remove attachments from a locked card', 'error');
      return;
    }
    
    try {
      await deleteAttachment(attachmentId);
      setAttachments(prev => {
        const updatedAttachments = prev.filter(a => a.id !== attachmentId);
        if (onAttachmentChange) {
          onAttachmentChange(updatedAttachments.length);
        }
        return updatedAttachments;
      });
      showToast('Attachment removed successfully', 'success');
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      showToast('Failed to remove attachment', 'error');
    }
  };

  const handleOpenAttachment = async (attachmentId: string) => {
    try {
      const url = await getAttachmentUrl(attachmentId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get attachment URL:', error);
      showToast('Failed to open attachment', 'error');
    }
  };

  const handleSetThumbnail = async (attachmentId: string, newIsThumbnail: boolean) => {
    if (!isEditable) {
      showToast('Cannot change thumbnail on a locked card', 'error');
      return;
    }

    setIsUpdatingThumbnailId(attachmentId);

    try {
      // If we're setting a new thumbnail, first unset any existing thumbnails in backend
      if (newIsThumbnail) {
        // Find any existing thumbnails
        const existingThumbnails = attachments.filter(
          att => att.is_thumbnail && att.id !== attachmentId
        );
        
        // Update each previous thumbnail in the backend
        for (const oldThumbnail of existingThumbnails) {
          console.log(`Unsetting thumbnail status for attachment ${oldThumbnail.id}`);
          await updateAttachmentThumbnailStatus(oldThumbnail.id, card.id, false);
        }
      }
      
      // Now update the selected attachment's thumbnail status
      await updateAttachmentThumbnailStatus(attachmentId, card.id, newIsThumbnail);
      
      // Update local state after backend updates
      const updatedAttachments = attachments.map(att => {
        if (att.id === attachmentId) {
          return { ...att, is_thumbnail: newIsThumbnail };
        }
        // If we just set a new thumbnail, unset any other potential thumbnail
        if (newIsThumbnail && att.is_thumbnail) {
          return { ...att, is_thumbnail: false };
        }
        return att;
      });

      setAttachments(updatedAttachments);

      // Create card update payload for thumbnail change
      const thumbnailUpdatePayload: CardUpdate = {
        title: title,
        description: description,
        colorCode: colorCode,
        color_code: colorCode,
        assignees: assignees,
        start_date: startDate || "",
        end_date: endDate || "",
        attachments: updatedAttachments,
        attachmentCount: updatedAttachments.length,
        is_locked: isLocked,
        locked_by: isLocked ? userInfo?.id : "",
        list_id: card.list_id || "",
        position: card.position || 0
      };

      // Call the onThumbnailChange prop with the updated payload
      if (onThumbnailChange) {
        onThumbnailChange(thumbnailUpdatePayload);
      }

      showToast(`Thumbnail ${newIsThumbnail ? 'set' : 'unset'} successfully`, 'success');

    } catch (error) {
      console.error('Failed to update thumbnail status:', error);
      showToast('Failed to update thumbnail status', 'error');
    } finally {
      setIsUpdatingThumbnailId(null);
    }
  };

  const handleLockToggle = async () => {
    if (isLocked && !isLockedByCurrentUser) {
      showToast('Only the user who locked the card can unlock it', 'error');
      return;
    }

    const newLockedState = !isLocked;
    
    try {
      // Create a minimal payload for lock operations
      const lockPayload = {
        id: card.id,
        is_locked: newLockedState,
        locked_by: newLockedState ? userInfo?.id : "" // Use empty string instead of null
      };

      // Call the API to update the card
      await updateCard(card.id, lockPayload);
      
      // Update local state
      setIsLocked(newLockedState);
      setLockedBy(newLockedState ? userInfo?.id || '' : '');
      
      // Call the new onLockChange callback instead
      if (onLockChange) {
        onLockChange(newLockedState, newLockedState ? userInfo?.id || '' : '');
      }
      
      // Show appropriate toast message
      showToast(
        newLockedState ? 'Card locked successfully' : 'Card unlocked successfully',
        'success'
      );
    } catch (error) {
      console.error('Failed to update card lock status:', error);
      showToast(
        `Failed to ${newLockedState ? 'lock' : 'unlock'} card`,
        'error'
      );
    }
  };

  // --- Label Handler Functions using labelService ---
  const handleLabelToggleAssign = async (labelId: string) => {
      const isAssigned = assignedLabelIds.includes(labelId);
      try {
          if (isAssigned) {
              await labelService.unassignLabelFromCard(card.id, labelId); // Use service
              setAssignedLabelIds(prev => prev.filter(id => id !== labelId));
              showToast('Label unassigned', 'success');
          } else {
              await labelService.assignLabelToCard(card.id, labelId); // Use service
              setAssignedLabelIds(prev => [...prev, labelId]);
              showToast('Label assigned', 'success');
          }
      } catch (error) {
          console.error("Failed to toggle label assignment:", error);
          showToast("Failed to update label assignment", "error");
          // Optionally revert state changes on error?
      }
  };

  const handleLabelCreate = async (data: Pick<Label, 'text' | 'color_code' | 'company_id'>): Promise<Label | null> => {
      console.log('[TrelloCardModal] handleLabelCreate received data:', data);
      try {
          const newLabel = await labelService.createLabel(data); // Use service
          console.log('[TrelloCardModal] labelService.createLabel response:', newLabel);
          if (newLabel) {
              setCompanyLabels(prev => [...prev, newLabel]);
              return newLabel;
          }
          return null;
      } catch (error) {
          console.error("Failed to create label:", error);
          showToast("Failed to create label", "error");
          return null; // Indicate failure to LabelManager
      }
  };

  const handleLabelUpdate = async (labelId: string, data: Partial<Pick<Label, 'text' | 'color_code'>>): Promise<Label | null> => {
      try {
          const updatedLabel = await labelService.updateLabel(labelId, data); // Use service
          if (updatedLabel) {
              setCompanyLabels(prev => prev.map(l => l.id === updatedLabel.id ? updatedLabel : l));
              return updatedLabel;
          }
          return null;
      } catch (error) {
          console.error("Failed to update label:", error);
          showToast("Failed to update label", "error");
          return null; // Indicate failure to LabelManager
      }
  };

  const handleLabelDelete = async (labelId: string): Promise<boolean> => {
      try {
          const success = await labelService.deleteLabel(labelId); // Use service
          if (success) {
              setCompanyLabels(prev => prev.filter(l => l.id !== labelId));
              setAssignedLabelIds(prev => prev.filter(id => id !== labelId));
          }
          return success;
      } catch (error) {
          console.error("Failed to delete label:", error);
          showToast("Failed to delete label", "error");
          return false; // Indicate failure to LabelManager
      }
  };

  // --- End Label Handlers ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) {
      showToast('Cannot modify a locked card', 'error');
      return;
    }
    const updatedCard: CardUpdate = {
      title,
      description,
      colorCode,
      color_code: colorCode,
      assignees,
      start_date: startDate || "",
      end_date: endDate || "",
      attachments,
      attachmentCount: attachments.length,
      is_locked: isLocked,
      locked_by: isLocked ? userInfo?.id : "",
      list_id: card.list_id || "",
      position: card.position || 0,
    };

    console.log('Card Update Payload:', updatedCard);
    onSave(updatedCard);
    onClose();
  };

  // Find the employee who locked the card
  const lockedByEmployee = employees.find(emp => emp.id === lockedBy);

  if (!isOpen) return null;

  if (isLoadingAttachments) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl p-6">
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 transition-all duration-300 
          ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}
      
      <div className={`bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col ${isLocked && !isLockedByCurrentUser ? 'opacity-95' : ''}`}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Lock status banner */}
          {isLocked && (
            <div className={`px-6 py-3 ${
              isLockedByCurrentUser 
                ? 'bg-blue-100 text-blue-800 border-b border-blue-200' 
                : 'bg-red-100 text-red-800 border-b border-red-200'
            } flex flex-col`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="font-medium">
                    {isLockedByCurrentUser 
                      ? 'You have locked this card' 
                      : `This card is locked by ${lockedByEmployee ? `${lockedByEmployee.first_name} ${lockedByEmployee.last_name}` : 'another user'}, but all documents are accessible and downloadable.`
                    }
                  </span>
                </div>
                {canManageLock && (
                  <button
                    type="button"
                    onClick={handleLockToggle}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      isLockedByCurrentUser
                        ? 'bg-blue-200 hover:bg-blue-300'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {isLocked ? 'Unlock Card' : 'Lock Card'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Header with lock button */}
          <div className="flex justify-between items-center mb-4 p-6">
            <h2 className="text-xl font-semibold">
              {isEditable ? 'Edit Card' : 'View Card'}
            </h2>
            {!isLocked && userInfo?.id && (
              <button
                type="button"
                onClick={handleLockToggle}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Lock Card
              </button>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left column - Main card info */}
              <div className="flex-1">
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Title
                  </label>
                  <input
                    title="Enter card title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${!isEditable ? 'bg-gray-100' : ''}`}
                    required
                    disabled={!isEditable || readOnly}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  {/* 
                    TrelloCardDescription component handles rich text with markdown support
                    It accepts HTML content as input and outputs HTML content on change
                    This replaces the simple textarea with a full-featured editor 
                  */}
                  <TrelloCardDescription
                    value={description}
                    onChange={setDescription}
                    disabled={!isEditable || readOnly}
                    placeholder="Add a detailed description..."
                  />
                </div>

                {/* Add date fields */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-700 text-sm font-bold mb-2 flex justify-between">
                      <span>Start Date</span>
                      {startDate && isEditable && (
                        <button
                          type="button"
                          onClick={() => setStartDate('')}
                          className="text-xs text-red-500 hover:text-red-700"
                          title="Clear start date"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <input
                      title="Enter start date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={!isEditable || readOnly}
                    />
                    {startDate && (
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(startDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-700 text-sm font-bold mb-2 flex justify-between">
                      <span>End Date</span>
                      {endDate && isEditable && (
                        <button
                          type="button"
                          onClick={() => setEndDate('')}
                          className="text-xs text-red-500 hover:text-red-700"
                          title="Clear end date"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <input
                      title="Enter end date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={!isEditable || readOnly}
                      min={startDate} // Prevent end date being before start date
                    />
                    {endDate && (
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Card Color
                  </label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative">
                        <input
                          title="Select card color"
                          type="color"
                          value={colorCode}
                          onChange={(e) => setColorCode(e.target.value)}
                          className="w-12 h-12 p-0.5 rounded cursor-pointer"
                          disabled={!isEditable || readOnly}
                        />
                        <div className="absolute inset-0 pointer-events-none rounded border border-gray-300"></div>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={colorCode}
                          onChange={(e) => {
                            const hex = e.target.value;
                            if (hex.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                              setColorCode(hex);
                            }
                          }}
                          placeholder="#000000"
                          className="px-3 py-2 border rounded-md w-full"
                          disabled={!isEditable || readOnly}
                        />
                        <div className="mt-1 text-xs text-gray-500">Enter hex color code</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-700 mb-2">Quick Colors</div>
                      <div className="grid grid-cols-6 gap-2">
                        {PREDEFINED_COLORS.map((color, index) => (
                          <div key={index} className="relative group">
                            <button
                              type="button"
                              title={`${color.name} (${color.hex})`}
                              onClick={() => setColorCode(color.hex)}
                              disabled={!isEditable || readOnly}
                              className={`
                                w-full h-10 rounded-md border border-gray-300 
                                hover:shadow-md transition-all duration-200
                                ${colorCode === color.hex ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                              `}
                              style={{ backgroundColor: color.hex }}
                            />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                              {color.name} ({color.hex})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Assignees and attachments */}
              <div className="flex-1">
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Assignees
                  </label>
                  
                  {/* Assigned employees display */}
                  <div className="mb-2 min-h-[42px] flex flex-wrap gap-2">
                    {assignedEmployees.length === 0 ? (
                      <span className="text-gray-500 italic">No assignees</span>
                    ) : (
                      assignedEmployees.map(emp => (
                        <div key={emp.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                          <span>{emp.first_name} {emp.last_name}</span>
                          {!readOnly && (
                            <button 
                              type="button"
                              className="ml-1 text-blue-600 hover:text-blue-800"
                              onClick={() => handleAssigneeToggle(emp.id)}
                              disabled={isUpdatingAssignees}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Search and assign */}
                  {!readOnly && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search employees to assign..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setShowAssigneeDropdown(true)}
                        className="w-full px-3 py-2 border rounded-md"
                        disabled={isUpdatingAssignees}
                      />
                      
                      {showAssigneeDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {isUpdatingAssignees && (
                            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                              <span className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></span>
                            </div>
                          )}
                          
                          {filteredEmployees.length === 0 ? (
                            <div className="p-3 text-gray-500">No matching employees found</div>
                          ) : (
                            filteredEmployees.map(emp => (
                              <div 
                                key={emp.id} 
                                className={`
                                  p-2 hover:bg-gray-100 cursor-pointer flex items-center
                                  ${assignees.includes(emp.id) ? 'bg-blue-50' : ''}
                                `}
                                onClick={() => handleAssigneeToggle(emp.id)}
                              >
                                <input
                                  title="Assign employee"
                                  type="checkbox"
                                  checked={assignees.includes(emp.id)}
                                  onChange={() => {}}
                                  className="mr-2"
                                />
                                <span>{emp.first_name} {emp.last_name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Labels Section */}      
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Labels
                  </label>

                  {/* Display Assigned Labels */}       
                  <div className="mb-2 min-h-[30px] flex flex-wrap gap-2">
                     {isLoadingLabels ? (
                        <span className="text-gray-500 italic text-sm">Loading labels...</span>
                     ) : assignedLabels.length === 0 ? (
                       <span className="text-gray-500 italic text-sm">No labels assigned</span>
                     ) : (
                       assignedLabels.map(label => (
                         <span
                           key={label.id}
                           className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                           style={{ backgroundColor: label.color_code + '33', color: label.color_code }}
                           title={label.text}
                         >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color_code }}></span>
                            <span className="truncate max-w-[150px]">{label.text}</span>
                            {isEditable && (
                                <button
                                    type="button"
                                    onClick={() => handleLabelToggleAssign(label.id)} // Use direct unassign toggle
                                    className="ml-1 opacity-60 hover:opacity-100"
                                    style={{ color: label.color_code }}
                                    disabled={isLoadingLabels} // Disable while loading anything label related?
                                    title={`Unassign ${label.text}`}
                                >
                                    &times;
                                </button>
                             )}
                         </span>
                       ))
                     )}
                  </div>

                  {/* Add/Manage Labels Button & Dropdown */} 
                  {isEditable && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowLabelManager(!showLabelManager)}
                        className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        disabled={isLoadingLabels} // Disable button while initially loading
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {showLabelManager ? 'Close Labels' : 'Manage Labels'}
                      </button>

                      {/* Label Manager Popover */} 
                      {showLabelManager && companyId && (
                        <TrelloCardLabelManager
                           companyId={companyId}
                           availableLabels={companyLabels}
                           assignedLabelIds={assignedLabelIds}
                           onToggleAssign={handleLabelToggleAssign}
                           onCreateLabel={handleLabelCreate}
                           onUpdateLabel={handleLabelUpdate}
                           onDeleteLabel={handleLabelDelete}
                           isEditable={isEditable}
                           showToast={showToast}
                           onClose={() => setShowLabelManager(false)}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Attachments
                  </label>
                  <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto border rounded-md p-2">
                    {attachments.length === 0 ? (
                      <p className="text-gray-500 italic p-2">No attachments</p>
                    ) : (
                      attachments.map((attachment) => (
                        <div 
                          key={attachment.id}
                          className="flex items-center justify-between p-2 border-b last:border-b-0 gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Thumbnail Toggle Button - only for images */}                       
                            {attachment.file_type.startsWith('image/') && isEditable && (
                              <button
                                type="button"
                                onClick={() => handleSetThumbnail(attachment.id, !attachment.is_thumbnail)}
                                disabled={isUpdatingThumbnailId === attachment.id || !isEditable}
                                className={`flex-shrink-0 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${attachment.is_thumbnail ? 'text-yellow-500' : 'text-gray-400'}`}
                                title={attachment.is_thumbnail ? 'Unset as thumbnail' : 'Set as thumbnail'}
                              >
                                {isUpdatingThumbnailId === attachment.id ? (
                                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </button>
                            )}
                            <a
                              onClick={() => handleOpenAttachment(attachment.id)}
                              className="text-blue-500 hover:text-blue-600 cursor-pointer truncate"
                              title={attachment.file_url}
                            >
                              {attachment.file_url.split('_').length > 2 
                                ? attachment.file_url.split('_').slice(2).join('_')
                                : attachment.file_url}
                            </a>
                          </div>
                          {canDeleteAttachments && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(attachment.id)}
                              disabled={!isEditable}
                              className="text-red-500 hover:text-red-600 flex-shrink-0 ml-2"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {!readOnly && (
                    <div
                      {...getRootProps()}
                      className={`
                        w-full py-6 px-3 border-2 border-dashed rounded-md 
                        transition-colors duration-200 cursor-pointer
                        ${isDragActive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                        }
                        ${isUploading ? 'opacity-50 cursor-wait' : ''}
                      `}
                    >
                      <input {...getInputProps()} />
                      <div className="text-center">
                        {isUploading ? (
                          <p className="text-gray-600">Uploading...</p>
                        ) : (
                          <>
                            <p className="text-gray-600">
                              {isDragActive
                                ? 'Drop files here...'
                                : 'Drag & drop files here, or click to select files'
                              }
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Supports images (including PSD), PDFs, documents,
                            </p>
                            <p className="text-sm text-gray-500">
                              Excel files (.xlsx), email files (.eml), and ZIP archives
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 p-4 border-t bg-white sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Close
            </button>
            {isEditable && (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
              >
                Save
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}; 