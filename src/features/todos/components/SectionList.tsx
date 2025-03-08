import React, { useState, useRef, useEffect } from 'react';
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
 * - Allows creating unlimited sections with horizontal scrolling
 * - Organizes todos by section
 * - Provides navigation when there are more than 7 sections
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
  const sectionsContainerRef = useRef<HTMLDivElement>(null);
  
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
  const columnWidth = `${100 / 7}%`; // Match the 7 columns in the upper part
  const columnMinWidth = 160; // Reduced minimum width for more compact look
  
  // Get sections to display - sorted alphabetically
  const allSections = tab.sections
    .slice() // Create a copy to avoid mutating the original array
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  
  // Scroll to the newly created section when sections are updated
  useEffect(() => {
    if (sectionsContainerRef.current && allSections.length > 0) {
      // If there's a new section, scroll to the end to show it
      if (!isViewOnly) {
        sectionsContainerRef.current.scrollLeft = sectionsContainerRef.current.scrollWidth;
      }
    }
  }, [allSections.length, isViewOnly]);
  
  // Handle navigation
  const handlePrevSection = () => {
    if (sectionsContainerRef.current) {
      // Scroll left by one column width
      sectionsContainerRef.current.scrollLeft -= columnMinWidth;
    }
  };
  
  const handleNextSection = () => {
    if (sectionsContainerRef.current) {
      // Scroll right by one column width
      sectionsContainerRef.current.scrollLeft += columnMinWidth;
    }
  };
  
  // Check if we need navigation buttons
  const showNavigation = allSections.length > (isViewOnly ? 7 : 6);
  
  return (
    <div className="flex flex-col h-full">
      {/* Horizontal section layout */}
      <div className="flex flex-1">
        {/* Left navigation button - always show to maintain layout consistency with upper section */}
        <div className="flex items-start justify-center w-6 pt-1 sticky top-0">
          {showNavigation ? (
            <button
              onClick={handlePrevSection}
              className="p-0.5 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              title="Scroll left"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            // Empty spacer to maintain layout
            <div className="w-3 h-3"></div>
          )}
        </div>

        {/* Sections container with horizontal scrolling only */}
        <div 
          ref={sectionsContainerRef}
          className="flex flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
        >
          {/* Display all sections */}
          {allSections.map(section => (
            <div key={section.id} style={{ width: columnWidth, minWidth: `${columnMinWidth}px`, flex: '0 0 auto' }}>
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
          
          {/* Add new section button - always displayed as the last column when not in view-only mode */}
          {!isViewOnly && (
            <div style={{ width: columnWidth, minWidth: `${columnMinWidth}px`, flex: '0 0 auto' }} className="bg-white flex flex-col">
              {isCreatingSection ? (
                <div className="p-2 border-b border-gray-100 sticky top-0 z-10 bg-white">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Section name..."
                    className="px-1.5 py-0.5 border rounded w-full mb-1 text-xs"
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
                      className="bg-purple-700 text-white px-1.5 py-0.5 rounded text-xs"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingSection(false);
                        setNewSectionName('');
                      }}
                      className="ml-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-white sticky top-0 z-10 flex items-center justify-center">
                  <button
                    onClick={() => setIsCreatingSection(true)}
                    className="px-3 py-1 text-xs text-purple-700 hover:text-purple-900 font-medium"
                  >
                    + New Section
                  </button>
                </div>
              )}
              
              {/* Empty content area with no lines or placeholders */}
              <div className="flex-1 bg-white">
                {/* Intentionally left empty */}
              </div>
            </div>
          )}
        </div>
        
        {/* Right navigation button - always show to maintain layout consistency with upper section */}
        <div className="flex items-start justify-center w-6 pt-1 sticky top-0">
          {showNavigation ? (
            <button
              onClick={handleNextSection}
              className="p-0.5 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              title="Scroll right"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            // Empty spacer to maintain layout
            <div className="w-3 h-3"></div>
          )}
        </div>
      </div>
    </div>
  );
}; 