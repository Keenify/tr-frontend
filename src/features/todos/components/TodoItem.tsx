import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TodoData } from '../types/todo';
import { updateTodo, deleteTodo } from '../services/useTodos';
import { FaTrash, FaFileAlt, FaBold, FaItalic } from 'react-icons/fa';
import { FaRegSquare, FaRegCheckSquare } from 'react-icons/fa';
import TodoDescriptionDrawer from './TodoDescriptionDrawer';

interface TodoItemProps {
  todo: TodoData;
  onUpdate: (todo: TodoData) => void;
  onDelete: (todoId: string) => void;
  isViewOnly?: boolean;
}

/**
 * Individual todo item component that can be dragged between days
 * This component:
 * - Displays a single todo with its title and color indicator
 * - Handles inline editing of the todo title
 * - Enables drag and drop functionality for moving todos between dates
 * - Updates todo data when changes are made
 * - Provides access to the description drawer
 * - Supports Markdown formatting in todo titles
 * - Provides a formatting menu bar for text selection
 * 
 * @component
 * @param {TodoData} todo - The todo item data
 * @param {Function} onUpdate - Callback when todo is updated
 * @param {Function} onDelete - Callback when todo is deleted
 */
export const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdate, onDelete, isViewOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDescriptionDrawerOpen, setIsDescriptionDrawerOpen] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  // Direct rendering of markdown without using ReactMarkdown
  const renderMarkdown = (text: string) => {
    // Replace __text__ with italic spans
    let result = text.replace(/__([^_]+)__/g, '<span class="italic">$1</span>');
    
    // Replace **text** with bold spans (changed from * to **)
    result = result.replace(/\*\*([^*]+)\*\*/g, '<span class="font-bold">$1</span>');
    
    // Debug log to verify the processing
    if (text.includes('__') || text.includes('**')) {
      console.log('Original:', text);
      console.log('Processed:', result);
    }
    
    return result;
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isViewOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('todoId', todo.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleUpdate = async () => {
    if (title.trim() === '') {
      try {
        await deleteTodo(todo.id);
        onDelete(todo.id);
      } catch (error) {
        console.error('Failed to delete todo:', error);
        setTitle(todo.title);
      }
      return;
    }

    if (title !== todo.title) {
      try {
        const updatedTodo = await updateTodo(todo.id, { title });
        onUpdate(updatedTodo);
      } catch (error) {
        console.error('Failed to update todo:', error);
        setTitle(todo.title);
      }
    }
    setIsEditing(false);
  };

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    try {
      const updatedTodo = await updateTodo(todo.id, { 
        is_completed: !todo.is_completed 
      });
      onUpdate(updatedTodo);
    } catch (error) {
      console.error('Failed to update todo completion:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    try {
      setIsDeleting(true);
      await deleteTodo(todo.id);
      onDelete(todo.id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setIsDeleting(false);
    }
  };

  const handleOpenDescriptionDrawer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    setIsDescriptionDrawerOpen(true);
  };

  // Handle text selection in the input field
  const handleSelectionChange = useCallback(() => {
    if (inputRef.current && isEditing) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      
      if (start !== end) {
        // Text is selected
        // Get the absolute position of the input field
        const inputRect = inputRef.current.getBoundingClientRect();
        
        // Position the menu directly below the input field, aligned with the start of the todo
        setMenuPosition({
          top: inputRect.bottom + window.scrollY + 2, // Just below the input
          left: inputRect.left + window.scrollX + 2, // Aligned with the left edge of the input (plus small offset)
        });
        setShowFormatMenu(true);
      }
      // We don't hide the menu when no text is selected anymore
      // This allows the menu to stay visible
    }
  }, [isEditing]);

  // Check if text has formatting
  const hasFormatting = (text: string, type: 'bold' | 'italic'): boolean => {
    const selectedText = text.trim();
    if (type === 'bold') {
      return selectedText.startsWith('**') && selectedText.endsWith('**');
    } else {
      return selectedText.startsWith('__') && selectedText.endsWith('__');
    }
  };

  // Preserve selection when menu is clicked
  const preserveSelection = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep the menu open and selection active
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Toggle formatting (add or remove)
  const toggleFormatting = (type: 'bold' | 'italic') => {
    if (!inputRef.current) return;
    
    // Get the current selection directly from the input element
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    
    if (start === end) {
      console.log('No text selected');
      return;
    }
    
    // Get the selected text
    const selectedText = title.substring(start, end);
    console.log('Selected text:', selectedText);
    
    // Check if the text already has the formatting
    const prefix = type === 'bold' ? '**' : '__';
    const suffix = type === 'bold' ? '**' : '__';
    
    let newTitle = '';
    let newSelectionStart = start;
    let newSelectionEnd = end;
    
    if (hasFormatting(selectedText, type)) {
      // Remove formatting
      const trimmedText = selectedText.trim();
      const unformattedText = trimmedText.substring(prefix.length, trimmedText.length - suffix.length);
      
      newTitle = 
        title.substring(0, start) + 
        unformattedText + 
        title.substring(end);
      
      // Adjust selection to maintain the same text selected (without formatting)
      newSelectionStart = start;
      newSelectionEnd = start + unformattedText.length;
    } else {
      // Add formatting
      newTitle = 
        title.substring(0, start) + 
        prefix + selectedText + suffix + 
        title.substring(end);
      
      // Adjust selection to maintain the same text selected (without the formatting markers)
      newSelectionStart = start + prefix.length;
      newSelectionEnd = end + prefix.length;
    }
    
    console.log('New title:', newTitle);
    
    // Update the title
    setTitle(newTitle);
    
    // Set focus back to input and maintain the selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newSelectionStart, newSelectionEnd);
      }
    }, 10);
  };

  // Check if current selection has formatting
  const isSelectionFormatted = (type: 'bold' | 'italic'): boolean => {
    if (!inputRef.current) return false;
    
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    
    if (start === end) return false;
    
    const selectedText = title.substring(start, end);
    return hasFormatting(selectedText, type);
  };

  // Close the format menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only close the menu if clicking outside the input and the menu
      const menuElement = document.getElementById('formatting-menu');
      const isClickInMenu = menuElement && menuElement.contains(e.target as Node);
      const isClickInInput = inputRef.current && inputRef.current.contains(e.target as Node);
      
      if (showFormatMenu && !isClickInMenu && !isClickInInput) {
        setShowFormatMenu(false);
      }
    };
    
    const handleGlobalMouseUp = () => {
      if (isEditing && inputRef.current) {
        handleSelectionChange();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [showFormatMenu, isEditing, handleSelectionChange]);

  return (
    <>
      <div
        draggable={!isViewOnly}
        onDragStart={handleDragStart}
        className={`h-full ${!isViewOnly ? 'cursor-move' : ''} hover:bg-gray-50 group grid grid-cols-[24px_1fr] gap-2 items-center pr-1.5`}
      >
        {/* Checkbox column - only visible on hover */}
        {!isViewOnly && (
          <div className="flex justify-center items-center h-full">
            <button
              onClick={handleToggleComplete}
              className={`transition-opacity ${
                todo.is_completed ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'
              } opacity-0 group-hover:opacity-100`}
              title={todo.is_completed ? "Mark as incomplete" : "Mark as complete"}
            >
              {todo.is_completed ? (
                <FaRegCheckSquare size={14} />
              ) : (
                <FaRegSquare size={14} />
              )}
            </button>
          </div>
        )}

        {/* Todo content column */}
        <div className="flex items-center justify-between w-full relative">
          {isEditing && !isViewOnly ? (
            <div className="w-full relative">
              <input
                ref={inputRef}
                title="Todo Title"
                placeholder="Enter Todo Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onSelect={handleSelectionChange}
                onMouseUp={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onBlur={handleUpdate}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
                className="w-full outline-none border-b border-gray-100 py-0.5 text-xs"
                autoFocus
              />
            </div>
          ) : (
            <>
              <div
                onClick={() => !isViewOnly && setIsEditing(true)}
                className={`flex items-center flex-grow min-w-0 overflow-hidden ${!isViewOnly ? 'cursor-pointer' : ''}`}
              >
                <span 
                  className={`text-xs ${todo.is_completed ? 'line-through text-gray-400' : ''}`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(todo.title) }}
                />
              </div>
              {!isViewOnly && (
                <div className="flex items-center">
                  <button
                    onClick={handleOpenDescriptionDrawer}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity mr-2 todo-icon ${
                      todo.description ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                    }`}
                    title="View/edit description"
                  >
                    <FaFileAlt size={12} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity todo-icon ${
                      isDeleting ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                    title="Delete todo"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Formatting menu - rendered in a portal to avoid layout issues */}
      {showFormatMenu && isEditing && createPortal(
        <div 
          id="formatting-menu"
          className="fixed bg-white shadow-lg rounded-md flex items-center p-1.5 border border-gray-200 z-50"
          style={{ 
            top: `${menuPosition.top}px`, 
            left: `${menuPosition.left}px`,
            transform: 'none', // Remove the centering transform
          }}
          onMouseDown={preserveSelection}
        >
          {/* Arrow pointing up to the text - positioned at the left */}
          <div 
            className="absolute w-3 h-3 bg-white border-t border-l border-gray-200 transform -translate-y-1/2 rotate-45"
            style={{ top: '-2px', left: '10px' }}
          />
          
          <button 
            className={`p-1.5 hover:bg-gray-100 rounded mx-0.5 ${
              isSelectionFormatted('bold') 
                ? 'bg-gray-200 text-black' 
                : 'text-gray-700 hover:text-black'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFormatting('bold');
            }}
            title="Bold"
            type="button"
          >
            <FaBold size={14} />
          </button>
          <button 
            className={`p-1.5 hover:bg-gray-100 rounded mx-0.5 ${
              isSelectionFormatted('italic') 
                ? 'bg-gray-200 text-black' 
                : 'text-gray-700 hover:text-black'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFormatting('italic');
            }}
            title="Italic"
            type="button"
          >
            <FaItalic size={14} />
          </button>
        </div>,
        document.body
      )}

      {/* Description Drawer */}
      <TodoDescriptionDrawer
        todo={todo}
        isOpen={isDescriptionDrawerOpen}
        onClose={() => setIsDescriptionDrawerOpen(false)}
        onUpdate={onUpdate}
        isViewOnly={isViewOnly}
      />
    </>
  );
};