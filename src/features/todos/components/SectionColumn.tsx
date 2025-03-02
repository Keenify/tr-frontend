import React, { useState } from 'react';
import { TodoData, SectionData } from '../types/todo';
import { createTodo, updateTodo, updateSection } from '../services/useTodos';
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
  isViewOnly = false
}) => {
  const [newTodoText, setNewTodoText] = useState('');
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [sectionName, setSectionName] = useState(section.name);
  const minLines = 5;
  const emptyLines = Math.max(minLines - todos.length - (isViewOnly ? 0 : 1), 0);

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

  const startEditing = () => {
    if (isViewOnly) return;
    setIsEditingSection(true);
  };

  return (
    <div 
      className="flex-1 border-r border-gray-200 bg-white overflow-y-auto scrollbar-hide"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Header with section name */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        {isEditingSection ? (
          <input
            title="Section name"
            placeholder="Section name"
            type="text"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            onBlur={handleUpdateSection}
            onKeyDown={handleKeyPress}
            className="w-full px-2 py-1 font-semibold border rounded"
            autoFocus
          />
        ) : (
          <div 
            className="font-semibold text-gray-700"
            onDoubleClick={startEditing}
          >
            {section.name}
          </div>
        )}
      </div>
      
      {/* Content area with fixed height rows */}
      <div>
        {/* All todo items */}
        {todos.map((todo) => (
          <div key={todo.id} className="h-[40px] border-b border-gray-200">
            <TodoItem 
              todo={todo} 
              onUpdate={onTodoUpdated}
              onDelete={onTodoDeleted}
              isViewOnly={isViewOnly}
            />
          </div>
        ))}
        
        {/* Add new todo input - only show if not view only */}
        {!isViewOnly && (
          <div className="h-[40px] border-b border-gray-200">
            <div className="h-full flex items-center px-4">
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
                placeholder="Add new todo..."
                className="w-full outline-none bg-transparent"
              />
            </div>
          </div>
        )}

        {/* Empty lines to fill remaining space */}
        {Array.from({ length: emptyLines }).map((_, index) => (
          <div 
            key={`empty-${index}`} 
            className="h-[40px] border-b border-gray-200"
          />
        ))}
      </div>
    </div>
  );
}; 