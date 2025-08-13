import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState, useCallback } from "react";
import { createCard, updateCard } from "../../../shared/components/trello/services/useCard";
import { createList, updateList, deleteList } from "../../../shared/components/trello/services/useList";
import { TrelloBoard } from "../../../shared/components/trello/TrelloBoard";
import { CardUpdate, Card as TrelloCard } from "../../../shared/components/trello/types/card.types";
import { Label } from "../../../shared/types/label.types";
import { getCompanyBoardDetails } from "../services/useBoard";
import { List, Card as ProjectCard } from "../types/board";
import { useSafeCompanyId, useCompanyContext } from "../../../shared/hooks/useCompanyContext";
import { getUserData } from '../../../services/useUser';

interface ProjectProps {
  session: Session;
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

const Project: React.FC<ProjectProps> = ({ session }) => {
  const [lists, setLists] = useState<ModifiedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { companyId, isLoading: isLoadingCompany, error: companyError, isReady } = useSafeCompanyId(session);
  const { companyInfo } = useCompanyContext(session);
  
  // Debug logging (disabled for performance)
  // console.log('🔍 [Projects] Company context state:', {
  //   companyId,
  //   isLoadingCompany,
  //   companyError: companyError?.message,
  //   isReady,
  //   companyInfo: companyInfo?.name
  // });
  
  // Debug session directly in Projects component
  // console.log('🔍 [Projects] Direct session check:', {
  //   sessionExists: !!session,
  //   sessionUser: session?.user,
  //   sessionUserId: session?.user?.id,
  //   sessionUserEmail: session?.user?.email
  // });
  const [userRole, setUserRole] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activelyEditing, setActivelyEditing] = useState<{cardId?: string, listId?: string} | null>(null);

  // Extract fetchBoardDetails into a reusable function
  const fetchBoardDetails = useCallback(async () => {
    if (!companyId) {
      setError('Company ID not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const boardDetails = await getCompanyBoardDetails(companyId);
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects board';
      setError(errorMessage);
      console.error('Failed to load company board:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  // Load board details when company is ready and not actively editing
  useEffect(() => {
    // Only fetch if company data is ready and not actively editing to prevent data loss
    if (isReady && !activelyEditing) {
      fetchBoardDetails();
    }
  }, [isReady, fetchBoardDetails, activelyEditing]);

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

  if (isLoadingCompany) {
    return <div>Loading company data...</div>;
  }

  if (companyError) {
    return <div>Error loading company: {companyError.message}</div>;
  }

  if (!isReady) {
    return <div>Company data not available</div>;
  }

  if (isLoading) {
    return <div>Loading projects board...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-semibold">Error loading projects board</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => fetchBoardDetails()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleListMove = async (sourceIndex: number, destinationIndex: number) => {
    if (!companyId) {
      console.error('Cannot move list: Company ID not available');
      return;
    }

    try {
      // Create a new array reflecting the new order
      const newLists = Array.from(lists);
      const [removed] = newLists.splice(sourceIndex, 1);
      newLists.splice(destinationIndex, 0, removed);

      // Update all lists with their new positions (1-based index)
      await Promise.all(
        newLists.map((list, idx) =>
          updateList(list.id, { position: idx + 1 }, companyId) // Pass company ID for secure access
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
    if (!companyId) {
      console.error('Cannot update card: Company ID not available');
      return;
    }

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
      
      await updateCard(cardId, apiUpdates, companyId); // Pass company ID for secure access
      
      // Clear unsaved changes after successful update
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    } catch (error) {
      console.error('Failed to update card:', error);
      // Keep unsaved changes state if update failed
    }
  };

  const handleListTitleChange = async (listId: string, newTitle: string) => {
    if (!companyId) {
      console.error('Cannot update list title: Company ID not available');
      return;
    }

    // Mark as having changes and track the editing list
    setHasUnsavedChanges(true);
    setActivelyEditing({ listId });
    
    try {
      await updateList(listId, { name: newTitle }, companyId); // Pass company ID for secure access
      
      // Clear unsaved changes after successful update
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    } catch (error) {
      console.error('Failed to update list title:', error);
      // Keep unsaved changes state if update failed
    }
  };

  const handleListCountryChange = async (listId: string, newCountry: string) => {
    if (!companyId) {
      console.error('Cannot update list country: Company ID not available');
      return;
    }

    try {
      await updateList(listId, { country: newCountry }, companyId); // Pass company ID for secure access
    } catch (error) {
      console.error('Failed to update list country:', error);
    }
  };

  const handleCardAdd = async (listId: string, title: string) => {
    if (!companyId) {
      throw new Error('Company ID not available');
    }

    try {
      if (!title) throw new Error('Card title is required');
      const list = lists.find(l => l.id === listId);
      const position = list?.cards.length ?? 0;
      const newCard = await createCard({
        list_id: listId,
        title,
        position,
      }, companyId); // Pass company ID for secure access
      return newCard.id;
    } catch (error) {
      console.error('Failed to create card:', error);
      throw error;
    }
  };

  const handleListAdd = async (title: string, country: string = '') => {
    if (!companyId) {
      throw new Error('Company ID not available');
    }

    try {
      if (!title) throw new Error('List title is required');
      const maxPosition = lists.reduce((max, list) => 
        Math.max(max, list.position || 0), -1);
      const newList = await createList({
        name: title,
        position: maxPosition + 1,
        country: country,
        board_id: companyId // This will be handled by the backend to use the company's board
      }, companyId); // Pass company ID for secure access
      return newList.id;
    } catch (error) {
      console.error('Failed to create list:', error);
      throw error;
    }
  };

  const handleListDelete = async (listId: string) => {
    if (!companyId) {
      console.error('Cannot delete list: Company ID not available');
      return;
    }

    try {
      await deleteList(listId, companyId); // Pass company ID for secure access
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
