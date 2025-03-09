import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TodoData, SectionData } from '../types/todo';
import { createTodo, updateTodo, updateSection, deleteSection } from '../services/useTodos';
import { TodoItem } from './TodoItem';

interface SectionColumnProps {
  section: SectionData;
  todos: TodoData[];
  employeeId: string;
  companyId: string;
  onTodoCreated: (todo: TodoData) => void;
  onTodoUpdated: (todo: TodoData) => void;
  onTodoDeleted: (todoId: string) => void;
  onSectionUpdated?: () => void;
  onSectionDeleted?: () => void;
  isViewOnly?: boolean;
}

/**
 * Component for displaying a single section column
 * This component:
 * - Displays todos for a specific section
 * - Handles creation of new todos for that section
 * - Manages drag and drop functionality for moving todos between sections
 * 
 * @component
 * @param {SectionData} section - The section this column represents
 * @param {TodoData[]} todos - Array of todos for this section
 * @param {string} employeeId - Current employee's ID
 * @param {string} companyId - Current company's ID
 * @param {Function} onTodoCreated - Callback when a new todo is created
 * @param {Function} onTodoUpdated - Callback when a todo is updated
 * @param {Function} onTodoDeleted - Callback when a todo is deleted
 * @param {Function} onSectionUpdated - Callback when the section is updated
 * @param {Function} onSectionDeleted - Callback when the section is deleted
 * @param {boolean} isViewOnly - Whether the component is in view-only mode
 */
export const SectionColumn: React.FC<SectionColumnProps> = ({
  section,
  todos,
  employeeId,
  companyId,
  onTodoCreated,
  onTodoUpdated,
  onTodoDeleted,
  onSectionUpdated,
  onSectionDeleted,
  isViewOnly = false
}) => {
  const [newTodoText, setNewTodoText] = useState('');
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [sectionName, setSectionName] = useState(section.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const minLines = 10; // Reduced to 10 max empty lines
  const emptyLines = Math.max(minLines - todos.length - (isViewOnly ? 0 : 1), 0); // -1 for input row

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen) {
        const isMenuButtonClick = menuButtonRef.current && 
          menuButtonRef.current.contains(event.target as Node);
        
        const menuElement = document.getElementById('section-dropdown-menu');
        const isMenuClick = menuElement && menuElement.contains(event.target as Node);
        
        if (!isMenuButtonClick && !isMenuClick) {
          setMenuOpen(false);
          setMenuPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const createNewTodo = async () => {
    if (newTodoText.trim()) {
      try {
        console.log('Creating todo in section:', section.id);
        
        const payload = {
          title: newTodoText,
          description: '',
          color_code: '#7924C2',
          employee_id: employeeId,
          company_id: companyId,
          section_id: section.id
        };
        
        console.log('Todo payload:', JSON.stringify(payload, null, 2));
        
        const newTodo = await createTodo(payload);
        setNewTodoText('');
        onTodoCreated(newTodo);
      } catch (error) {
        console.error('Failed to create todo:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdateSection();
    } else if (e.key === 'Escape') {
      setIsEditingSection(false);
      setSectionName(section.name);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (isViewOnly) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    const todoId = e.dataTransfer.getData('todoId');
    
    try {
      const updatedTodo = await updateTodo(todoId, {
        section_id: section.id
      });
      onTodoUpdated(updatedTodo);
    } catch (error) {
      console.error('Failed to update todo section:', error);
    }
  };

  const handleUpdateSection = async () => {
    if (sectionName.trim() === '' || sectionName === section.name) {
      setIsEditingSection(false);
      setSectionName(section.name);
      return;
    }
    
    try {
      await updateSection(section.id, {
        name: sectionName
      });
      
      setIsEditingSection(false);
      
      if (onSectionUpdated) {
        setTimeout(() => {
          onSectionUpdated();
        }, 10);
      }
    } catch (error) {
      console.error('Failed to update section:', error);
      setSectionName(section.name);
      setIsEditingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    try {
      setMenuOpen(false);
      
      await deleteSection(section.id);
      
      if (onSectionDeleted) {
        onSectionDeleted();
      } else if (onSectionUpdated) {
        onSectionUpdated();
      }
    } catch (error) {
      console.error('Failed to delete section:', error);
      alert('Failed to delete section. Please try again later.');
    }
  };

  const toggleMenu = () => {
    if (isViewOnly) return;
    
    if (menuOpen) {
      setMenuOpen(false);
      setMenuPosition(null);
    } else {
      setMenuOpen(true);
      if (menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
    }
  };

  const startEditing = () => {
    if (isViewOnly) return;
    setMenuOpen(false);
    setIsEditingSection(true);
  };

  // Handle blur event for new todo input
  const handleBlur = async () => {
    await createNewTodo();
  };

  // Render dropdown menu in a portal
  const renderMenu = () => {
    if (!menuOpen || !menuPosition) return null;
    
    return createPortal(
      <div 
        id="section-dropdown-menu"
        className="fixed bg-white rounded-md shadow-lg z-50 border border-gray-200"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          width: '12rem'
        }}
      >
        <div className="py-1">
          <button
            onClick={startEditing}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteSection}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div 
      className="flex-1 border-r border-gray-100 bg-white flex flex-col"
      style={{ width: '14.28%', minWidth: '160px', flex: '0 0 auto' }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Header with section name */}
      <div className="py-1 px-2 border-b border-gray-100 bg-white group sticky top-0 z-10">
        <div className="flex items-center">
          {!isViewOnly && (
            <button
              ref={menuButtonRef}
              onClick={toggleMenu}
              className="mr-1 focus:outline-none rounded-full p-0.5 transition-colors duration-150 text-gray-600 hover:bg-gray-300 hover:text-gray-800 opacity-0 group-hover:opacity-100"
              aria-label="Section options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          )}
          
          {isEditingSection ? (
            <input
              title="Section name"
              placeholder="Section name"
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              onBlur={handleUpdateSection}
              onKeyDown={handleKeyPress}
              className="w-full px-1 py-0.5 text-xs font-medium border rounded"
              autoFocus
            />
          ) : (
            <div 
              className="font-medium text-xs text-gray-700 flex-grow uppercase"
              onDoubleClick={startEditing}
            >
              {section.name}
            </div>
          )}
        </div>
      </div>
      
      {/* Content area with todos that can extend */}
      <div className="flex flex-col bg-white">
        {/* All todo items */}
        <div>
          {todos.map((todo) => (
            <div key={todo.id} className="h-[28px] relative">
              <div className="absolute bottom-0 left-[24px] right-0 border-b border-gray-100"></div>
              <TodoItem 
                todo={todo} 
                onUpdate={onTodoUpdated}
                onDelete={onTodoDeleted}
                isViewOnly={isViewOnly}
              />
            </div>
          ))}
          
          {/* Add new todo input - positioned right after the last todo */}
          {!isViewOnly && (
            <div className="h-[28px] relative">
              <div className="absolute bottom-0 left-[24px] right-0 border-b border-gray-100"></div>
              <div className="h-full grid grid-cols-[24px_1fr] gap-2 items-center">
                <div className="flex justify-center items-center h-full">
                  {/* Empty space to align with checkbox column */}
                </div>
                <div className="flex items-center pr-2">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        createNewTodo();
                      }
                    }}
                    onBlur={handleBlur}
                    placeholder="Add new todo..."
                    className="w-full outline-none bg-transparent text-xs"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Empty lines to fill remaining space - styled like note paper with visible lines */}
          {Array.from({ length: emptyLines }).map((_, index) => (
            <div 
              key={`empty-${index}`} 
              className="h-[28px] relative"
            >
              <div className="absolute bottom-0 left-[24px] right-0 border-b border-gray-100"></div>
            </div>
          ))}
        </div>
      </div>
      
      {renderMenu()}
    </div>
  );
}; 