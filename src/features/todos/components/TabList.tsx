import React, { useState } from 'react';
import { TabData } from '../types/todo';
import { createTab, updateTab } from '../services/useTodos';

interface TabListProps {
  tabs: TabData[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  employeeId: string;
  companyId: string;
  onTabCreated: () => void;
  onTabUpdated?: () => void;
  isViewOnly?: boolean;
}

/**
 * Component for displaying and managing tabs
 * This component:
 * - Displays a list of tabs as a horizontal navigation
 * - Allows creating new tabs
 * - Handles tab selection
 * 
 * @component
 * @param {TabData[]} tabs - Array of tabs
 * @param {string | null} activeTabId - ID of the currently active tab
 * @param {Function} onTabChange - Callback when tab selection changes
 * @param {string} employeeId - Current employee's ID
 * @param {string} companyId - Current company's ID
 * @param {Function} onTabCreated - Callback when a new tab is created
 * @param {Function} onTabUpdated - Callback when a tab is updated
 * @param {boolean} isViewOnly - Whether the component is in view-only mode
 */
export const TabList: React.FC<TabListProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  employeeId,
  companyId,
  onTabCreated,
  onTabUpdated,
  isViewOnly = false
}) => {
  const [isCreatingTab, setIsCreatingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');

  const handleCreateTab = async () => {
    if (newTabName.trim() === '') return;
    
    try {
      const newTab = await createTab({
        name: newTabName,
        company_id: companyId,
        employee_id: employeeId
      });
      
      onTabChange(newTab.id);
      setNewTabName('');
      setIsCreatingTab(false);
      
      onTabCreated();
    } catch (error) {
      console.error('Failed to create tab:', error);
    }
  };

  const handleUpdateTab = async (tabId: string) => {
    if (editingTabName.trim() === '' || editingTabName === tabs.find(t => t.id === tabId)?.name) {
      setEditingTabId(null);
      setEditingTabName('');
      return;
    }
    
    try {
      await updateTab(tabId, {
        name: editingTabName
      });
      
      setEditingTabId(null);
      setEditingTabName('');
      
      if (onTabUpdated) {
        onTabUpdated();
      } else {
        onTabCreated();
      }
    } catch (error) {
      console.error('Failed to update tab:', error);
      setEditingTabId(null);
      setEditingTabName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter') {
      handleUpdateTab(tabId);
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditingTabName('');
    }
  };

  const startEditing = (tab: TabData) => {
    if (isViewOnly) return;
    setEditingTabId(tab.id);
    setEditingTabName(tab.name);
  };

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center px-4 py-2 overflow-x-auto">
        {tabs
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(tab => (
            <div
              key={tab.id}
              className={`px-4 py-2 mr-2 rounded-t-lg font-medium ${
                activeTabId === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {editingTabId === tab.id ? (
                <input
                  title="Tab name"
                  placeholder="Tab name"
                  type="text"
                  value={editingTabName}
                  onChange={(e) => setEditingTabName(e.target.value)}
                  onBlur={() => handleUpdateTab(tab.id)}
                  onKeyDown={(e) => handleKeyPress(e, tab.id)}
                  className="px-2 py-1 bg-white text-gray-800 border rounded w-full"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => onTabChange(tab.id)}
                  onDoubleClick={() => startEditing(tab)}
                  className="w-full text-left"
                >
                  {tab.name}
                </button>
              )}
            </div>
          ))}
        
        {!isViewOnly && (
          isCreatingTab ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="Tab name..."
                className="px-2 py-1 border rounded-l"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTab()}
                autoFocus
              />
              <button
                onClick={handleCreateTab}
                className="bg-blue-500 text-white px-2 py-1 rounded-r"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsCreatingTab(false);
                  setNewTabName('');
                }}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingTab(true)}
              className="px-3 py-1 text-blue-500 hover:text-blue-700"
            >
              + New Tab
            </button>
          )
        )}
      </div>
    </div>
  );
}; 