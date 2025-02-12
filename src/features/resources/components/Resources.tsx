import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { createCard, updateCard } from "../../../shared/components/trello/services/useCard";
import { createList, updateList, deleteList } from "../../../shared/components/trello/services/useList";
import { CardUpdate, TrelloBoard } from "../../../shared/components/trello/TrelloBoard";
import { getBoardDetails, HARDCODED_BOARD_ID } from "../services/useBoard";
import { List } from "../types/board";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { getUserData } from '../../../services/useUser';

interface ResourcesProps {
  session: Session;
  boardId?: string;
}

/**
 * Resources Component
 * 
 * A Trello-like board implementation for managing company resources and documents.
 * Handles the integration between the Trello UI components and backend API calls.
 * 
 * Features:
 * - Drag and drop lists and cards
 * - Add/edit lists and cards
 * - Resource categorization
 * - Document management
 * 
 * @component
 * @param {Session} session - User session information for API authentication
 * @param {string} [boardId] - Optional ID of the board to load, uses hardcoded ID if not provided
 */
const Resources: React.FC<ResourcesProps> = ({ 
  session, 
  boardId = HARDCODED_BOARD_ID
}) => {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  // Add the useUserAndCompanyData hook
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);

  useEffect(() => {
    const fetchBoardDetails = async () => {
      try {
        setIsLoading(true);
        const boardDetails = await getBoardDetails(boardId);
        // Keep all original properties while transforming what TrelloBoard needs
        const transformedLists = boardDetails.map(list => ({
          ...list,
          title: list.name, // Add title alias for TrelloBoard
          cards: list.cards.map(card => ({
            ...card,
            thumbnailUrl: card.thumbnail_url,
            colorCode: card.color_code,
          })),
        }));
        setLists(transformedLists);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load board details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardDetails();
  }, [boardId]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userData = await getUserData(session.user.id);
        setUserRole(userData.role);
      } catch (err) {
        console.error('Failed to fetch user role:', err);
      }
    };
    fetchUserRole();
  }, [session.user.id]);

  if (isLoading || isLoadingCompany) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  /**
   * API Integration Points:
   * 
   * Implement the following handlers to connect with your backend:
   */

  /**
   * Updates list position in the backend
   * @param sourceIndex - Original position of the list
   * @param destinationIndex - New position of the list
   */
  const handleListMove = async (sourceIndex: number, destinationIndex: number) => {
    try {
        // Get the lists that need to be updated
        const sourceList = lists[sourceIndex];
        const destinationList = lists[destinationIndex];

        // Update both lists with their new positions
        await Promise.all([
            updateList(sourceList.id, { position: destinationIndex }),
            updateList(destinationList.id, { position: sourceIndex })
        ]);

    } catch (error) {
        console.error('Failed to update list positions:', error);
        // You might want to add error handling here (e.g., showing a toast notification)
    }
  };

  /**
   * Updates card position, potentially between different lists
   * @param sourceListId - ID of the original list
   * @param destinationListId - ID of the target list
   * @param sourceIndex - Original position in the list
   * @param destinationIndex - New position in the list
   * @param cardId - ID of the card being moved
   */
  const handleCardMove = async (
    _sourceListId: string,
    destinationListId: string,
    _sourceIndex: number,
    destinationIndex: number,
    cardId: string
  ) => {
    try {
      await updateCard(cardId, {
        list_id: destinationListId,
        position: destinationIndex
      });
    } catch (error) {
      console.error('Failed to move card:', error);
      // You might want to add error handling here (e.g., showing a toast notification)
    }
  };

  /**
   * Updates card details in the backend
   * @param listId - ID of the list containing the card
   * @param cardId - ID of the card to update
   * @param updates - Object containing the updated card properties
   */
  const handleCardUpdate = async (listId: string, cardId: string, updates: CardUpdate) => {
    try {
      // Transform colorCode to color_code for API compatibility
      const apiUpdates = {
        ...updates,
        list_id: listId,
        color_code: updates.colorCode,
      };
      // Remove the camelCase version to avoid duplicate fields
      delete apiUpdates.colorCode;
      
      await updateCard(cardId, apiUpdates);
    } catch (error) {
      console.error('Failed to update card:', error);
      // You might want to add error handling here (e.g., showing a toast notification)
    }
  };

  /**
   * Updates list title in the backend
   * @param listId - ID of the list to update
   * @param newTitle - New title for the list
   */
  const handleListTitleChange = async (listId: string, newTitle: string) => {
    try {
      await updateList(listId, { name: newTitle });
    } catch (error) {
      console.error('Failed to update list title:', error);
      // You might want to add error handling here (e.g., showing a toast notification)
    }
  };

  /**
   * Creates a new card in the specified list
   * @param listId - ID of the list to add the card to
   * @param title - Title of the new card from UI input
   */
  const handleCardAdd = async (listId: string, title: string) => {
    try {
      if (!title) {
        throw new Error('Card title is required');
      }

      // Find the list and get the position for the new card
      const list = lists.find(l => l.id === listId);
      const position = list?.cards.length ?? 0;

      // Create the card in the backend first
      const newCard = await createCard({
        list_id: listId,
        title,
        position,
      });

      // Return the real UUID from the backend
      return newCard.id;

    } catch (error) {
      console.error('Failed to create card:', error);
      throw error; // Propagate error to handle in UI
    }
  };

  /**
   * Creates a new list
   * @param title - Title of the new list
   */
  const handleListAdd = async (title: string) => {
    try {
      if (!title) throw new Error('List title is required');
      const maxPosition = lists.reduce((max, list) => 
        Math.max(max, list.position || 0), -1);
      const newList = await createList({
        name: title,
        position: maxPosition + 1,
        board_id: HARDCODED_BOARD_ID
      });
      return newList.id;  // Return the new list ID
    } catch (error) {
      console.error('Failed to create list:', error);
      throw error;
    }
  };

  const handleListDelete = async (listId: string) => {
    try {
      await deleteList(listId);
      // Refresh board data if needed
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resources</h1>
        {companyInfo?.name && (
          <span className="text-lg text-gray-600">{companyInfo.name}</span>
        )}
      </div>
      <TrelloBoard 
        initialLists={lists}
        onListMove={handleListMove}
        onCardMove={handleCardMove}
        onCardUpdate={handleCardUpdate}
        onListTitleChange={handleListTitleChange}
        onCardAdd={handleCardAdd}
        onListAdd={handleListAdd}
        onListDelete={handleListDelete}
        userRole={userRole}
      />
    </div>
  );
};

export default Resources;
