import { useState, useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { CardAttachment } from '../services/useCardAttachment';

interface TrelloList {
  id: string;
  title: string;
  cards: TrelloCard[];
}

interface TrelloCard {
  id: string;
  title: string;
  description?: string;
  colorCode?: string;
  thumbnailUrl?: string;
  attachments?: CardAttachment[];
}

interface TrelloBoardHookProps {
  onListMove?: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  onCardMove?: (
    sourceListId: string,
    destinationListId: string,
    sourceIndex: number,
    destinationIndex: number,
    cardId: string
  ) => Promise<void>;
  onCardUpdate?: (listId: string, cardId: string, updates: Partial<TrelloCard>) => Promise<void>;
  onListTitleChange?: (listId: string, newTitle: string) => Promise<void>;
  onCardAdd?: (listId: string, title: string) => Promise<void>;
  onListAdd?: (title: string) => Promise<void>;
  onCardDelete?: (listId: string, cardId: string) => Promise<void>;
  onListDelete?: (listId: string) => Promise<void>;
}

export const useTrelloBoard = (
  initialLists: TrelloList[],
  {
    onListMove,
    onCardMove,
    onCardUpdate,
    onListTitleChange,
    onCardAdd,
    onListAdd,
    onCardDelete,
    onListDelete
  }: TrelloBoardHookProps = {}
) => {
  const [lists, setLists] = useState(initialLists);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, type, draggableId } = result;

    if (!destination) return;

    try {
      if (type === 'list') {
        // Perform optimistic update first for list movement
        const newLists = Array.from(lists);
        const [removed] = newLists.splice(source.index, 1);
        newLists.splice(destination.index, 0, removed);
        setLists(newLists);

        // Then perform API update
        if (onListMove) {
          try {
            await onListMove(source.index, destination.index);
          } catch (error) {
            // If API fails, revert the optimistic update
            console.error('Failed to move list:', error);
            const originalLists = Array.from(lists);
            setLists(originalLists);
          }
        }
      } else {
        const sourceListId = source.droppableId.replace('list-', '');
        const destListId = destination.droppableId.replace('list-', '');
        const cardId = draggableId.replace('card-', '');

        const newLists = Array.from(lists);
        const sourceList = newLists.find(list => `list-${list.id}` === source.droppableId);
        const destList = newLists.find(list => `list-${list.id}` === destination.droppableId);

        if (sourceList && destList) {
          const [movedCard] = sourceList.cards.splice(source.index, 1);
          destList.cards.splice(destination.index, 0, movedCard);
          setLists(newLists);

          if (onCardMove) {
            try {
              await onCardMove(
                sourceListId,
                destListId,
                source.index,
                destination.index,
                cardId
              );
            } catch (error) {
              console.error('Failed to move card:', error);
              const originalLists = Array.from(lists);
              setLists(originalLists);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error during drag and drop:', err);
      setLists(initialLists);
    }
  }, [lists, initialLists, onListMove, onCardMove]);

  const handleCardUpdate = useCallback(async (
    listId: string,
    cardId: string,
    updatedCard: Partial<TrelloCard>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update
      setLists(lists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            cards: list.cards.map(card => 
              card.id === cardId
                ? { ...card, ...updatedCard }
                : card
            )
          };
        }
        return list;
      }));

      // API call
      if (onCardUpdate) {
        await onCardUpdate(listId, cardId, updatedCard);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLists(initialLists);
    } finally {
      setIsLoading(false);
    }
  }, [lists, initialLists, onCardUpdate]);

  const handleTitleChange = useCallback(async (listId: string, newTitle: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update
      setLists(lists.map(list => 
        list.id === listId ? { ...list, title: newTitle } : list
      ));

      // API call
      if (onListTitleChange) {
        await onListTitleChange(listId, newTitle);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLists(initialLists);
    } finally {
      setIsLoading(false);
    }
  }, [lists, initialLists, onListTitleChange]);

  const handleAddCard = useCallback(async (listId: string, title: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (onCardAdd) {
        // Wait for the API response to get the real card ID
        await onCardAdd(listId, title);
      }

      // Update the lists after API call succeeds
      const newCard = {
        id: `${Date.now()}`, // Remove 'temp-' prefix
        title,
        description: ''
      };

      setLists(lists.map(list =>
        list.id === listId
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLists(initialLists);
    } finally {
      setIsLoading(false);
    }
  }, [lists, initialLists, onCardAdd]);

  const handleAddList = useCallback(async (title: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update
      const newList: TrelloList = {
        id: `${Date.now()}`,
        title,
        cards: []
      };

      setLists([...lists, newList]);

      // API call
      if (onListAdd) {
        await onListAdd(title);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLists(initialLists);
    } finally {
      setIsLoading(false);
    }
  }, [lists, initialLists, onListAdd]);

  const handleCardDelete = useCallback(async (listId: string, cardId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update
      setLists(lists.map(list => 
        list.id === listId 
          ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
          : list
      ));

      if (onCardDelete) {
        await onCardDelete(listId, cardId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLists(initialLists);
    } finally {
      setIsLoading(false);
    }
  }, [lists, initialLists, onCardDelete]);

  const handleListDelete = useCallback(async (listId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update
      setLists(lists.filter(list => list.id !== listId));

      // API call
      if (onListDelete) {
        await onListDelete(listId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLists(initialLists); // Rollback on error
    } finally {
      setIsLoading(false);
    }
  }, [lists, initialLists, onListDelete]);

  return {
    lists,
    isLoading,
    error,
    handleDragEnd,
    handleCardUpdate,
    handleTitleChange,
    handleAddCard,
    handleAddList,
    handleCardDelete,
    handleListDelete
  };
}; 