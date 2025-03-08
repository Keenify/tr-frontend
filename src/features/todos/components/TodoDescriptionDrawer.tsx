import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TodoData } from '../types/todo';
import { updateTodo } from '../services/useTodos';
import { FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';

interface TodoDescriptionDrawerProps {
  todo: TodoData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (todo: TodoData) => void;
  isViewOnly?: boolean;
}

/**
 * Drawer component for editing todo descriptions
 * This component:
 * - Displays and allows editing of a todo's description
 * - Shows additional todo details like creation date
 * - Handles saving description changes
 * 
 * @component
 * @param {TodoData} todo - The todo item data
 * @param {boolean} isOpen - Whether the drawer is open
 * @param {Function} onClose - Callback when drawer is closed
 * @param {Function} onUpdate - Callback when todo is updated
 * @param {boolean} isViewOnly - Whether the drawer is in view-only mode
 */
const TodoDescriptionDrawer: React.FC<TodoDescriptionDrawerProps> = ({
  todo,
  isOpen,
  onClose,
  onUpdate,
  isViewOnly = false
}) => {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Update local state when todo changes
  useEffect(() => {
    setTitle(todo.title);
    setDescription(todo.description || '');
  }, [todo]);
  
  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen && textareaRef.current && !isViewOnly) {
      textareaRef.current.focus();
    }
  }, [isOpen, isViewOnly]);

  // Focus title input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      
      // Auto-resize the textarea to fit content
      const textarea = titleInputRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditingTitle]);
  
  // Auto-resize title textarea when content changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    
    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  
  const handleSave = useCallback(async () => {
    if (title === todo.title && description === todo.description) {
      onClose();
      return;
    }
    
    try {
      setIsSaving(true);
      const updatedTodo = await updateTodo(todo.id, { 
        title: title.trim() ? title : todo.title, 
        description 
      });
      onUpdate(updatedTodo);
      onClose();
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsSaving(false);
    }
  }, [title, description, todo.title, todo.description, todo.id, onClose, onUpdate]);

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditingTitle(false);
    } else if (e.key === 'Escape') {
      setTitle(todo.title);
      setIsEditingTitle(false);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };
  
  // Handle click outside to save and close
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleSave]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSave();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, handleSave]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-end description-drawer-overlay"
      onClick={() => handleSave()}
    >
      <div 
        ref={drawerRef}
        className="bg-white w-96 h-full shadow-lg flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Todo title and close button */}
        <div className="p-6 flex flex-col border-b border-gray-100">
          <div className="flex justify-between items-start">
            {isEditingTitle && !isViewOnly ? (
              <div className="flex-1 pr-2 w-full">
                <textarea
                  ref={titleInputRef}
                  value={title}
                  onChange={handleTitleChange}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={handleTitleBlur}
                  className="text-xl font-medium text-gray-800 w-full border border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded px-2 py-1 resize-none overflow-hidden"
                  aria-label="Edit todo title"
                  placeholder="Enter todo title"
                  title="Edit todo title"
                  rows={1}
                  style={{ minHeight: '2.5rem' }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Press Enter to save, Shift+Enter for new line
                </div>
              </div>
            ) : (
              <div className="flex-1 pr-2">
                <h2 
                  className="text-xl font-medium text-gray-800 break-words group cursor-pointer w-full"
                  onClick={() => !isViewOnly && setIsEditingTitle(true)}
                  onDoubleClick={() => !isViewOnly && setIsEditingTitle(true)}
                  title={title}
                >
                  <span className="inline-flex items-start">
                    {title}
                    {!isViewOnly && (
                      <span className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </span>
                    )}
                  </span>
                </h2>
              </div>
            )}
            <button 
              onClick={() => handleSave()}
              className="text-gray-500 hover:text-gray-700 transition-colors todo-icon flex-shrink-0"
              title="Close"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Description */}
          <div className="flex-1 p-6">
            {isViewOnly ? (
              <div className="text-sm whitespace-pre-wrap min-h-[300px] p-4 bg-gray-50 rounded-lg border border-gray-200">
                {description || <span className="text-gray-400 italic">No description</span>}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <label htmlFor="description" className="text-sm font-medium text-gray-500 mb-2">Description</label>
                <textarea
                  id="description"
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="w-full flex-1 min-h-[300px] p-4 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            )}
          </div>
          
          {/* Metadata */}
          <div className="p-6 pt-0 text-xs text-gray-500 space-y-2">
            <div className="flex justify-between">
              <span>Due Date:</span>
              <span className="font-medium">{format(new Date(todo.due_date), 'MMM d, yyyy')}</span>
            </div>
            
            {todo.created_at && (
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{format(new Date(todo.created_at), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {todo.section_name && (
              <div className="flex justify-between">
                <span>Section:</span>
                <span className="font-medium">{todo.section_name}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer with save button */}
        {!isViewOnly && (
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-300 font-medium"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoDescriptionDrawer; 