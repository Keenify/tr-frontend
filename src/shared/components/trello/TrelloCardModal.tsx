import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { createCardAttachment, deleteAttachment, getCardAttachments, getAttachmentUrl, CardAttachment } from './services/useCardAttachment';
import { assignEmployeeToCard, unassignEmployeeFromCard, getCardAssignees } from './services/useCardAssignee';
import { Employee } from '../../../shared/types/directory.types';
import { Card, CardUpdate } from './types/card.types';
import { useUserAndCompanyData } from '../../hooks/useUserAndCompanyData';
import { updateCard } from './services/useCard';
import { TrelloCardDescription } from './TrelloCardDescription';
import './TrelloCardDescription.css';

interface TrelloCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: CardUpdate) => void;
  card: Card & { attachments?: CardAttachment[] };
  isLoadingAttachments: boolean;
  userRole: string;
  readOnly?: boolean;
  employees: Employee[];
  userId?: string;
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
  card,
  isLoadingAttachments,
  userRole,
  readOnly = false,
  employees,
  userId = ''
}) => {
  // Always call the hook with a string value, even if it's empty
  const { userInfo } = useUserAndCompanyData(userId);

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
      setAttachments(prev => [...prev, ...newAttachments]);
      showToast(`${acceptedFiles.length} file(s) uploaded successfully`, 'success');
    } catch (error) {
      console.error('Failed to upload attachments:', error);
      showToast('Failed to upload attachments', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [card.id, isEditable]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'message/rfc822': [], // .eml files (email)
      'application/octet-stream': ['.eml'] // Alternative MIME type for .eml files
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
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
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
      
      // Call onSave with minimal payload to update parent components without closing modal
      const payload = {
        is_locked: newLockedState,
        locked_by: newLockedState ? userInfo?.id : ""
      };
      onSave(payload);
      
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
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      attachments,
      is_locked: isLocked,
      locked_by: isLocked ? userInfo?.id : "",
      list_id: card.list_id || "",
      position: card.position || 0
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

  // Get assigned employee names for display
  const assignedEmployees = employees.filter(emp => assignees.includes(emp.id));

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
            } flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="font-medium">
                  {isLockedByCurrentUser 
                    ? 'You have locked this card' 
                    : `This card is locked by ${lockedByEmployee ? `${lockedByEmployee.first_name} ${lockedByEmployee.last_name}` : 'another user'}`
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
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Start Date
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
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      End Date
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
                          className="flex items-center justify-between p-2 border-b last:border-b-0"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
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
                              Supports images, PDFs, documents, and email files (.eml)
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