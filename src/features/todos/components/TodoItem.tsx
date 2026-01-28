import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TodoData, UpdateTodoPayload } from '../types/todo';
import { updateTodo, deleteTodo } from '../services/useTodos';
import { FaTrash, FaFileAlt, FaBold, FaItalic, FaHighlighter } from 'react-icons/fa';
import { FaRegSquare, FaRegCheckSquare } from 'react-icons/fa';
import TodoDescriptionDrawer from './TodoDescriptionDrawer';

interface TodoItemProps {
  todo: TodoData;
  onUpdate: (todo: TodoData) => void;
  onDelete: (todoId: string) => void;
  isViewOnly?: boolean;
}

// Highlight colors
const HIGHLIGHT_COLORS = {
  blue: 'bg-blue-100',
  red: 'bg-red-100',
  green: 'bg-green-100',
  yellow: 'bg-yellow-100',
};

type HighlightColor = keyof typeof HIGHLIGHT_COLORS;

// Color code to highlight color mapping
const COLOR_CODE_TO_HIGHLIGHT: Record<string, HighlightColor> = {
  '#1E88E5': 'blue',
  '#E53935': 'red',
  '#43A047': 'green',
  '#FDD835': 'yellow',
};

// Highlight color to color code mapping
const HIGHLIGHT_TO_COLOR_CODE: Record<HighlightColor, string> = {
  blue: '#1E88E5',
  red: '#E53935',
  green: '#43A047',
  yellow: '#FDD835',
};

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
 * - Supports text highlighting in four colors
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
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get highlight color from color_code
  const getHighlightColorFromCode = useCallback((colorCode: string): HighlightColor | null => {
    return COLOR_CODE_TO_HIGHLIGHT[colorCode] || null;
  }, []);
  
  const [activeHighlightColor, setActiveHighlightColor] = useState<HighlightColor | null>(
    getHighlightColorFromCode(todo.color_code)
  );

  // Update title and activeHighlightColor when todo changes
  useEffect(() => {
    setTitle(todo.title);
    setActiveHighlightColor(getHighlightColorFromCode(todo.color_code));
  }, [todo, getHighlightColorFromCode]);

  // Direct rendering of markdown without using ReactMarkdown
  const renderMarkdown = (text: string) => {
    // Replace __text__ with italic spans
    let result = text.replace(/__([^_]+)__/g, '<span class="italic">$1</span>');
    
    // Replace **text** with bold spans (changed from * to **)
    result = result.replace(/\*\*([^*]+)\*\*/g, '<span class="font-bold">$1</span>');
    
    return result;
  };

  // Handle text selection in the input field
  const handleSelectionChange = useCallback(() => {
    if (inputRef.current && isEditing) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      
      if (start !== end) {
        // Text is selected
        setSelectionRange({start, end});
        
        // Get the absolute position of the input field
        const inputRect = inputRef.current.getBoundingClientRect();
        
        // Position the menu directly below the input field, aligned with the start of the todo
        setMenuPosition({
          top: inputRect.bottom + window.scrollY + 2, // Just below the input
          left: inputRect.left + window.scrollX + 2, // Aligned with the left edge of the input (plus small offset)
        });
        setShowFormatMenu(true);
        
        // Check if the selected text is surrounded by bold or italic markers
        // This checks the characters before and after the selection
        const fullText = title;
        
        // Check for bold formatting
        const hasBoldBefore = start >= 2 && fullText.substring(start - 2, start) === '**';
        const hasBoldAfter = end + 2 <= fullText.length && fullText.substring(end, end + 2) === '**';
        setIsBoldActive(hasBoldBefore && hasBoldAfter);
        
        // Check for italic formatting
        const hasItalicBefore = start >= 2 && fullText.substring(start - 2, start) === '__';
        const hasItalicAfter = end + 2 <= fullText.length && fullText.substring(end, end + 2) === '__';
        setIsItalicActive(hasItalicBefore && hasItalicAfter);
        
        // Check for highlight formatting - we only need to check if the entire todo has a highlight
        const highlightColor = getHighlightColorFromCode(todo.color_code);
        setActiveHighlightColor(highlightColor);
      } else {
        setSelectionRange(null);
      }
    }
  }, [isEditing, title, getHighlightColorFromCode, todo.color_code]);

  // Apply bold formatting
  const toggleBold = () => {
    if (!inputRef.current || !selectionRange) return;
    
    const {start, end} = selectionRange;
    const selectedText = title.substring(start, end);
    
    let newTitle;
    let newStart = start;
    let newEnd = end;
    
    if (isBoldActive) {
      // Remove bold formatting - remove the ** markers around the selection
      newTitle = 
        title.substring(0, start - 2) + 
        selectedText + 
        title.substring(end + 2);
      
      newStart = start - 2;
      newEnd = end - 2;
      setIsBoldActive(false);
    } else {
      // Add bold formatting
      newTitle = 
        title.substring(0, start) + 
        `**${selectedText}**` + 
        title.substring(end);
      
      newStart = start + 2;
      newEnd = end + 2;
      setIsBoldActive(true);
    }
    
    setTitle(newTitle);
    
    // Update selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newStart, newEnd);
        setSelectionRange({start: newStart, end: newEnd});
      }
    }, 10);
  };

  // Apply italic formatting
  const toggleItalic = () => {
    if (!inputRef.current || !selectionRange) return;
    
    const {start, end} = selectionRange;
    const selectedText = title.substring(start, end);
    
    let newTitle;
    let newStart = start;
    let newEnd = end;
    
    if (isItalicActive) {
      // Remove italic formatting - remove the __ markers around the selection
      newTitle = 
        title.substring(0, start - 2) + 
        selectedText + 
        title.substring(end + 2);
      
      newStart = start - 2;
      newEnd = end - 2;
      setIsItalicActive(false);
    } else {
      // Add italic formatting
      newTitle = 
        title.substring(0, start) + 
        `__${selectedText}__` + 
        title.substring(end);
      
      newStart = start + 2;
      newEnd = end + 2;
      setIsItalicActive(true);
    }
    
    setTitle(newTitle);
    
    // Update selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newStart, newEnd);
        setSelectionRange({start: newStart, end: newEnd});
      }
    }, 10);
  };

  // Apply highlight formatting to the entire todo
  const applyHighlight = (color: HighlightColor) => {
    if (!inputRef.current) return;
    
    let newHighlightColor: HighlightColor | null = null;
    let newColorCode: string = '#7924C2'; // Default purple color
    
    if (activeHighlightColor === color) {
      // Remove highlight formatting
      newHighlightColor = null;
      
      // Close the highlight menu after removing highlight
      setShowHighlightMenu(false);
    } else {
      // Apply new highlight formatting
      newColorCode = HIGHLIGHT_TO_COLOR_CODE[color];
      newHighlightColor = color;
      
      // Keep the highlight menu open when switching colors
      // This allows users to see the color change immediately and try different colors
    }
    
    // Update state
    setActiveHighlightColor(newHighlightColor);
    
    // Immediately update the todo in the API
    (async () => {
      try {
        const updatedPayload: UpdateTodoPayload = { 
          color_code: newHighlightColor ? HIGHLIGHT_TO_COLOR_CODE[newHighlightColor] : newColorCode 
        };
        const updatedTodo = await updateTodo(todo.id, updatedPayload);
        onUpdate(updatedTodo);
      } catch {
        setActiveHighlightColor(getHighlightColorFromCode(todo.color_code));
      }
    })();
    
    // Force a re-render to update the highlight immediately
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isViewOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('todoId', todo.id);
    // Add source info for detecting within-column drops
    e.dataTransfer.setData('sourceDate', todo.due_date || '');
    e.dataTransfer.setData('sourceSection', todo.section_id || '');
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleUpdate = async () => {
    if (title.trim() === '') {
      try {
        await deleteTodo(todo.id);
        onDelete(todo.id);
      } catch {
        setTitle(todo.title);
      }
      return;
    }

    try {
      const updatedPayload: UpdateTodoPayload = { title };
      
      // Add color_code to the update payload if a highlight color is active
      if (activeHighlightColor) {
        const newColorCode = HIGHLIGHT_TO_COLOR_CODE[activeHighlightColor];
        updatedPayload.color_code = newColorCode;
      } else if (activeHighlightColor === null && todo.color_code in COLOR_CODE_TO_HIGHLIGHT) {
        // If highlight was removed, update color_code to default
        updatedPayload.color_code = '#7924C2'; // Default purple color
      }
      
      const updatedTodo = await updateTodo(todo.id, updatedPayload);
      onUpdate(updatedTodo);
    } catch {
      setTitle(todo.title);
      setActiveHighlightColor(getHighlightColorFromCode(todo.color_code));
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
    } catch {
      // Silently handle error
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    try {
      setIsDeleting(true);
      await deleteTodo(todo.id);
      onDelete(todo.id);
    } catch {
      setIsDeleting(false);
    }
  };

  const handleOpenDescriptionDrawer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    setIsDescriptionDrawerOpen(true);
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

  // Toggle highlight menu
  const toggleHighlightMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowHighlightMenu(!showHighlightMenu);
  };

  // Close the format menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only close the menu if clicking outside the input and the menu
      const menuElement = document.getElementById('formatting-menu');
      const highlightMenuElement = document.getElementById('highlight-menu');
      const isClickInMenu = menuElement && menuElement.contains(e.target as Node);
      const isClickInHighlightMenu = highlightMenuElement && highlightMenuElement.contains(e.target as Node);
      const isClickInInput = inputRef.current && inputRef.current.contains(e.target as Node);
      
      if (showFormatMenu && !isClickInMenu && !isClickInHighlightMenu && !isClickInInput) {
        setShowFormatMenu(false);
        setShowHighlightMenu(false);
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
  }, [showFormatMenu, showHighlightMenu, isEditing, handleSelectionChange]);

  // Get the highlight color for the row
  const rowHighlightColor = getHighlightColorFromCode(todo.color_code);
  const rowHighlightClass = rowHighlightColor ? HIGHLIGHT_COLORS[rowHighlightColor] : '';

  return (
    <>
      <div
        draggable={!isViewOnly}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`h-full ${!isViewOnly ? 'cursor-move' : ''} hover:bg-gray-50 group ${isViewOnly ? 'grid grid-cols-[1fr]' : 'grid grid-cols-[24px_1fr]'} gap-2 items-center pr-1.5 ${rowHighlightClass} overflow-hidden ${
          isDragging ? 'opacity-50 shadow-inner bg-gray-100 border border-dashed border-gray-300' : ''
        }`}
      >
        {/* Checkbox column - only visible when not in view-only mode */}
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
        <div className="flex items-center justify-between w-full relative overflow-hidden">
          {isEditing && !isViewOnly ? (
            <div className="w-full relative">
              <input
                ref={inputRef}
                title="Todo Title"
                placeholder="Enter Todo Title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                onSelect={handleSelectionChange}
                onMouseUp={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onBlur={handleUpdate}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
                className={`w-full outline-none border-b border-gray-100 py-0.5 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${
                  activeHighlightColor ? HIGHLIGHT_COLORS[activeHighlightColor] : ''
                }`}
                autoFocus
              />
            </div>
          ) : (
            <>
              <div
                onClick={() => !isViewOnly && setIsEditing(true)}
                className={`flex items-center flex-grow min-w-0 overflow-hidden max-w-full ${!isViewOnly ? 'cursor-pointer' : ''}`}
              >
                {isViewOnly && todo.is_completed && (
                  <span className="mr-2 text-green-500">
                    <FaRegCheckSquare size={12} />
                  </span>
                )}
                <span 
                  className={`text-xs whitespace-nowrap overflow-hidden text-ellipsis w-full block ${todo.is_completed ? 'line-through text-gray-400' : ''}`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(todo.title) }}
                  title={title}
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
              isBoldActive ? 'bg-gray-200 text-black' : 'text-gray-700 hover:text-black'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleBold();
            }}
            title="Bold"
            type="button"
          >
            <FaBold size={14} />
          </button>
          <button 
            className={`p-1.5 hover:bg-gray-100 rounded mx-0.5 ${
              isItalicActive ? 'bg-gray-200 text-black' : 'text-gray-700 hover:text-black'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItalic();
            }}
            title="Italic"
            type="button"
          >
            <FaItalic size={14} />
          </button>
          <button 
            className={`p-1.5 hover:bg-gray-100 rounded mx-0.5 ${
              activeHighlightColor ? 'bg-gray-200 text-black' : 'text-gray-700 hover:text-black'
            }`}
            onMouseDown={toggleHighlightMenu}
            title="Highlight"
            type="button"
          >
            <FaHighlighter size={14} />
          </button>
        </div>,
        document.body
      )}

      {/* Highlight color menu */}
      {showHighlightMenu && isEditing && createPortal(
        <div 
          id="highlight-menu"
          className="fixed bg-white shadow-lg rounded-md flex flex-col p-2 border border-gray-200 z-50"
          style={{ 
            top: `${menuPosition.top + 40}px`, 
            left: `${menuPosition.left}px`,
          }}
          onMouseDown={preserveSelection}
        >
          <div className="text-xs font-medium text-gray-500 mb-2">HIGHLIGHT</div>
          <div className="flex flex-col space-y-1">
            <button 
              className={`px-2 py-1 rounded text-xs flex items-center justify-between ${
                activeHighlightColor === 'blue' ? 'bg-blue-200' : 'bg-blue-100 hover:bg-blue-200'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                applyHighlight('blue');
              }}
            >
              <span>Blue</span>
              {activeHighlightColor === 'blue' && <span>✓</span>}
            </button>
            <button 
              className={`px-2 py-1 rounded text-xs flex items-center justify-between ${
                activeHighlightColor === 'red' ? 'bg-red-200' : 'bg-red-100 hover:bg-red-200'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                applyHighlight('red');
              }}
            >
              <span>Red</span>
              {activeHighlightColor === 'red' && <span>✓</span>}
            </button>
            <button 
              className={`px-2 py-1 rounded text-xs flex items-center justify-between ${
                activeHighlightColor === 'green' ? 'bg-green-200' : 'bg-green-100 hover:bg-green-200'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                applyHighlight('green');
              }}
            >
              <span>Green</span>
              {activeHighlightColor === 'green' && <span>✓</span>}
            </button>
            <button 
              className={`px-2 py-1 rounded text-xs flex items-center justify-between ${
                activeHighlightColor === 'yellow' ? 'bg-yellow-200' : 'bg-yellow-100 hover:bg-yellow-200'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                applyHighlight('yellow');
              }}
            >
              <span>Yellow</span>
              {activeHighlightColor === 'yellow' && <span>✓</span>}
            </button>
          </div>
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