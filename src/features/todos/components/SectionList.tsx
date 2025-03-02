import React, { useState } from 'react';
import { TodoData, TabData } from '../types/todo';
import { createSection } from '../services/useTodos';
import { SectionColumn } from './SectionColumn';

interface SectionListProps {
  tab: TabData;
  todos: TodoData[];
  employeeId: string;
  companyId: string;
  onTodoCreated: (todo: TodoData) => void;
  onTodoUpdated: (todo: TodoData) => void;
  onTodoDeleted: (todoId: string) => void;
  onSectionCreated: () => void;
  onSectionUpdated?: () => void;
  onSectionDeleted?: () => void;
  isViewOnly?: boolean;
}

/**
 * Component for displaying sections within a tab
 * This component:
 * - Displays sections as horizontal columns (similar to day columns)
 * - Allows creating new sections
 * - Organizes todos by section
 * 
 * @component
 * @param {TabData} tab - The active tab
 * @param {TodoData[]} todos - Array of todos for this tab
 * @param {string} employeeId - Current employee's ID
 * @param {string} companyId - Current company's ID
 * @param {Function} onTodoCreated - Callback when a new todo is created
 * @param {Function} onTodoUpdated - Callback when a todo is updated
 * @param {Function} onTodoDeleted - Callback when a todo is deleted
 * @param {Function} onSectionCreated - Callback when a new section is created
 * @param {Function} onSectionUpdated - Callback when a section is updated
 * @param {Function} onSectionDeleted - Callback when a section is deleted
 * @param {boolean} isViewOnly - Whether the component is in view-only mode
 */
export const SectionList: React.FC<SectionListProps> = ({
  tab,
  todos,
  employeeId,
  companyId,
  onTodoCreated,
  onTodoUpdated,
  onTodoDeleted,
  onSectionCreated,
  onSectionUpdated,
  onSectionDeleted,
  isViewOnly = false
}) => {
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const handleCreateSection = async () => {
    if (newSectionName.trim() === '') return;
    
    try {
      await createSection({
        name: newSectionName,
        tab_id: tab.id,
        employee_id: employeeId
      });
      
      setNewSectionName('');
      setIsCreatingSection(false);
      
      onSectionCreated();
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  // Group todos by section
  const todosBySection = tab.sections.reduce((acc, section) => {
    acc[section.id] = todos.filter(todo => todo.section_id === section.id);
    return acc;
  }, {} as Record<string, TodoData[]>);

  // Calculate the number of columns including the "New Section" column if not in view-only mode
  const columnWidth = `${100 / 5}%`; // Match the 5 columns in the upper part
  
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col h-full">
        {/* Horizontal section layout */}
        <div className="flex flex-1 overflow-x-auto scrollbar-hide">
          {tab.sections
            .slice() // Create a copy to avoid mutating the original array
            .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
            .map(section => (
              <div key={section.id} style={{ width: columnWidth }}>
                <SectionColumn
                  section={section}
                  todos={todosBySection[section.id] || []}
                  employeeId={employeeId}
                  companyId={companyId}
                  onTodoCreated={onTodoCreated}
                  onTodoUpdated={onTodoUpdated}
                  onTodoDeleted={onTodoDeleted}
                  onSectionUpdated={onSectionUpdated}
                  onSectionDeleted={onSectionDeleted || onSectionUpdated}
                  isViewOnly={isViewOnly}
                />
              </div>
            ))}
          
          {/* Add new section button - displayed as a column */}
          {!isViewOnly && (
            <div style={{ width: columnWidth }} className="border-r border-gray-200 bg-white">
              {isCreatingSection ? (
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Section name..."
                    className="px-2 py-1 border rounded w-full mb-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateSection();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex">
                    <button
                      onClick={handleCreateSection}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingSection(false);
                        setNewSectionName('');
                      }}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 border-b border-gray-200 bg-gray-50 h-full flex items-start justify-center">
                  <button
                    onClick={() => setIsCreatingSection(true)}
                    className="px-3 py-1 text-blue-500 hover:text-blue-700"
                  >
                    + New Section
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 