import React, { useState, useRef, useEffect } from 'react';
import { TodoData } from '../types/todo';
import { format } from 'date-fns';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface TodoSearchProps {
  todos: TodoData[];
  onSelectTodo: (todo: TodoData) => void;
  triggerSearch?: boolean;
}

/**
 * Search component for finding todos
 * This component:
 * - Displays a search icon that expands into a search bar
 * - Shows search results as the user types
 * - Allows selecting a result to navigate to that todo's date
 * - Can be triggered with keyboard shortcut (pressing 's' three times quickly)
 * 
 * @component
 * @param {TodoData[]} todos - Array of all todos to search through
 * @param {Function} onSelectTodo - Callback when a todo is selected from search results
 * @param {boolean} triggerSearch - Boolean that toggles to trigger search programmatically
 */
const TodoSearch: React.FC<TodoSearchProps> = ({ todos, onSelectTodo, triggerSearch }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TodoData[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Open search when triggerSearch changes
  useEffect(() => {
    if (triggerSearch !== undefined) {
      setIsSearchOpen(true);
    }
  }, [triggerSearch]);

  // Focus the search input when the search bar opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedResultIndex(searchResults.length > 0 ? 0 : -1);
  }, [searchResults]);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node) &&
        isSearchOpen
      ) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // Search todos when query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = todos.filter(todo => 
      todo.title.toLowerCase().includes(query) || 
      (todo.description && todo.description.toLowerCase().includes(query))
    );

    setSearchResults(results);
  }, [searchQuery, todos]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
          handleSelectResult(searchResults[selectedResultIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleCloseSearch();
        break;
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectResult = (todo: TodoData) => {
    onSelectTodo(todo);
    handleCloseSearch();
  };

  return (
    <div ref={searchContainerRef} className="relative">
      {isSearchOpen ? (
        <div className="relative bg-white z-30 flex items-center rounded-md border border-gray-200 shadow-sm">
          <div className="flex items-center p-1.5 w-64">
            <FaSearch className="text-gray-400 mx-1" size={14} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a to-do"
              className="flex-1 outline-none text-sm ml-1"
            />
            <button 
              onClick={handleCloseSearch}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close search"
            >
              <FaTimes size={14} />
            </button>
          </div>
          
          {(searchResults.length > 0 || (searchQuery.trim() !== '' && searchResults.length === 0)) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-30">
              {searchResults.length > 0 && (
                <div>
                  <div className="p-2 text-xs text-gray-500">Results</div>
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map((todo, index) => (
                      <div 
                        key={todo.id}
                        onClick={() => handleSelectResult(todo)}
                        className={`p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex justify-between items-center ${
                          index === selectedResultIndex ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`text-sm ${todo.is_completed ? 'line-through text-gray-400' : ''}`}>
                            {todo.title}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(todo.due_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchQuery.trim() !== '' && searchResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleSearchIconClick}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Search todos"
        >
          <FaSearch className="text-gray-600" size={14} />
        </button>
      )}
    </div>
  );
};

export default TodoSearch; 