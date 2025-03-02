import React, { useEffect, useState, useCallback } from 'react';
import { TodoData, TabData } from '../types/todo';
import { getEmployeeTabs } from '../services/useTodos';
import { TabList } from './TabList';
import { SectionList } from './SectionList';

interface TodoSectionProps {
  todos: TodoData[];
  employeeId: string;
  companyId: string;
  onTodoCreated: (todo: TodoData) => void;
  onTodoUpdated: (todo: TodoData) => void;
  onTodoDeleted: (todoId: string) => void;
  isViewOnly?: boolean;
}

/**
 * Component for displaying section-based todos
 * This component:
 * - Fetches and displays tabs and their sections
 * - Organizes todos by sections within tabs
 * - Allows creating new todos within sections
 * 
 * @component
 * @param {TodoData[]} todos - Array of todos with section IDs
 * @param {string} employeeId - Current employee's ID
 * @param {string} companyId - Current company's ID
 * @param {Function} onTodoCreated - Callback when a new todo is created
 * @param {Function} onTodoUpdated - Callback when a todo is updated
 * @param {Function} onTodoDeleted - Callback when a todo is deleted
 * @param {boolean} isViewOnly - Whether the component is in view-only mode
 */
export const TodoSection: React.FC<TodoSectionProps> = ({
  todos,
  employeeId,
  companyId,
  onTodoCreated,
  onTodoUpdated,
  onTodoDeleted,
  isViewOnly = false
}) => {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch tabs for the employee
  const fetchTabs = useCallback(async () => {
    if (!employeeId) return;
    
    try {
      setLoading(true);
      const fetchedTabs = await getEmployeeTabs(employeeId);
      setTabs(fetchedTabs);
      
      // Set the first tab as active if there are tabs
      if (fetchedTabs.length > 0) {
        setActiveTabId(fetchedTabs[0].id);
      } else {
        setActiveTabId(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tabs:', error);
      setLoading(false);
    }
  }, [employeeId]);

  // Reset active tab and fetch new tabs when employee changes
  useEffect(() => {
    setActiveTabId(null);
    fetchTabs();
  }, [employeeId, fetchTabs]);

  // Handle tab creation or update
  const handleTabChange = useCallback(() => {
    fetchTabs();
  }, [fetchTabs]);

  // Handle section creation or update
  const handleSectionChange = useCallback(() => {
    // Save the current active tab ID
    const currentActiveTabId = activeTabId;
    
    // Fetch tabs and then restore the active tab
    fetchTabs().then(() => {
      if (currentActiveTabId) {
        setActiveTabId(currentActiveTabId);
      }
    });
  }, [fetchTabs, activeTabId]);

  if (loading && tabs.length === 0) {
    return <div className="p-4">Loading sections...</div>;
  }

  // Get the active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="h-full flex flex-col">
      {/* Tab navigation */}
      <TabList 
        tabs={tabs} 
        activeTabId={activeTabId} 
        onTabChange={setActiveTabId}
        employeeId={employeeId}
        companyId={companyId}
        onTabCreated={handleTabChange}
        onTabUpdated={handleTabChange}
        isViewOnly={isViewOnly}
      />
      
      {/* Sections for the active tab */}
      {activeTab && (
        <SectionList
          tab={activeTab}
          todos={todos.filter(todo => 
            // Find todos that belong to sections in the active tab
            activeTab.sections.some(section => section.id === todo.section_id)
          )}
          employeeId={employeeId}
          companyId={companyId}
          onTodoCreated={onTodoCreated}
          onTodoUpdated={onTodoUpdated}
          onTodoDeleted={onTodoDeleted}
          onSectionCreated={handleSectionChange}
          onSectionUpdated={handleSectionChange}
          isViewOnly={isViewOnly}
        />
      )}
    </div>
  );
}; 