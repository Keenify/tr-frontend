import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState, useCallback } from "react";
import { createCard, updateCard } from "../../../shared/components/trello/services/useCard";
import { createList, updateList, deleteList } from "../../../shared/components/trello/services/useList";
import { TrelloBoard } from "../../../shared/components/trello/TrelloBoard";
import { CardUpdate } from "../../../shared/components/trello/types/card.types";
import { getBoardDetails, getCompanyResourcesTemplatesBoard, getCompanyResourcesAssetsBoard } from "../services/useBoard";
import { List } from "../types/board";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { getUserData } from '../../../services/useUser';
import { Tab } from '@headlessui/react';

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
const Resources: React.FC<ResourcesProps> = ({ session }) => {
  const [lists, setLists] = useState<List[]>([]);
  const [digitalAssetsList, setDigitalAssetsList] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDigitalAssets, setIsLoadingDigitalAssets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [digitalAssetsError, setDigitalAssetsError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  // Company-specific board management
  const [templatesBoardId, setTemplatesBoardId] = useState<string | null>(null);
  const [assetsBoardId, setAssetsBoardId] = useState<string | null>(null);
  const [isFetchingBoards, setIsFetchingBoards] = useState(true);
  
  // Add the useUserAndCompanyData hook
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);

  // Fetch company-specific board IDs when company data is available
  const fetchCompanyBoards = useCallback(async () => {
    if (!companyInfo?.id || isLoadingCompany) return;
    
    try {
      setIsFetchingBoards(true);
      
      // Fetch both boards in parallel
      const [templatesResponse, assetsResponse] = await Promise.all([
        getCompanyResourcesTemplatesBoard(companyInfo.id),
        getCompanyResourcesAssetsBoard(companyInfo.id)
      ]);
      
      setTemplatesBoardId(templatesResponse.board_id);
      setAssetsBoardId(assetsResponse.board_id);
    } catch (err) {
      console.error('Failed to fetch company resource boards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load company boards');
    } finally {
      setIsFetchingBoards(false);
    }
  }, [companyInfo?.id, isLoadingCompany]);

  useEffect(() => {
    fetchCompanyBoards();
  }, [fetchCompanyBoards]);

  // Extract fetchBoardDetails into a reusable function for templates board
  const fetchBoardDetails = useCallback(async () => {
    if (!templatesBoardId) return;
    try {
      setIsLoading(true);
      const boardDetails = await getBoardDetails(templatesBoardId);
      
      // Use attachment_count directly from the API response
      const formattedLists = boardDetails.map((list) => {
        return {
          ...list,
          title: list.name,
          cards: list.cards.map(card => ({
            ...card,
            thumbnailUrl: card.thumbnail_url,
            colorCode: card.color_code,
            // Use empty array for attachments but include the count from API
            attachments: [],
            // Use the attachment_count from the API
            attachmentCount: card.attachment_count || 0
          }))
        };
      });
      
      setLists(formattedLists);
      return formattedLists;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [templatesBoardId]);

  // Fetch digital assets board details
  const fetchDigitalAssets = useCallback(async () => {
    if (!assetsBoardId) return;
    try {
      setIsLoadingDigitalAssets(true);
      const boardDetails = await getBoardDetails(assetsBoardId);
      
      // Use attachment_count directly from the API response
      const formattedLists = boardDetails.map((list) => {
        return {
          ...list,
          title: list.name,
          cards: list.cards.map(card => ({
            ...card,
            thumbnailUrl: card.thumbnail_url,
            colorCode: card.color_code,
            // Use empty array for attachments but include the count from API
            attachments: [],
            // Use the attachment_count from the API
            attachmentCount: card.attachment_count || 0
          }))
        };
      });
      
      setDigitalAssetsList(formattedLists);
      return formattedLists;
    } catch (err) {
      setDigitalAssetsError(err instanceof Error ? err.message : 'Failed to load digital assets');
      throw err;
    } finally {
      setIsLoadingDigitalAssets(false);
    }
  }, [assetsBoardId]);

  // Use the fetchBoardDetails function in useEffect
  useEffect(() => {
    fetchBoardDetails();
  }, [fetchBoardDetails]);

  useEffect(() => {
    fetchDigitalAssets();
  }, [fetchDigitalAssets]);

  const fetchUserRole = useCallback(async () => {
    try {
      const userData = await getUserData(session.user.id);
      setUserRole(userData.role);
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  }, [session.user.id]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // Create a refresh handler for the TrelloBoard - add before conditional returns
  const handleRefresh = useCallback(async () => {
    try {
      await fetchBoardDetails();
    } catch (error) {
      console.error('Failed to refresh board data:', error);
    }
  }, [fetchBoardDetails]);

  // Create a refresh handler for the Digital Assets board
  const handleDigitalAssetsRefresh = useCallback(async () => {
    try {
      await fetchDigitalAssets();
    } catch (error) {
      console.error('Failed to refresh digital assets data:', error);
    }
  }, [fetchDigitalAssets]);

  if (isLoading || isLoadingCompany || isFetchingBoards) {
    return <div>Loading...</div>;
  }
  
  if (!companyInfo?.id) {
    return <div>Error: Company information not found</div>;
  }
  
  if (!templatesBoardId || !assetsBoardId) {
    return <div>Error: Unable to load company boards</div>;
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
   * Updates list position in the backend for Templates board
   * @param sourceIndex - Original position of the list
   * @param destinationIndex - New position of the list
   */
  const handleListMove = async (sourceIndex: number, destinationIndex: number) => {
    try {
      // Create a new array reflecting the new order
      const newLists = Array.from(lists);
      const [removed] = newLists.splice(sourceIndex, 1);
      newLists.splice(destinationIndex, 0, removed);

      // Update all lists with their new positions (1-based index)
      await Promise.all(
        newLists.map((list, idx) =>
          updateList(list.id, { position: idx + 1 })
        )
      );
      setLists(newLists);
    } catch (error) {
      console.error('Failed to update list positions:', error);
      // You might want to add error handling here (e.g., showing a toast notification)
    }
  };

  /**
   * Updates list position in the backend for Digital Assets board
   * @param sourceIndex - Original position of the list
   * @param destinationIndex - New position of the list
   */
  const handleDigitalAssetListMove = async (sourceIndex: number, destinationIndex: number) => {
    try {
      // Create a new array reflecting the new order
      const newLists = Array.from(digitalAssetsList);
      const [removed] = newLists.splice(sourceIndex, 1);
      newLists.splice(destinationIndex, 0, removed);

      // Update all lists with their new positions (1-based index)
      await Promise.all(
        newLists.map((list, idx) =>
          updateList(list.id, { position: idx + 1 })
        )
      );
      setDigitalAssetsList(newLists);
    } catch (error) {
      console.error('Failed to update digital asset list positions:', error);
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
        // Convert null to undefined - following Projects pattern
        description: updates.description === null ? undefined : updates.description,
        start_date: updates.start_date === null ? undefined : updates.start_date,
        end_date: updates.end_date === null ? undefined : updates.end_date,
        locked_by: updates.locked_by === null ? undefined : updates.locked_by,
      };
      // Remove the camelCase version to avoid duplicate fields
      delete apiUpdates.colorCode;
      
      await updateCard(cardId, apiUpdates);
      
      // Update the local state to reflect the changes immediately
      setLists(currentLists => 
        currentLists.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              cards: list.cards.map(card => {
                if (card.id === cardId) {
                  return {
                    ...card,
                    title: updates.title ?? card.title,
                    description: updates.description ?? card.description,
                    color_code: updates.color_code ?? card.color_code,
                    // Handle additional properties not in the Card interface
                    // Store these as custom properties that will be used by components
                    ...(updates.assignees ? { assignees: updates.assignees } : {}),
                    ...(updates.start_date ? { start_date: updates.start_date } : {}),
                    ...(updates.end_date ? { end_date: updates.end_date } : {}),
                    ...(updates.attachments ? { attachments: updates.attachments } : {}),
                    ...(updates.attachmentCount !== undefined ? { attachmentCount: updates.attachmentCount } : {})
                  };
                }
                return card;
              }),
            };
          }
          return list;
        })
      );
    } catch (error) {
      console.error('Failed to update card:', error);
      // You might want to add error handling here (e.g., showing a toast notification)
    }
  };

  /**
   * Updates digital asset card details in the backend
   * @param listId - ID of the list containing the card
   * @param cardId - ID of the card to update
   * @param updates - Object containing the updated card properties
   */
  const handleDigitalAssetCardUpdate = async (listId: string, cardId: string, updates: CardUpdate) => {
    try {
      // Transform colorCode to color_code for API compatibility
      const apiUpdates = {
        ...updates,
        list_id: listId,
        color_code: updates.colorCode,
        // Convert null to undefined - following Projects pattern
        description: updates.description === null ? undefined : updates.description,
        start_date: updates.start_date === null ? undefined : updates.start_date,
        end_date: updates.end_date === null ? undefined : updates.end_date,
        locked_by: updates.locked_by === null ? undefined : updates.locked_by,
      };
      // Remove the camelCase version to avoid duplicate fields
      delete apiUpdates.colorCode;
      
      await updateCard(cardId, apiUpdates);
      
      // Update the local state to reflect the changes immediately
      setDigitalAssetsList(currentLists => 
        currentLists.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              cards: list.cards.map(card => {
                if (card.id === cardId) {
                  return {
                    ...card,
                    title: updates.title ?? card.title,
                    description: updates.description ?? card.description,
                    color_code: updates.color_code ?? card.color_code,
                    // Handle additional properties not in the Card interface
                    // Store these as custom properties that will be used by components
                    ...(updates.assignees ? { assignees: updates.assignees } : {}),
                    ...(updates.start_date ? { start_date: updates.start_date } : {}),
                    ...(updates.end_date ? { end_date: updates.end_date } : {}),
                    ...(updates.attachments ? { attachments: updates.attachments } : {}),
                    ...(updates.attachmentCount !== undefined ? { attachmentCount: updates.attachmentCount } : {})
                  };
                }
                return card;
              }),
            };
          }
          return list;
        })
      );
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
   * Creates a new digital asset card in the specified list
   * @param listId - ID of the list to add the card to
   * @param title - Title of the new card from UI input
   */
  const handleDigitalAssetCardAdd = async (listId: string, title: string) => {
    try {
      if (!title) {
        throw new Error('Card title is required');
      }

      // Find the list and get the position for the new card
      const list = digitalAssetsList.find(l => l.id === listId);
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
        board_id: templatesBoardId,
        country: ""
      });
      return newList.id;  // Return the new list ID
    } catch (error) {
      console.error('Failed to create list:', error);
      throw error;
    }
  };

  /**
   * Creates a new digital assets list
   * @param title - Title of the new list
   */
  const handleDigitalAssetListAdd = async (title: string) => {
    try {
      if (!title) throw new Error('List title is required');
      const maxPosition = digitalAssetsList.reduce((max, list) => 
        Math.max(max, list.position || 0), -1);
      const newList = await createList({
        name: title,
        position: maxPosition + 1,
        board_id: assetsBoardId,
        country: ""
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

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected 
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              }`
            }
          >
            Template/Useful Notes
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected 
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              }`
            }
          >
            Digital Assets
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            {isLoading || isLoadingCompany ? (
              <div>Loading...</div>
            ) : error ? (
              <div>Error: {error}</div>
            ) : (
              <TrelloBoard 
                initialLists={lists.map(list => ({
                  ...list,
                  cards: list.cards.map(card => ({
                    ...card,
                    // Convert null values to undefined for compatibility
                    due_date: card.due_date || undefined,
                    start_date: card.start_date || undefined,
                    end_date: card.end_date || undefined,
                    locked_by: card.locked_by || undefined
                  }))
                }))}
                onListMove={handleListMove}
                onCardMove={handleCardMove}
                onCardUpdate={handleCardUpdate}
                onListTitleChange={handleListTitleChange}
                onCardAdd={handleCardAdd}
                onListAdd={handleListAdd}
                onListDelete={handleListDelete}
                userRole={userRole}
                session={session}
                onRefresh={handleRefresh}
              />
            )}
          </Tab.Panel>
          <Tab.Panel>
            {isLoadingDigitalAssets || isLoadingCompany ? (
              <div>Loading Digital Assets...</div>
            ) : digitalAssetsError ? (
              <div>Error: {digitalAssetsError}</div>
            ) : (
              <TrelloBoard 
                initialLists={digitalAssetsList.map(list => ({
                  ...list,
                  cards: list.cards.map(card => ({
                    ...card,
                    // Convert null values to undefined for compatibility
                    due_date: card.due_date || undefined,
                    start_date: card.start_date || undefined,
                    end_date: card.end_date || undefined,
                    locked_by: card.locked_by || undefined
                  }))
                }))}
                onListMove={handleDigitalAssetListMove}
                onCardMove={handleCardMove}
                onCardUpdate={handleDigitalAssetCardUpdate}
                onListTitleChange={handleListTitleChange}
                onCardAdd={handleDigitalAssetCardAdd}
                onListAdd={handleDigitalAssetListAdd}
                onListDelete={handleListDelete}
                userRole={userRole}
                session={session}
                onRefresh={handleDigitalAssetsRefresh}
              />
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Resources;
