import { useState, useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { CardAttachment } from '../services/useCardAttachment';
import { Label } from '../../../types/label.types';
import { Card, CardUpdate } from '../types/card.types';

// Define the expected input type, matching TrelloBoardProps['initialLists']
type InitialListInputType = Array<{
  id: string;
  title: string;
  country?: string;
  cards: Card[]; // Use the base Card type here
}>;

/**
 * Represents a list in the Trello-like board
 */
interface TrelloList {
  /** Unique identifier for the list */
  id: string;
  /** Title of the list */
  title: string;
  /** Country of the list */
  country?: string;
  /** Array of cards contained in the list */
  cards: TrelloCard[];
  /** Position of the list (for ordering) */
  position: number;
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
  description?: string | undefined;
  /** Optional color code for card styling */
  colorCode?: string;
  /** Optional URL for card thumbnail */
  thumbnailUrl?: string;
  /** Optional array of attachments associated with the card */
  attachments?: CardAttachment[];
  labels?: Label[];
  is_locked: boolean;
  locked_by?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  assignees?: string[];
  color_code?: string;
  position?: number;
  due_date?: string | undefined;
  list_id?: string;
  created_at?: string;
  attachmentCount?: number;
  label_ids?: string[];
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
  onCardUpdate?: (
    listId: string, 
    cardId: string, 
    updates: CardUpdate
  ) => Promise<void>;
  /** Callback function when a list's title is changed */
  onListTitleChange?: (listId: string, newTitle: string) => Promise<void>;
  /** Callback function when a list's country is changed */
  onListCountryChange?: (listId: string, newCountry: string) => Promise<void>;
  /** Callback function when a new card is added to a list */
  onCardAdd?: (listId: string, title: string) => Promise<string>;
  /** Callback function when a new list is added to the board */
  onListAdd?: (title: string, country?: string) => Promise<string>;
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
  initialListsInput: InitialListInputType,
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
  }: TrelloBoardHookProps = {}
) => {
  // Log the raw input
  console.log('[useTrelloBoard] Received initialListsInput:', JSON.stringify(initialListsInput.map(l => ({ ...l, cards: l.cards.map(c => ({ id: c.id, title: c.title, labels: c.labels, label_ids: c.label_ids })) })), null, 2));

  // Create the transformed initial data *once* to use for initialization and rollback
  const transformedInitialLists: TrelloList[] = initialListsInput.map((list, idx) => ({
    ...list,
    position: idx + 1, // Ensure position is set (1-based index; adjust as needed)
    cards: list.cards.map(card => {
      // Explicitly create label_ids from labels if labels exist, otherwise use existing label_ids or default to []
      const final_label_ids = card.labels && card.labels.length > 0 
                              ? card.labels.map(label => label.id) 
                              : (card.label_ids ?? []);
      return {
        ...card,
        is_locked: card.is_locked ?? false,
        locked_by: card.locked_by ?? undefined,
        description: card.description ?? undefined,
        start_date: card.start_date ?? undefined,
        end_date: card.end_date ?? undefined,
        due_date: card.due_date ?? undefined,
        labels: card.labels ?? [],
        label_ids: final_label_ids, // Use the calculated label_ids
      };
    })
  }));

  // Log the transformed data before setting state
  console.log('[useTrelloBoard] Transformed initial data for state:', JSON.stringify(transformedInitialLists.map(l => ({ ...l, cards: l.cards.map(c => ({ id: c.id, title: c.title, labels: c.labels, label_ids: c.label_ids })) })), null, 2));

  // Initialize state with the transformed data
  const [lists, setLists] = useState<TrelloList[]>(transformedInitialLists);
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
        // Always reindex all positions to match new order
        const reindexedLists = newLists.map((list, idx) => ({
          ...list,
          position: idx + 1,
        }));
        setLists(reindexedLists);

        // Then perform API update
        if (onListMove) {
          try {
            await onListMove(source.index, destination.index);
            // After API call, reindex again to guarantee contiguous positions
            setLists(currentLists =>
              currentLists.map((l, i) => ({ ...l, position: i + 1 }))
            );
          } catch (error) {
            // If API fails, revert the optimistic update and reindex
            console.error('Failed to move list:', error);
            setLists(
              transformedInitialLists.map((l, i) => ({ ...l, position: i + 1 }))
            );
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
              // Use the transformed data for rollback
              setLists(transformedInitialLists);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error during drag and drop:', err);
      // Use the transformed data for rollback
      setLists(transformedInitialLists);
    }
  }, [lists, transformedInitialLists, onListMove, onCardMove]);

  const handleCardUpdate = useCallback(async (
    listId: string,
    cardId: string,
    updatedCard: CardUpdate
  ) => {
    setIsLoading(true);
    setError(null);

    // Convert nulls to undefined for internal state and API call consistency
    const updatesForStateAndApi: Partial<TrelloCard> = {
      ...updatedCard,
      list_id: listId, // Ensure list_id is always included
      description: updatedCard.description === null ? undefined : updatedCard.description,
      start_date: updatedCard.start_date === null ? undefined : updatedCard.start_date,
      end_date: updatedCard.end_date === null ? undefined : updatedCard.end_date,
      locked_by: updatedCard.locked_by === null ? undefined : updatedCard.locked_by,
      // Ensure other potentially nullable fields defined in CardUpdate but not TrelloCard are handled if necessary
    };

    // Store the original state for rollback
    const originalLists = JSON.parse(JSON.stringify(lists)); // Deep copy for reliable rollback

    try {
      // Optimistic update using the cleaned object
      setLists(prevLists => prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            cards: list.cards.map(card => 
              card.id === cardId
                ? { 
                    ...card, 
                    ...updatesForStateAndApi, // Use the cleaned object for state update
                    label_ids: updatedCard.label_ids !== undefined ? updatedCard.label_ids : card.label_ids,
                  }
                : card
            )
          };
        }
        return list;
      }));

      // API call using the cleaned object with list_id included
      if (onCardUpdate) {
        await onCardUpdate(listId, cardId, updatesForStateAndApi);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Rollback using the *original* deep-copied state
      setLists(originalLists); 
    } finally {
      setIsLoading(false);
    }
  }, [lists, onCardUpdate]);

  const handleTitleChange = useCallback(async (listId: string, newTitle: string) => {
    const originalLists = JSON.parse(JSON.stringify(lists)); // Store original state
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
      setLists(originalLists); // Rollback
    } finally {
      setIsLoading(false);
    }
  }, [lists, onListTitleChange]);

  const handleCountryChange = useCallback(async (
    listId: string,
    newCountry: string
  ) => {
    const originalLists = JSON.parse(JSON.stringify(lists)); // Store original state
    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update
      setLists(lists.map(list => 
        list.id === listId ? { ...list, country: newCountry } : list
      ));

      // API call
      if (onListCountryChange) {
        await onListCountryChange(listId, newCountry);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLists(originalLists); // Rollback
    } finally {
      setIsLoading(false);
    }
  }, [lists, onListCountryChange]);

  const handleAddCard = useCallback(async (listId: string, title: string) => {
    const originalLists = JSON.parse(JSON.stringify(lists)); // Store original state
    setIsLoading(true);
    setError(null);

    try {
      // Create temporary card first, including required fields
      const tempId = `${Date.now()}-temp`;
      const newCard: TrelloCard = {
        id: tempId,
        title,
        description: '',
        labels: [],
        is_locked: false,
        locked_by: undefined,
        start_date: undefined,
        end_date: undefined,
        due_date: undefined,
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
      setLists(originalLists); // Rollback
    } finally {
      setIsLoading(false);
    }
  }, [lists, onCardAdd]);

  const handleAddList = useCallback(async (
    title: string,
    country?: string
  ) => {
    const originalLists = JSON.parse(JSON.stringify(lists)); // Store original state
    setIsLoading(true);
    setError(null);

    try {
      if (onListAdd) {
        const newListId = await onListAdd(title, country);
        
        // Add the new list to the state
        setLists([
          ...lists,
          {
            id: newListId,
            title,
            country,
            cards: [],
            position: lists.length + 1
          }
        ]);
        
        return newListId;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLists(originalLists); // Rollback
    } finally {
      setIsLoading(false);
    }
  }, [lists, onListAdd]);

  const handleCardDelete = useCallback(async (listId: string, cardId: string) => {
    const originalLists = JSON.parse(JSON.stringify(lists)); // Store original state
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
      setLists(originalLists); // Rollback
    } finally {
      setIsLoading(false);
    }
  }, [lists, onCardDelete]);

  const handleListDelete = useCallback(async (listId: string) => {
    const originalLists = JSON.parse(JSON.stringify(lists)); // Store original state
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
      setLists(originalLists); // Rollback
    } finally {
      setIsLoading(false);
    }
  }, [lists, onListDelete]);

  return {
    lists,
    isLoading,
    error,
    handleDragEnd,
    handleCardUpdate,
    handleTitleChange,
    handleCountryChange,
    handleAddCard,
    handleAddList,
    handleCardDelete,
    handleListDelete
  };
}; 