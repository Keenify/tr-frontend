import { useState, useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { CardAttachment } from '../services/useCardAttachment';

/**
 * Represents a list in the Trello-like board
 */
interface TrelloList {
  /** Unique identifier for the list */
  id: string;
  /** Title of the list */
  title: string;
  /** Array of cards contained in the list */
  cards: TrelloCard[];
}

/**
 * Represents a card in the Trello-like board
 */
interface TrelloCard {
  /** Unique identifier for the card */
  id: string;
  /** Title of the card */
  title: string;
  /** Optional description of the card */
  description?: string;
  /** Optional color code for card styling */
  colorCode?: string;
  /** Optional URL for card thumbnail */
  thumbnailUrl?: string;
  /** Optional array of attachments associated with the card */
  attachments?: CardAttachment[];
}

/**
 * Props for configuring the useTrelloBoard hook
 */
interface TrelloBoardHookProps {
  /** Callback function when a list is moved to a new position */
  onListMove?: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  /** Callback function when a card is moved within or between lists */
  onCardMove?: (
    sourceListId: string,
    destinationListId: string,
    sourceIndex: number,
    destinationIndex: number,
    cardId: string
  ) => Promise<void>;
  /** Callback function when a card's content is updated */
  onCardUpdate?: (listId: string, cardId: string, updates: Partial<TrelloCard>) => Promise<void>;
  /** Callback function when a list's title is changed */
  onListTitleChange?: (listId: string, newTitle: string) => Promise<void>;
  /** Callback function when a new card is added to a list */
  onCardAdd?: (listId: string, title: string) => Promise<string>;
  /** Callback function when a new list is added to the board */
  onListAdd?: (title: string) => Promise<string>;
  /** Callback function when a card is deleted */
  onCardDelete?: (listId: string, cardId: string) => Promise<void>;
  /** Callback function when a list is deleted */
  onListDelete?: (listId: string) => Promise<void>;
}

/**
 * A custom hook that manages the state and operations of a Trello-like board
 * 
 * @param initialLists - Initial array of lists to populate the board
 * @param props - Configuration object containing callback functions for various board operations
 * @returns An object containing the current board state and handler functions
 * 
 * @example
 * ```tsx
 * const {
 *   lists,
 *   isLoading,
 *   error,
 *   handleDragEnd,
 *   handleCardUpdate,
 *   // ... other handlers
 * } = useTrelloBoard(initialLists, {
 *   onCardMove: async (sourceListId, destListId, sourceIndex, destIndex, cardId) => {
 *     // Handle card movement
 *   },
 *   // ... other callbacks
 * });
 * ```
 */
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
      // Create temporary card first
      const tempId = `${Date.now()}`;
      const newCard = {
        id: tempId,
        title,
        description: ''
      };

      // Optimistic update with temp ID
      setLists(lists.map(list =>
        list.id === listId
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      ));

      // Get real UUID from server
      if (onCardAdd) {
        const realId = await onCardAdd(listId, title);
        
        // Update card with real UUID
        setLists(currentLists => currentLists.map(list =>
          list.id === listId
            ? {
                ...list,
                cards: list.cards.map(card =>
                  card.id === tempId
                    ? { ...card, id: realId }
                    : card
                )
              }
            : list
        ));
      }
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
      const tempId = `temp-${Date.now()}`;
      const newList: TrelloList = {
        id: tempId,
        title,
        cards: []
      };

      setLists([...lists, newList]);

      if (onListAdd) {
        const realId = await onListAdd(title);
        if (realId) {
          setLists(currentLists => 
            currentLists.map(list => 
              list.id === tempId 
                ? { ...list, id: realId }
                : list
            )
          );
        }
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