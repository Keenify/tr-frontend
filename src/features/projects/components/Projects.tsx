import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState, useCallback } from "react";
import { createCard, updateCard } from "../../../shared/components/trello/services/useCard";
import { createList, updateList, deleteList } from "../../../shared/components/trello/services/useList";
import { TrelloBoard } from "../../../shared/components/trello/TrelloBoard";
import { CardUpdate, Card as TrelloCard } from "../../../shared/components/trello/types/card.types";
import { Label } from "../../../shared/types/label.types";
import { getBoardDetails, getCompanyProjectsBoard, HARDCODED_BOARD_ID } from "../services/useBoard";
import { List, Card as ProjectCard } from "../types/board";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { getUserData } from '../../../services/useUser';

interface ProjectProps {
  session: Session;
  boardId?: string;
}

// Type for the board's expected list structure
interface TrelloBoardList {
  id: string;
  title: string;
  country?: string;
  cards: TrelloCard[];
}

// Modified List type that matches what we're actually storing
interface ModifiedList extends Omit<List, 'cards'> {
  title: string;
  cards: (ProjectCard & {
    thumbnailUrl?: string;
    colorCode?: string;
    due_date?: string;
    labels?: Label[];
  })[];
}

const Project: React.FC<ProjectProps> = ({ 
  session, 
  boardId 
}) => {
  const [lists, setLists] = useState<ModifiedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
  const [userRole, setUserRole] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activelyEditing, setActivelyEditing] = useState<{cardId?: string, listId?: string} | null>(null);
  const [companyBoardId, setCompanyBoardId] = useState<string | null>(null);

  // Get or create company-specific Projects board
  const getCompanyBoard = useCallback(async () => {
    if (!companyInfo?.id) {
      throw new Error('Company information not available');
    }

    try {
      const boardResponse = await getCompanyProjectsBoard(companyInfo.id);
      setCompanyBoardId(boardResponse.board_id);
      return boardResponse.board_id;
    } catch (error) {
      console.error('Failed to get company Projects board:', error);
      throw error;
    }
  }, [companyInfo?.id]);

  // Extract fetchBoardDetails into a reusable function
  const fetchBoardDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Determine which board to use: provided boardId, company board, or fallback
      let targetBoardId = boardId;
      if (!targetBoardId) {
        targetBoardId = companyBoardId || await getCompanyBoard();
      }
      
      const boardDetails = await getBoardDetails(targetBoardId);
      const transformedLists = boardDetails.map(list => ({
        ...list,
        title: list.name,
        cards: list.cards.map(card => ({
          ...card,
          thumbnailUrl: card.thumbnail_url,
          colorCode: card.color_code,
          due_date: card.due_date || undefined, // Convert null to undefined
          // Provide default values for potentially undefined fields
          is_locked: card.is_locked ?? false,
          locked_by: card.locked_by ?? null,
          labels: card.labels ?? [], // Also ensure labels has a default
        })),
      }));
      setLists(transformedLists as ModifiedList[]);
      return transformedLists;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [boardId, companyBoardId, getCompanyBoard]);

  // Load board details on mount and when company data is available
  useEffect(() => {
    // Only fetch if not actively editing and company info is available
    if (!activelyEditing && companyInfo?.id && !isLoadingCompany) {
      fetchBoardDetails();
    }
  }, [companyInfo?.id, isLoadingCompany, activelyEditing, fetchBoardDetails]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // fetchBoardDetails is intentionally not included to prevent auto-refresh loops

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

  // Create a refresh handler for the TrelloBoard - moved up before conditional returns
  const handleRefresh = useCallback(async () => {
    // Check for unsaved changes before refreshing
    if (hasUnsavedChanges || activelyEditing) {
      const confirmRefresh = window.confirm(
        'You have unsaved changes. Refreshing will lose these changes. Continue?'
      );
      if (!confirmRefresh) {
        return;
      }
      // Clear unsaved changes state if user confirms
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    }
    
    try {
      await fetchBoardDetails();
    } catch (error) {
      console.error('Failed to refresh board data:', error);
    }
  }, [fetchBoardDetails, hasUnsavedChanges, activelyEditing]);

  // Handler for when card modal opens - track as actively editing
  const handleCardModalOpen = useCallback((listId: string, cardId: string) => {
    console.log('🎯 [Projects] Card modal opened, marking as actively editing:', { listId, cardId });
    setActivelyEditing({ cardId, listId });
  }, []);

  // Handler for when card modal closes - clear actively editing
  const handleCardModalClose = useCallback(() => {
    console.log('❌ [Projects] Card modal closed, clearing actively editing');
    setActivelyEditing(null);
    setHasUnsavedChanges(false);
  }, []);

  if (isLoading || isLoadingCompany) {
    return <div>Loading...</div>;
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
    // Mark as having changes and track the editing card
    setHasUnsavedChanges(true);
    setActivelyEditing({ cardId, listId });
    
    try {
      const apiUpdates = {
        ...updates,
        list_id: listId,
        color_code: updates.colorCode,
        description: updates.description === null ? undefined : updates.description,
        // Convert null dates to undefined
        start_date: updates.start_date === null ? undefined : updates.start_date,
        end_date: updates.end_date === null ? undefined : updates.end_date,
        // Convert null locked_by to undefined
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
    // Mark as having changes and track the editing list
    setHasUnsavedChanges(true);
    setActivelyEditing({ listId });
    
    try {
      await updateList(listId, { name: newTitle });
      
      // Clear unsaved changes after successful update
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    } catch (error) {
      console.error('Failed to update list title:', error);
      // Keep unsaved changes state if update failed
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
      
      // Get the target board ID (company-specific or provided)
      let targetBoardId = boardId;
      if (!targetBoardId) {
        targetBoardId = companyBoardId || await getCompanyBoard();
      }
      
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

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Management</h1>
        {companyInfo?.name && (
          <span className="text-lg text-gray-600">{companyInfo.name}</span>
        )}
      </div>
      <TrelloBoard 
        initialLists={lists as unknown as TrelloBoardList[]}
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
      />
    </div>
  );
};

export default Project;
