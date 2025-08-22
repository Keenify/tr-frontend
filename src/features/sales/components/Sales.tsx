import { Session } from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";
import { createCard, updateCard } from "../../../shared/components/trello/services/useCard";
import { createList, updateList, deleteList } from "../../../shared/components/trello/services/useList";
import { TrelloBoard } from "../../../shared/components/trello/TrelloBoard";
import { CardUpdate } from "../../../shared/components/trello/types/card.types";
import { getBoardDetails, getCompanySalesBoard } from "../services/useBoard";
import { List } from "../types/board";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { getUserData } from '../../../services/useUser';

/**
 * Sales component displays a Trello-style board for managing sales pipeline
 * @param {Session} session - The current user session
 * @returns {JSX.Element} A Trello-style board interface for sales pipeline management
 */
const Sales = ({ session }: { session: Session }) => {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
  const [userRole, setUserRole] = useState<string>('');
  
  // Company-specific board management
  const [boardId, setBoardId] = useState<string | null>(null);
  const [isFetchingBoard, setIsFetchingBoard] = useState(true);

  // Fetch company-specific board ID when company data is available
  const fetchCompanyBoard = useCallback(async () => {
    if (!companyInfo?.id || isLoadingCompany) return;
    
    try {
      setIsFetchingBoard(true);
      const boardResponse = await getCompanySalesBoard(companyInfo.id);
      setBoardId(boardResponse.board_id);
      
    } catch (err) {
      console.error('Failed to fetch company sales board:', err);
      setError(err instanceof Error ? err.message : 'Failed to load company board');
    } finally {
      setIsFetchingBoard(false);
    }
  }, [companyInfo?.id, isLoadingCompany]);

  useEffect(() => {
    fetchCompanyBoard();
  }, [fetchCompanyBoard]);

  // Fetch board details when boardId is available
  const fetchBoardDetails = useCallback(async () => {
    if (!boardId) return;
    
    try {
      setIsLoading(true);
      const boardDetails = await getBoardDetails(boardId);
      const transformedLists = boardDetails.map(list => ({
        ...list,
        title: list.name,
        cards: list.cards.map(card => ({
          ...card,
          thumbnailUrl: card.thumbnail_url,
          colorCode: card.color_code,
          // Use the attachment_count from the API
          attachmentCount: card.attachment_count || 0
        })),
      }));
      setLists(transformedLists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board details');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardDetails();
  }, [fetchBoardDetails]);

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

  if (isLoading || isLoadingCompany || isFetchingBoard) {
    return <div>Loading...</div>;
  }
  
  if (!companyInfo?.id) {
    return <div>Error: Company information not found</div>;
  }
  
  if (!boardId) {
    return <div>Error: Unable to load company board</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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
    }
  };

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
    }
  };

  const handleCardUpdate = async (listId: string, cardId: string, updates: CardUpdate) => {
    try {
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
      delete apiUpdates.colorCode;
      await updateCard(cardId, apiUpdates);
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  const handleListTitleChange = async (listId: string, newTitle: string) => {
    try {
      await updateList(listId, { name: newTitle });
    } catch (error) {
      console.error('Failed to update list title:', error);
    }
  };

  const handleListCountryChange = async (listId: string, newCountry: string) => {
    try {
      await updateList(listId, { country: newCountry });
    } catch (error) {
      console.error('Failed to update list country:', error);
    }
  };

  const handleCardAdd = async (listId: string, title: string) => {
    try {
      if (!title) throw new Error('Card title is required');
      const list = lists.find(l => l.id === listId);
      const position = list?.cards.length ?? 0;
      const newCard = await createCard({
        list_id: listId,
        title,
        position,
      });
      return newCard.id;
    } catch (error) {
      console.error('Failed to create card:', error);
      throw error;
    }
  };

  const handleListAdd = async (title: string, country: string = '') => {
    try {
      if (!title) throw new Error('List title is required');
      if (!boardId) throw new Error('Board ID not available');
      
      const maxPosition = lists.reduce((max, list) => 
        Math.max(max, list.position || 0), -1);
      const newList = await createList({
        name: title,
        position: maxPosition + 1,
        country: country,
        board_id: boardId
      });
      return newList.id;
    } catch (error) {
      console.error('Failed to create list:', error);
      throw error;
    }
  };

  const handleListDelete = async (listId: string) => {
    try {
      await deleteList(listId);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Pipeline</h1>
        {companyInfo?.name && (
          <span className="text-lg text-gray-600">{companyInfo.name}</span>
        )}
      </div>
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
        onListCountryChange={handleListCountryChange}
        onCardAdd={handleCardAdd}
        onListAdd={handleListAdd}
        onListDelete={handleListDelete}
        userRole={userRole}
        session={session}
      />
    </div>
  );
};

export default Sales;
