import { Session } from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";
import { createCard, updateCard, deleteCard } from "../../../shared/components/trello/services/useCard";
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
  console.log('🔄 [Sales] Component render start - Timestamp:', new Date().toISOString());
  console.log('📍 [Sales] Session user ID:', session.user.id);
  
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ⚠️ THIS IS THE PROBLEMATIC CALL - Sales calling useUserAndCompanyData directly
  console.log('🚨 [Sales] About to call useUserAndCompanyData with ID:', session.user.id);
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
  console.log('📊 [Sales] useUserAndCompanyData result:', { 
    hasCompanyInfo: !!companyInfo, 
    companyId: companyInfo?.id, 
    isLoadingCompany 
  });
  
  const [userRole, setUserRole] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activelyEditing, setActivelyEditing] = useState<{cardId?: string, listId?: string} | null>(null);
  
  console.log('🔍 [Sales] State values:', { 
    listsCount: lists.length, 
    isLoading, 
    error, 
    companyId: companyInfo?.id, 
    isLoadingCompany, 
    userRole 
  });
  
  // Company-specific board management
  const [companyBoardId, setCompanyBoardId] = useState<string | null>(null);

  // Get or create company-specific Sales board
  const getCompanyBoard = useCallback(async () => {
    if (!companyInfo?.id) {
      throw new Error('Company information not available');
    }

    try {
      const boardResponse = await getCompanySalesBoard(companyInfo.id);
      setCompanyBoardId(boardResponse.board_id);
      return boardResponse.board_id;
    } catch (error) {
      console.error('Failed to get company Sales board:', error);
      throw error;
    }
  }, [companyInfo?.id]);


  // Extract fetchBoardDetails into a reusable function
  const fetchBoardDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Determine which board to use: company board or fallback
      let targetBoardId = companyBoardId || await getCompanyBoard();
      
      const boardDetails = await getBoardDetails(targetBoardId);
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
      return transformedLists;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [companyBoardId, getCompanyBoard]);

  useEffect(() => {
    if (companyInfo?.id && !isLoadingCompany) {
      fetchBoardDetails();
    }
  }, [companyInfo?.id, isLoadingCompany]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // fetchBoardDetails is intentionally not included to prevent auto-refresh loops

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

  // Create a refresh handler for the TrelloBoard
  const handleRefresh = useCallback(async () => {
    // Check for unsaved changes before refreshing
    if (hasUnsavedChanges || activelyEditing) {
      const confirmRefresh = window.confirm(
        'You have unsaved changes. Refreshing will lose these changes. Continue?'
      );
      if (!confirmRefresh) return;
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    }
    
    try {
      await fetchBoardDetails();
    } catch (error) {
      console.error('Failed to refresh board data:', error);
    }
  }, [hasUnsavedChanges, activelyEditing, fetchBoardDetails]);

  // Handler for when card modal opens
  const handleCardModalOpen = useCallback((listId: string, cardId: string) => {
    console.log('🎯 [Sales] Card modal opened, marking as actively editing:', { listId, cardId });
    setActivelyEditing({ cardId, listId });
  }, []);

  // Handler for when card modal closes
  const handleCardModalClose = useCallback(() => {
    console.log('❌ [Sales] Card modal closed, clearing actively editing');
    setActivelyEditing(null);
    setHasUnsavedChanges(false);
  }, []);

  if (isLoading || isLoadingCompany) {
    return <div>Loading...</div>;
  }
  
  if (!companyInfo?.id) {
    return <div>Error: Company information not found</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleListMove = async (sourceIndex: number, destinationIndex: number) => {
    try {
      console.log(`🔄 [Sales] List moved from ${sourceIndex} to ${destinationIndex}`);
      
      // Create a new array reflecting the new order (same as working Projects approach)
      const newLists = Array.from(lists);
      const [removed] = newLists.splice(sourceIndex, 1);
      newLists.splice(destinationIndex, 0, removed);

      console.log(`📍 [Sales] Updating all ${newLists.length} lists with new positions`);

      // Update ALL lists with their new positions (1-based index) - prevents duplicates
      await Promise.all(
        newLists.map((list, idx) => {
          const newPosition = idx + 1;
          console.log(`  🔄 Updating ${list.name} (${list.id}) to position ${newPosition}`);
          return updateList(list.id, { position: newPosition });
        })
      );
      
      // Update frontend state with new order
      setLists(newLists);
      console.log(`✅ [Sales] All list positions updated successfully`);
    } catch (error) {
      console.error('❌ [Sales] Failed to move list:', error);
    }
  };

  const handleCardMove = async (
    sourceListId: string,
    destinationListId: string,
    sourceIndex: number,
    destinationIndex: number,
    cardId: string
  ) => {
    try {
      console.log(`🔄 [Sales] Card moved: ${cardId} from ${sourceListId}[${sourceIndex}] to ${destinationListId}[${destinationIndex}]`);
      
      // Calculate target position (1-based indexing)
      const targetPosition = destinationIndex + 1;
      
      // Single atomic API call with exact target position
      await updateCard(cardId, {
        list_id: destinationListId,
        position: targetPosition
      });
      
      console.log(`✅ [Sales] Card position updated successfully`);
    } catch (error) {
      console.error('❌ [Sales] Failed to move card:', error);
    }
  };

  const handleCardUpdate = async (listId: string, cardId: string, updates: CardUpdate) => {
    // Mark as having changes and track the editing card
    setHasUnsavedChanges(true);
    setActivelyEditing({ cardId, listId });
    
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
      
      // Clear unsaved changes after successful update
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    } catch (error) {
      console.error('Failed to update card:', error);
      // Keep unsaved changes state if update failed
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
      
      // Get the target board ID (company-specific)
      let targetBoardId = companyBoardId || await getCompanyBoard();
      
      const maxPosition = lists.reduce((max, list) => 
        Math.max(max, list.position || 0), -1);
      const newList = await createList({
        name: title,
        position: maxPosition + 1,
        country: country,
        board_id: targetBoardId
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

  const handleCardDelete = async (listId: string, cardId: string) => {
    try {
      // Find the card to delete
      const list = lists.find(l => l.id === listId);
      const card = list?.cards.find(c => c.id === cardId);
      
      if (!card) {
        console.error('Card not found for deletion');
        return;
      }

      // Delete the card via API
      console.log(`Deleting card ${cardId} from list ${listId}`);
      await deleteCard(cardId);
      
      console.log('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  console.log('📋 [Sales] About to render TrelloBoard with props:', {
    listsCount: lists.length,
    userRole,
    sessionUserId: session.user.id,
    pattern: 'Following Projects.tsx pattern - regular handler functions'
  });

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
        onRefresh={handleRefresh}
        onCardModalOpen={handleCardModalOpen}
        onCardModalClose={handleCardModalClose}
        companyInfo={companyInfo}
        boardId={companyBoardId || undefined}
        onCardDelete={handleCardDelete}
      />
    </div>
  );
};

export default Sales;
