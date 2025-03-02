import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TabData } from '../types/todo';
import { createTab, updateTab, deleteTab } from '../services/useTodos';

interface TabListProps {
  tabs: TabData[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  employeeId: string;
  companyId: string;
  onTabCreated: () => void;
  onTabUpdated?: () => void;
  onTabDeleted?: () => void;
  isViewOnly?: boolean;
}

/**
 * Component for displaying and managing tabs
 * This component:
 * - Displays a list of tabs as a horizontal navigation
 * - Allows creating new tabs
 * - Handles tab selection
 * - Allows editing and deleting tabs
 * 
 * @component
 * @param {TabData[]} tabs - Array of tabs
 * @param {string | null} activeTabId - ID of the currently active tab
 * @param {Function} onTabChange - Callback when tab selection changes
 * @param {string} employeeId - Current employee's ID
 * @param {string} companyId - Current company's ID
 * @param {Function} onTabCreated - Callback when a new tab is created
 * @param {Function} onTabUpdated - Callback when a tab is updated
 * @param {Function} onTabDeleted - Callback when a tab is deleted
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
  onTabDeleted,
  isViewOnly = false
}) => {
  const [isCreatingTab, setIsCreatingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [menuOpenTabId, setMenuOpenTabId] = useState<string | null>(null);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If menu is open and click is outside the menu
      if (menuOpenTabId) {
        // Check if the click was on a menu button (to prevent immediate closing)
        const isMenuButtonClick = Object.values(menuButtonRefs.current).some(
          ref => ref && ref.contains(event.target as Node)
        );
        
        // Get the menu element
        const menuElement = document.getElementById('tab-dropdown-menu');
        const isMenuClick = menuElement && menuElement.contains(event.target as Node);
        
        // If click is outside both the menu and menu buttons, close the menu
        if (!isMenuButtonClick && !isMenuClick) {
          setMenuOpenTabId(null);
          setMenuPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenTabId]);

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

  const handleDeleteTab = async (tabId: string) => {
    try {
      setMenuOpenTabId(null);
      
      // Log the endpoint for debugging
      console.log(`Attempting to delete tab with ID: ${tabId}`);
      
      await deleteTab(tabId);
      
      // Only call onTabDeleted if the delete was successful
      if (onTabDeleted) {
        onTabDeleted();
      } else {
        // If no onTabDeleted callback is provided, fall back to onTabCreated
        // which will refresh the tabs list
        onTabCreated();
      }
      
      // If the deleted tab was the active tab, select another tab if available
      if (activeTabId === tabId && tabs.length > 1) {
        const remainingTabs = tabs.filter(t => t.id !== tabId);
        if (remainingTabs.length > 0) {
          onTabChange(remainingTabs[0].id);
        }
      }
    } catch (error) {
      console.error('Error deleting tab:', error);
      // Optionally show an error message to the user
      alert('Failed to delete tab. Please try again later.');
    }
  };

  const toggleMenu = (tabId: string) => {
    if (isViewOnly) return;
    
    if (menuOpenTabId === tabId) {
      setMenuOpenTabId(null);
      setMenuPosition(null);
    } else {
      setMenuOpenTabId(tabId);
      const buttonRef = menuButtonRefs.current[tabId];
      if (buttonRef) {
        const rect = buttonRef.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
    }
  };

  // Render dropdown menu in a portal
  const renderMenu = () => {
    if (!menuOpenTabId || !menuPosition) return null;
    
    const tab = tabs.find(t => t.id === menuOpenTabId);
    if (!tab) return null;
    
    return createPortal(
      <div 
        id="tab-dropdown-menu"
        className="fixed bg-white rounded-md shadow-lg z-50 border border-gray-200"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          width: '12rem'
        }}
      >
        <div className="py-1">
          <button
            onClick={() => {
              setMenuOpenTabId(null);
              startEditing(tab);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteTab(tab.id)}
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
    <div className="border-b border-gray-200">
      <div className="flex items-center px-4 py-2 overflow-x-auto">
        {tabs
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(tab => (
            <div
              key={tab.id}
              className={`px-4 py-2 mr-2 rounded-t-lg font-medium relative ${
                activeTabId === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                {!isViewOnly && (
                  <button
                    ref={el => menuButtonRefs.current[tab.id] = el}
                    onClick={() => toggleMenu(tab.id)}
                    className={`mr-2 focus:outline-none rounded-full p-1 transition-colors duration-150 ${
                      activeTabId === tab.id 
                        ? 'text-white hover:bg-white hover:bg-opacity-30' 
                        : 'text-gray-600 hover:bg-gray-300 hover:text-gray-800'
                    }`}
                    aria-label="Tab options"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                )}
                
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
                    className="text-left flex-grow"
                  >
                    {tab.name}
                  </button>
                )}
              </div>
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
      {renderMenu()}
    </div>
  );
}; 