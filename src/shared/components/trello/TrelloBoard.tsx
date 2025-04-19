import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { TrelloList } from './TrelloList';
import { TrelloCardModal } from './TrelloCardModal';
import { useTrelloBoard } from './hooks/useTrelloBoard';
import { StrictModeDroppable } from './StrictModeDroppable';
import { Session } from "@supabase/supabase-js";
import { useUserAndCompanyData } from '../../hooks/useUserAndCompanyData';
import { directoryService } from '../../../shared/services/directoryService';
import { Employee } from '@/shared/types/directory.types';
import { Card, CardUpdate } from './types/card.types';
import { Card as TrelloCard } from './types/card.types';
import { Tab, Menu, Transition } from '@headlessui/react';
import { Label } from '../../types/label.types';
import { labelService } from '../../services/labelService';
import { Fragment } from 'react';

/**
 * Props for the TrelloBoard component
 * @interface TrelloBoardProps
 * @property {Array} initialLists - Initial lists data to populate the board
 * @property {Function} [onListMove] - Callback when a list is moved
 * @property {Function} [onCardMove] - Callback when a card is moved
 * @property {Function} [onCardUpdate] - Callback when a card is updated
 * @property {Function} [onListTitleChange] - Callback when a list title is changed
 * @property {Function} [onListCountryChange] - Callback when a list country is changed
 * @property {Function} [onCardAdd] - Callback when a card is added
 * @property {Function} [onListAdd] - Callback when a list is added
 * @property {Function} [onCardDelete] - Callback when a card is deleted
 * @property {Function} [onListDelete] - Callback when a list is deleted
 * @property {string} userRole - Role of the current user (determines permissions)
 * @property {Session} [session] - Optional Supabase session object
 * @property {Function} [onRefresh] - Optional callback to refresh data from parent
 */
interface TrelloBoardProps {
  initialLists: Array<{
    id: string;
    title: string;
    country?: string;
    cards: Card[];
  }>;
  onListMove?: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  onCardMove?: (
    sourceListId: string,
    destinationListId: string,
    sourceIndex: number,
    destinationIndex: number,
    cardId: string
  ) => Promise<void>;
  onCardUpdate?: (listId: string, cardId: string, updates: CardUpdate) => Promise<void>;
  onListTitleChange?: (listId: string, newTitle: string) => Promise<void>;
  onListCountryChange?: (listId: string, newCountry: string) => Promise<void>;
  onCardAdd?: (listId: string, title: string) => Promise<string>;
  onListAdd?: (title: string, country?: string) => Promise<string>;
  onCardDelete?: (listId: string, cardId: string) => Promise<void>;
  onListDelete?: (listId: string) => Promise<void>;
  userRole: string;
  session?: Session;
  onRefresh?: () => Promise<void>;
}

/**
 * TrelloBoard component - A Kanban-style board with draggable lists and cards
 * 
 * Features:
 * - Drag and drop for lists and cards
 * - Add, edit, and delete lists and cards
 * - Search functionality for cards
 * - Role-based permissions
 * - Card modal for detailed editing
 * - Country-based tabs for filtering lists
 * 
 * @component
 */
export const TrelloBoard: React.FC<TrelloBoardProps> = ({ 
  initialLists,
  onListMove,
  onCardMove,
  onCardUpdate,
  onListTitleChange,
  onListCountryChange,
  onCardAdd,
  onListAdd,
  onCardDelete,
  onListDelete,
  userRole,
  session,
  onRefresh
}) => {
  // Get the current user's ID from the session
  const userId = session?.user?.id || '';
  
  const { 
    lists, 
    handleDragEnd, 
    handleCardUpdate, 
    handleTitleChange, 
    handleCountryChange,
    handleAddCard,
    handleAddList,
    handleCardDelete,
    handleListDelete
  } = useTrelloBoard(
    initialLists,
    {
      onListMove,
      onCardMove,
      onCardUpdate,
      onListTitleChange,
      onListCountryChange,
      onCardAdd,
      onListAdd,
      onCardDelete,
      onListDelete
    }
  );

  const [selectedCard, setSelectedCard] = useState<{
    listId: string;
    card: Card;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListCountry, setNewListCountry] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [companyLabels, setCompanyLabels] = useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  
  const { companyInfo } = useUserAndCompanyData(userId);

  // Make sure this is defined at the component level
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Extract unique countries from lists
  const countries = useMemo(() => {
    const uniqueCountries = new Set<string>();
    lists.forEach(list => {
      if (list.country) {
        uniqueCountries.add(list.country);
      }
    });
    return Array.from(uniqueCountries).sort();
  }, [lists]);

  // Filter lists by selected country
  const filteredLists = useMemo(() => {
    if (selectedCountry === 'all') {
      return lists;
    }
    return lists.filter(list => list.country === selectedCountry);
  }, [lists, selectedCountry]);

  // Fetch company labels
  useEffect(() => {
    const fetchCompanyLabels = async () => {
      if (!companyInfo?.id) return;
      try {
        const labels = await labelService.fetchLabelsByCompany(companyInfo.id);
        setCompanyLabels(labels);
      } catch (error) {
        console.error("Failed to fetch company labels:", error);
        // Optionally show a toast or error message
      }
    };
    fetchCompanyLabels();
  }, [companyInfo?.id]);

  // Improved employee fetching using directoryService
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyInfo?.id) {
        return;
      }
      
      try {
        // Use directoryService similar to OrgChart component
        const employeesData = await directoryService.fetchEmployees(companyInfo.id);
        
        if (employeesData && employeesData.length > 0) {
          setEmployees(employeesData);
        }
      } catch (error) {
        console.error('Exception when fetching employees:', error);
      }
    };

    if (companyInfo?.id) {
      fetchEmployees();
    }
  }, [companyInfo]);

  // Use the employees data
  useEffect(() => {
    // This effect is intentionally left empty
  }, [employees]);

  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      handleAddList(newListTitle, newListCountry);
      setNewListTitle('');
      setNewListCountry('');
      setIsAddingList(false);
    }
  };

  // Handle card click to open modal
  const handleCardClick = (listId: string, card: Card) => {
    setSelectedCard({
      listId,
      card
    });
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing board data:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Keep spinner visible briefly for UX feedback
    }
  };

  // Helper function to toggle label selection
  const handleLabelSelectToggle = (labelId: string) => {
    setSelectedLabelIds(prevSelectedIds => {
      if (prevSelectedIds.includes(labelId)) {
        return prevSelectedIds.filter(id => id !== labelId); // Remove
      } else {
        return [...prevSelectedIds, labelId]; // Add
      }
    });
  };

  // Find selected label objects for display
  const selectedLabels = useMemo(() => {
    return companyLabels.filter(label => selectedLabelIds.includes(label.id));
  }, [companyLabels, selectedLabelIds]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAddingList(true)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2 text-gray-700"
          >
            <span>+</span>
            Add List
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-2 text-blue-700 transition-all"
            title="Refresh board"
          >
            <svg 
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7l3-3"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7l-3 3"></path>
            </svg>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
        
        {/* Filter Row */}      
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Existing Search Input */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cards or assignees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                title="Clear search"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Label Filter Dropdown - Updated for multi-select */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500 min-h-[40px] items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="flex-grow text-left flex flex-wrap gap-1">
                  {selectedLabels.length > 0 ? (
                    selectedLabels.map(label => (
                      <span 
                        key={label.id} 
                        className="px-1 py-0.5 rounded text-xs"
                        style={{ backgroundColor: label.color_code + '33', color: label.color_code }}
                      >
                        {label.text}
                      </span>
                    ))
                  ) : (
                    'Filter by Label'
                  )}
                </span>
                <svg className="ml-2 -mr-1 h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 max-h-60 overflow-y-auto">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setSelectedLabelIds([])} // Clear all
                        disabled={selectedLabelIds.length === 0} // Disable if none selected
                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} ${selectedLabelIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                      >
                        Clear All Filters
                      </button>
                    )}
                  </Menu.Item>
                  {companyLabels.length > 0 && <div className="border-t my-1 mx-2"></div>}
                  {companyLabels.map((label) => (
                    <Menu.Item key={label.id}>
                      {({ active }) => (
                        <div
                          onClick={() => handleLabelSelectToggle(label.id)} // Use toggle function
                          className={`${active ? 'bg-gray-100' : ''} text-gray-700 group flex rounded-md items-center w-full px-2 py-2 text-sm cursor-pointer`} // Add cursor-pointer
                        >
                          <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: label.color_code }}></span>
                          <span className="truncate flex-1 text-left">{label.text}</span>
                          {selectedLabelIds.includes(label.id) && (
                            <svg className="ml-auto h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Conditional Filter Info Display - Updated for multi-select */} 
      <div className="flex gap-4 mb-4 flex-wrap">
        {searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-blue-700 flex items-center justify-between">
            <span>
              Showing results for: <strong>{searchTerm}</strong>
            </span>
            <button 
              onClick={() => setSearchTerm('')}
              className="text-blue-500 hover:text-blue-700"
            >
              Clear
            </button>
          </div>
        )}
        {selectedLabels.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-2 text-purple-700 flex items-center gap-2 text-sm flex-wrap">
            <span>Filtering by Labels:</span> 
            {selectedLabels.map(label => (
               <span 
                 key={label.id} 
                 className="px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                 style={{ backgroundColor: label.color_code + '33', color: label.color_code }}
               >
                  {label.text}
                  <button 
                    onClick={() => handleLabelSelectToggle(label.id)} 
                    className="ml-0.5 opacity-60 hover:opacity-100"
                    style={{ color: label.color_code }}
                    title={`Remove ${label.text} filter`}
                  >
                    &times;
                  </button>
               </span>
            ))}
            <button 
              onClick={() => setSelectedLabelIds([])} 
              className="ml-1 text-purple-500 hover:text-purple-700 underline text-xs"
              title="Clear all label filters"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Country Tabs */}
      <Tab.Group onChange={(index) => {
        if (index === 0) {
          setSelectedCountry('all');
        } else {
          setSelectedCountry(countries[index - 1]);
        }
      }}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              `flex items-center justify-center px-4 py-2.5 text-sm font-medium leading-5 rounded-lg
              ${selected 
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              }`
            }
          >
            <span>All Countries</span>
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {lists.length}
            </span>
          </Tab>
          {countries.map((country) => {
            const countryListCount = lists.filter(list => list.country === country).length;
            return (
              <Tab
                key={country}
                className={({ selected }) =>
                  `flex items-center justify-center px-4 py-2.5 text-sm font-medium leading-5 rounded-lg
                  ${selected 
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                  }`
                }
              >
                <span>{country}</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {countryListCount}
                </span>
              </Tab>
            );
          })}
        </Tab.List>
      </Tab.Group>

      <DragDropContext onDragEnd={handleDragEnd}>
        <StrictModeDroppable
          droppableId="board"
          type="list"
          direction="horizontal"
        >
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`
                flex flex-nowrap gap-6
                overflow-x-auto
                h-[calc(100vh-12rem)]
                p-1
                ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}
              `}
            >
              {filteredLists.map((list, index) => (
                <TrelloList
                  employees={employees}
                  key={list.id}
                  id={list.id}
                  index={index}
                  title={list.title}
                  country={list.country}
                  cards={list.cards}
                  onTitleChange={(newTitle) => handleTitleChange(list.id, newTitle)}
                  onCountryChange={(newCountry) => handleCountryChange(list.id, newCountry)}
                  onAddCard={(title) => handleAddCard(list.id, title)}
                  onCardDelete={(cardId) => handleCardDelete(list.id, cardId)}
                  onDelete={() => handleListDelete(list.id)}
                  onCardUpdate={(cardId, updates) => handleCardUpdate(list.id, cardId, updates)}
                  onCardClick={(card) => handleCardClick(list.id, card)}
                  userRole={userRole}
                  searchTerm={searchTerm}
                  userId={userId}
                  companyLabels={companyLabels}
                  selectedLabelIds={selectedLabelIds}
                />
              ))}
              {provided.placeholder}

              {isAddingList && !searchTerm && (
                <div className="flex-shrink-0 w-80">
                  <form onSubmit={handleAddListSubmit} className="bg-gray-100 p-4 rounded-lg">
                    <input
                      autoFocus
                      type="text"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="Enter list title..."
                      className="w-full px-3 py-2 border rounded-md mb-2"
                    />
                    <input
                      type="text"
                      value={newListCountry}
                      onChange={(e) => setNewListCountry(e.target.value)}
                      placeholder="Enter country (optional)..."
                      className="w-full px-3 py-2 border rounded-md mb-2"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Add List
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingList(false);
                          setNewListTitle('');
                          setNewListCountry('');
                        }}
                        className="px-2 py-1.5 text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>

      {selectedCard && (
        <TrelloCardModal
          isOpen={true}
          onClose={() => setSelectedCard(null)}
          onSave={(updatedCard) => {
            // Create a version of updates compatible with the hook
            const updatesForHook: Partial<TrelloCard> = {
              ...updatedCard,
              description: updatedCard.description === null ? undefined : updatedCard.description,
              start_date: updatedCard.start_date === null ? undefined : updatedCard.start_date,
              end_date: updatedCard.end_date === null ? undefined : updatedCard.end_date,
              locked_by: updatedCard.locked_by === null ? undefined : updatedCard.locked_by,
            };

            // Check if this is ONLY a label update
            const isLabelOnlyUpdate = 
                Object.keys(updatedCard).length === 1 && 
                'label_ids' in updatedCard;

            // Check if this is a lock operation
            const isLockOperation = 
              Object.keys(updatedCard).length === 2 && 
              'is_locked' in updatedCard && 
              'locked_by' in updatedCard;
            
            // Apply the update via the hook regardless
            handleCardUpdate(selectedCard.listId, selectedCard.card.id, updatesForHook);

            // Update local state or close modal based on operation type
            if (isLockOperation) {
              // Update the selected card state to reflect the lock changes
              setSelectedCard(prev => prev ? {
                ...prev,
                card: {
                  ...prev.card,
                  is_locked: updatedCard.is_locked ?? false,
                  locked_by: updatedCard.locked_by ?? undefined 
                }
              } : null);
              // Keep modal open for lock changes
            } else if (isLabelOnlyUpdate) {
              // Update the selected card state to reflect the label changes
              setSelectedCard(prev => prev ? {
                ...prev,
                card: {
                  ...prev.card,
                  // We need the full Label objects here, not just IDs.
                  // Fetching them again or getting them from the PATCH response is needed.
                  // For now, just updating the IDs for consistency if Card type includes label_ids
                  label_ids: updatedCard.label_ids 
                }
              } : null);
              // Keep modal open for label changes
            } else {
              // For regular updates, close the modal
              setSelectedCard(null);
            }
          }}
          card={selectedCard.card}
          isLoadingAttachments={false}
          userRole={userRole}
          readOnly={selectedCard.card.is_locked && selectedCard.card.locked_by !== userId}
          employees={employees}
          userId={userId}
        />
      )}
    </div>
  );
}; 