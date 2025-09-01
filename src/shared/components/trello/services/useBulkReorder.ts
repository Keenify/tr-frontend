/**
 * Bulk Reorder API Service for Trello-style boards
 * 
 * This service provides atomic bulk reorder operations to prevent race conditions
 * during drag-and-drop operations for both lists and cards.
 * 
 * @author Claude Code
 * @created 2025-01-12
 */

// Get the API domain from environment variables
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

if (!API_DOMAIN) {
  throw new Error('VITE_BACKEND_API_DOMAIN environment variable is not set');
}

// Type definitions for bulk reorder operations
export interface ListPositionUpdate {
  list_id: string;
  position: number;
}

export interface CardPositionUpdate {
  card_id: string;
  position: number;
}

export interface BulkReorderResponse {
  success: boolean;
  updated_count: number;
  message: string;
}

export interface BulkListReorderRequest {
  position_updates: ListPositionUpdate[];
}

export interface BulkCardReorderRequest {
  position_updates: CardPositionUpdate[];
}

/**
 * Bulk reorder lists in a board to prevent race conditions
 * 
 * This function performs atomic position updates for all lists in a single 
 * database transaction, ensuring consistent ordering without intermediate 
 * states that could cause position conflicts.
 * 
 * @param {string} boardId - The ID of the board containing the lists
 * @param {ListPositionUpdate[]} positionUpdates - Array of list position updates
 * @returns {Promise<BulkReorderResponse>} - A promise that resolves to bulk reorder response
 * @throws {Error} - If the API request fails or returns an error response
 * 
 * @example
 * ```typescript
 * const positionUpdates = [
 *   { list_id: "uuid1", position: 1 },
 *   { list_id: "uuid2", position: 2 },
 *   { list_id: "uuid3", position: 3 }
 * ];
 * const result = await bulkReorderLists(boardId, positionUpdates);
 * console.log(`Updated ${result.updated_count} lists`);
 * ```
 */
export async function bulkReorderLists(
  boardId: string, 
  positionUpdates: ListPositionUpdate[]
): Promise<BulkReorderResponse> {
  if (!boardId) {
    throw new Error('Board ID is required for bulk list reordering');
  }

  if (!positionUpdates || positionUpdates.length === 0) {
    throw new Error('Position updates array cannot be empty');
  }

  // Validate position updates
  const listIds = positionUpdates.map(update => update.list_id);
  const positions = positionUpdates.map(update => update.position);
  
  if (new Set(listIds).size !== listIds.length) {
    throw new Error('Duplicate list IDs found in position updates');
  }
  
  if (new Set(positions).size !== positions.length) {
    throw new Error('Duplicate positions found in position updates');
  }

  const endpoint = `${API_DOMAIN}/trello/boards/${encodeURIComponent(boardId)}/lists/reorder`;
  
  console.log('🔄 Bulk reordering lists:', {
    boardId,
    updateCount: positionUpdates.length,
    endpoint
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position_updates: positionUpdates } as BulkListReorderRequest),
    });

    const data: BulkReorderResponse = await response.json();

    if (!response.ok) {
      console.error('❌ Bulk list reorder failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData: data
      });
      throw new Error(data.message || 'Failed to bulk reorder lists');
    }

    console.log('✅ Bulk list reorder successful:', {
      success: data.success,
      updatedCount: data.updated_count,
      message: data.message
    });

    return data;
  } catch (error) {
    console.error('❌ Bulk list reorder error:', error);
    throw error;
  }
}

/**
 * Bulk reorder cards in a list to prevent race conditions
 * 
 * This function performs atomic position updates for all cards in a single 
 * database transaction, ensuring consistent ordering without intermediate 
 * states that could cause position conflicts.
 * 
 * @param {string} listId - The ID of the list containing the cards
 * @param {CardPositionUpdate[]} positionUpdates - Array of card position updates
 * @returns {Promise<BulkReorderResponse>} - A promise that resolves to bulk reorder response
 * @throws {Error} - If the API request fails or returns an error response
 * 
 * @example
 * ```typescript
 * const positionUpdates = [
 *   { card_id: "uuid1", position: 1 },
 *   { card_id: "uuid2", position: 2 }
 * ];
 * const result = await bulkReorderCards(listId, positionUpdates);
 * console.log(`Updated ${result.updated_count} cards`);
 * ```
 */
export async function bulkReorderCards(
  listId: string, 
  positionUpdates: CardPositionUpdate[]
): Promise<BulkReorderResponse> {
  if (!listId) {
    throw new Error('List ID is required for bulk card reordering');
  }

  if (!positionUpdates || positionUpdates.length === 0) {
    throw new Error('Position updates array cannot be empty');
  }

  // Validate position updates
  const cardIds = positionUpdates.map(update => update.card_id);
  const positions = positionUpdates.map(update => update.position);
  
  if (new Set(cardIds).size !== cardIds.length) {
    throw new Error('Duplicate card IDs found in position updates');
  }
  
  if (new Set(positions).size !== positions.length) {
    throw new Error('Duplicate positions found in position updates');
  }

  const endpoint = `${API_DOMAIN}/trello/lists/${encodeURIComponent(listId)}/cards/reorder`;
  
  console.log('🔄 Bulk reordering cards:', {
    listId,
    updateCount: positionUpdates.length,
    endpoint
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position_updates: positionUpdates } as BulkCardReorderRequest),
    });

    const data: BulkReorderResponse = await response.json();

    if (!response.ok) {
      console.error('❌ Bulk card reorder failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData: data
      });
      throw new Error(data.message || 'Failed to bulk reorder cards');
    }

    console.log('✅ Bulk card reorder successful:', {
      success: data.success,
      updatedCount: data.updated_count,
      message: data.message
    });

    return data;
  } catch (error) {
    console.error('❌ Bulk card reorder error:', error);
    throw error;
  }
}

/**
 * Utility function to create list position updates from a reordered array
 * 
 * @param {Array<{id: string}>} lists - Array of list objects with id property
 * @returns {ListPositionUpdate[]} - Array of position updates
 */
export function createListPositionUpdates(lists: Array<{id: string}>): ListPositionUpdate[] {
  return lists.map((list, index) => ({
    list_id: list.id,
    position: index + 1
  }));
}

/**
 * Utility function to create card position updates from a reordered array
 * 
 * @param {Array<{id: string}>} cards - Array of card objects with id property
 * @returns {CardPositionUpdate[]} - Array of position updates
 */
export function createCardPositionUpdates(cards: Array<{id: string}>): CardPositionUpdate[] {
  return cards.map((card, index) => ({
    card_id: card.id,
    position: index + 1
  }));
}