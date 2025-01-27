import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { TrelloList } from './TrelloList';
import { TrelloCardModal } from './TrelloCardModal';
import { useTrelloBoard } from './hooks/useTrelloBoard';
import { StrictModeDroppable } from './StrictModeDroppable';

interface TrelloBoardProps {
  initialLists: Array<{
    id: string;
    title: string;
    cards: Array<{
      id: string;
      title: string;
      description?: string;
      colorCode?: string;
      thumbnailUrl?: string;
    }>;
  }>;
  onListMove?: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  onCardMove?: (
    sourceListId: string,
    destinationListId: string,
    sourceIndex: number,
    destinationIndex: number,
    cardId: string
  ) => Promise<void>;
  onCardUpdate?: (listId: string, cardId: string, updates: any) => Promise<void>;
  onListTitleChange?: (listId: string, newTitle: string) => Promise<void>;
  onCardAdd?: (listId: string) => Promise<void>;
  onListAdd?: (title: string) => Promise<void>;
}

export const TrelloBoard: React.FC<TrelloBoardProps> = ({ 
  initialLists,
  onListMove,
  onCardMove,
  onCardUpdate,
  onListTitleChange,
  onCardAdd,
  onListAdd
}) => {
  const { 
    lists, 
    handleDragEnd, 
    handleCardUpdate, 
    handleTitleChange, 
    handleAddCard,
    handleAddList 
  } = useTrelloBoard(
    initialLists,
    {
      onListMove,
      onCardMove,
      onCardUpdate,
      onListTitleChange,
      onCardAdd,
      onListAdd
    }
  );

  const [selectedCard, setSelectedCard] = useState<{
    listId: string;
    card: {
      id: string;
      title: string;
      description?: string;
      colorCode?: string;
    };
  } | null>(null);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const handleCardClick = (listId: string, cardId: string) => {
    const list = lists.find(l => l.id === listId);
    const card = list?.cards.find(c => c.id === cardId);
    if (card) {
      setSelectedCard({ listId, card });
    }
  };

  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      handleAddList(newListTitle);
      setNewListTitle('');
      setIsAddingList(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsAddingList(true)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2 text-gray-700"
        >
          <span>+</span>
          Add List
        </button>
      </div>

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
                  key={list.id}
                  id={list.id}
                  index={index}
                  title={list.title}
                  cards={list.cards}
                  onCardClick={(cardId) => handleCardClick(list.id, cardId)}
                  onTitleChange={(newTitle) => handleTitleChange(list.id, newTitle)}
                  onAddCard={(title) => handleAddCard(list.id, title)}
                />
              ))}
              {provided.placeholder}

              {isAddingList && (
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
        />
      )}
    </div>
  );
}; 