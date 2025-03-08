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
  const [description, setDescription] = useState(todo.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update local state when todo changes
  useEffect(() => {
    setDescription(todo.description || '');
  }, [todo]);
  
  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen && textareaRef.current && !isViewOnly) {
      textareaRef.current.focus();
    }
  }, [isOpen, isViewOnly]);
  
  const handleSave = useCallback(async () => {
    if (description === todo.description) {
      onClose();
      return;
    }
    
    try {
      setIsSaving(true);
      const updatedTodo = await updateTodo(todo.id, { description });
      onUpdate(updatedTodo);
      onClose();
    } catch (error) {
      console.error('Failed to update todo description:', error);
    } finally {
      setIsSaving(false);
    }
  }, [description, todo.description, todo.id, onClose, onUpdate]);
  
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
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-xl font-medium text-gray-800 truncate flex-1">{todo.title}</h2>
          <button 
            onClick={() => handleSave()}
            className="text-gray-500 hover:text-gray-700 transition-colors todo-icon ml-4"
            title="Close"
          >
            <FaTimes size={18} />
          </button>
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
              {isSaving ? 'Saving...' : 'Save Description'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoDescriptionDrawer; 