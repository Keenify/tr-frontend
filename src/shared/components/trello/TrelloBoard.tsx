import React, { useState, useEffect } from 'react';
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

/**
 * Props for the TrelloBoard component
 * @interface TrelloBoardProps
 * @property {Array} initialLists - Initial lists data to populate the board
 * @property {Function} [onListMove] - Callback when a list is moved
 * @property {Function} [onCardMove] - Callback when a card is moved
 * @property {Function} [onCardUpdate] - Callback when a card is updated
 * @property {Function} [onListTitleChange] - Callback when a list title is changed
 * @property {Function} [onCardAdd] - Callback when a card is added
 * @property {Function} [onListAdd] - Callback when a list is added
 * @property {Function} [onCardDelete] - Callback when a card is deleted
 * @property {Function} [onListDelete] - Callback when a list is deleted
 * @property {string} userRole - Role of the current user (determines permissions)
 * @property {Session} [session] - Optional Supabase session object
 */
interface TrelloBoardProps {
  initialLists: Array<{
    id: string;
    title: string;
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
  onCardAdd?: (listId: string, title: string) => Promise<string>;
  onListAdd?: (title: string) => Promise<string>;
  onCardDelete?: (listId: string, cardId: string) => Promise<void>;
  onListDelete?: (listId: string) => Promise<void>;
  userRole: string;
  session?: Session;
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
 * 
 * @component
 */
export const TrelloBoard: React.FC<TrelloBoardProps> = ({ 
  initialLists,
  onListMove,
  onCardMove,
  onCardUpdate,
  onListTitleChange,
  onCardAdd,
  onListAdd,
  onCardDelete,
  onListDelete,
  userRole,
  session
}) => {
  const { 
    lists, 
    handleDragEnd, 
    handleCardUpdate, 
    handleTitleChange, 
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
  
  const { companyInfo } = useUserAndCompanyData(session?.user?.id || '');

  // Make sure this is defined at the component level
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Improved employee fetching using directoryService
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyInfo?.id) {
        console.log('Company info not available yet');
        return;
      }
      
      console.log('Fetching employees for company:', companyInfo.id);
      
      try {
        // Use directoryService similar to OrgChart component
        const employeesData = await directoryService.fetchEmployees(companyInfo.id);
        
        if (employeesData && employeesData.length > 0) {
          console.log('Employees fetched successfully:', employeesData);
          setEmployees(employeesData);
        } else {
          console.log('No employees found for company:', companyInfo.id);
        }
      } catch (error) {
        console.error('Exception when fetching employees:', error);
      }
    };

    if (companyInfo?.id) {
      fetchEmployees();
    }
  }, [companyInfo]);

  // Debug logging for session and company info
  useEffect(() => {
    if (session) {
      console.log('Session available:', session.user.id);
    } else {
      console.log('No session available');
    }
    
    if (companyInfo) {
      console.log('Company info:', companyInfo);
    }
  }, [session, companyInfo]);

  // Use the employees data
  useEffect(() => {
    if (employees.length > 0) {
      console.log(`Found ${employees.length} employees for the board`);
    }
  }, [employees]);

  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      handleAddList(newListTitle);
      setNewListTitle('');
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

  // In the TrelloBoard component, add this after the initialLists log
  console.log('TrelloBoard initialLists:', initialLists);
  console.log('TrelloBoard lists with attachments:', lists);

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
        </div>
        
        {/* Search Input */}
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
      </div>

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
                flex flex-wrap content-start gap-6 
                h-[calc(100vh-12rem)]
                p-1
                ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}
              `}
            >
              {lists.map((list, index) => (
                <TrelloList
                  employees={employees}
                  key={list.id}
                  id={list.id}
                  index={index}
                  title={list.title}
                  cards={list.cards}
                  onTitleChange={(newTitle) => handleTitleChange(list.id, newTitle)}
                  onAddCard={(title) => handleAddCard(list.id, title)}
                  onCardDelete={(cardId) => handleCardDelete(list.id, cardId)}
                  onDelete={() => handleListDelete(list.id)}
                  onCardUpdate={(cardId, updates) => handleCardUpdate(list.id, cardId, updates)}
                  onCardClick={(card) => handleCardClick(list.id, card)}
                  userRole={userRole}
                  searchTerm={searchTerm}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsAddingList(false);
                          setNewListTitle('');
                        }
                      }}
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
            handleCardUpdate(selectedCard.listId, selectedCard.card.id, updatedCard);
            setSelectedCard(null);
          }}
          card={selectedCard.card}
          isLoadingAttachments={false}
          userRole={userRole}
          readOnly={false}
          employees={employees}
        />
      )}
    </div>
  );
}; 