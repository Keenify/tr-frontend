import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createCardAttachment, deleteAttachment, getCardAttachments, getAttachmentUrl, CardAttachment } from './services/useCardAttachment';
import { assignEmployeeToCard, unassignEmployeeFromCard, getCardAssignees } from './services/useCardAssignee';
import { Employee } from '../../../shared/types/directory.types';
import { Card, CardUpdate } from './types/card.types';

interface TrelloCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: CardUpdate) => void;
  card: Card & { attachments?: CardAttachment[] };
  isLoadingAttachments: boolean;
  userRole: string;
  readOnly?: boolean;
  employees: Employee[];
}

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
  readOnly = !userRole.toLowerCase().includes('manager'),
  employees
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [colorCode, setColorCode] = useState(card.colorCode || '#ffffff');
  const [attachments, setAttachments] = useState<CardAttachment[]>([]);
  const [assignees, setAssignees] = useState<string[]>(card.assignees || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  
  // Check if user can delete attachments (only managers can)
  const canDeleteAttachments = userRole.toLowerCase().includes('manager');

  // Fetch current assignees when the modal opens
  useEffect(() => {
    const fetchAssignees = async () => {
      if (card.id.startsWith('temp-')) return; // Skip for temporary cards
      
      try {
        const fetchedAssignees = await getCardAssignees(card.id);
        // Extract just the employee IDs from the assignees
        const employeeIds = fetchedAssignees.map(assignee => assignee.employee_id);
        setAssignees(employeeIds);
        console.log('Fetched assignees:', employeeIds);
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

  useEffect(() => {
    console.log('TrelloCardModal received employees:', employees);
    console.log('Current assignees:', assignees);
  }, [employees, assignees]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    console.log('Card ID:', card.id);
    console.log('Files to upload:', acceptedFiles);
    
    try {
      const uploadPromises = acceptedFiles.map(file => {
        return createCardAttachment(card.id, file, false);
      });
      const newAttachments = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('Failed to upload attachments:', error);
    } finally {
      setIsUploading(false);
    }
  }, [card.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    }
  });

  const handleAssigneeToggle = async (employeeId: string) => {
    setIsUpdatingAssignees(true);
    
    try {
      if (assignees.includes(employeeId)) {
        // Unassign employee
        console.log(`Unassigning employee ${employeeId} from card ${card.id}`);
        const success = await unassignEmployeeFromCard(card.id, employeeId);
        if (success) {
          setAssignees(prev => prev.filter(id => id !== employeeId));
          console.log('Unassign successful');
        } else {
          console.error('Unassign returned false');
        }
      } else {
        // Assign employee
        console.log(`Assigning employee ${employeeId} to card ${card.id}`);
        const result = await assignEmployeeToCard(card.id, employeeId);
        if (result) {
          setAssignees(prev => [...prev, employeeId]);
          console.log('Assign successful');
        } else {
          console.error('Assign failed');
        }
      }
    } catch (error) {
      console.error('Failed to update assignee:', error);
    } finally {
      setIsUpdatingAssignees(false);
      setShowAssigneeDropdown(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCard: CardUpdate = {
      title,
      description,
      colorCode,
      assignees
    };
    console.log('Saving card with assignees:', assignees);
    onSave(updatedCard);
    onClose();
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const handleOpenAttachment = async (attachmentId: string) => {
    try {
      const url = await getAttachmentUrl(attachmentId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get attachment URL:', error);
    }
  };

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
      <div className="bg-white rounded-lg w-full max-w-5xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-grow overflow-auto">
            <div className="flex flex-col md:flex-row gap-6">
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
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={readOnly}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    title="Enter card description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md min-h-[150px]"
                    disabled={readOnly}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      title="Select card color"
                      type="color"
                      value={colorCode}
                      onChange={(e) => setColorCode(e.target.value)}
                      className="w-12 h-12 p-1 rounded border"
                      disabled={readOnly}
                    />
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
                      className="px-3 py-2 border rounded-md w-32"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Right column - Assignees and attachments */}
              <div className="flex-1">
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Assignees
                  </label>
                  <div className="relative">
                    <div 
                      className={`
                        w-full px-3 py-2 border rounded-md flex flex-wrap gap-2 min-h-[42px] cursor-pointer
                        ${isUpdatingAssignees ? 'opacity-50' : ''}
                      `}
                      onClick={() => !readOnly && !isUpdatingAssignees && setShowAssigneeDropdown(!showAssigneeDropdown)}
                    >
                      {isUpdatingAssignees && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                          <span className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></span>
                        </div>
                      )}
                      {assignedEmployees.length === 0 ? (
                        <span className="text-gray-500">No assignees</span>
                      ) : (
                        assignedEmployees.map(emp => (
                          <div key={emp.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                            <span>{emp.first_name} {emp.last_name}</span>
                            {!readOnly && (
                              <button 
                                type="button"
                                className="ml-1 text-blue-600 hover:text-blue-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssigneeToggle(emp.id);
                                }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {showAssigneeDropdown && !readOnly && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {employees.length === 0 ? (
                          <div className="p-3 text-gray-500">No employees available</div>
                        ) : (
                          employees.map(emp => (
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
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Attachments
                  </label>
                  <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                    {attachments.length === 0 ? (
                      <p className="text-gray-500 italic">No attachments</p>
                    ) : (
                      attachments.map((attachment) => (
                        <div 
                          key={attachment.id}
                          className="flex items-center justify-between p-2 border rounded-md"
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
                              Supports images, PDFs, and documents
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

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
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