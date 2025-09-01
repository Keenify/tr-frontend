import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState, useCallback } from "react";
import { createCard, updateCard, deleteCard } from "../../../shared/components/trello/services/useCard";
import { createList, updateList, deleteList } from "../../../shared/components/trello/services/useList";
// Removed bulk reorder imports - using pure delegation to useTrelloBoard instead
import { TrelloBoard } from "../../../shared/components/trello/TrelloBoard";
import { CardUpdate, Card as TrelloCard } from "../../../shared/components/trello/types/card.types";
import { Label } from "../../../shared/types/label.types";
import { getBoardDetails, getCompanyCreativeBoard } from "../services/useCreativeBoard";
import { CreativeUIList, CreativeCard, CREATIVE_WORKFLOW_TEMPLATES } from "../types/creativeBoard";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { getUserData } from '../../../services/useUser';

interface CreativeManagementProps {
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

const CreativeManagement: React.FC<CreativeManagementProps> = ({ 
  session, 
  boardId 
}) => {
  const [lists, setLists] = useState<CreativeUIList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
  const [userRole, setUserRole] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activelyEditing, setActivelyEditing] = useState<{cardId?: string, listId?: string} | null>(null);
  const [creativeBoardId, setCreativeBoardId] = useState<string | null>(null);
  const [showEmptyBoardWelcome, setShowEmptyBoardWelcome] = useState(false);

  // Get or create company-specific Creative Management board
  const getCompanyCreativeBoardId = useCallback(async () => {
    if (!companyInfo?.id) {
      throw new Error('Company information not available');
    }

    try {
      const boardResponse = await getCompanyCreativeBoard(companyInfo.id);
      setCreativeBoardId(boardResponse.board_id);
      
      // If board was just created, show empty board welcome
      if (boardResponse.created) {
        setShowEmptyBoardWelcome(true);
      }
      
      return boardResponse.board_id;
    } catch (error) {
      console.error('Failed to get company Creative Management board:', error);
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
        targetBoardId = creativeBoardId || await getCompanyCreativeBoardId();
      }
      
      const boardDetails = await getBoardDetails(targetBoardId);
      const transformedLists = boardDetails.map(list => ({
        ...list,
        title: list.name,
        cards: list.cards.map(card => ({
          ...card,
          thumbnailUrl: card.thumbnail_url,
          colorCode: card.color_code,
          due_date: card.due_date || undefined,
          is_locked: card.is_locked ?? false,
          locked_by: card.locked_by ?? null,
          labels: card.labels ?? [],
        })),
      }));
      setLists(transformedLists as CreativeUIList[]);
      
      // If no lists exist and it's a new board, show welcome
      if (transformedLists.length === 0 && showEmptyBoardWelcome) {
        // Keep showing welcome state
      } else {
        setShowEmptyBoardWelcome(false);
      }
      
      return transformedLists;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load creative management board');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [boardId, creativeBoardId, getCompanyCreativeBoardId, showEmptyBoardWelcome]);

  // Load board details on mount and when company data is available
  useEffect(() => {
    // Only fetch if company info is available and loading is complete
    if (companyInfo?.id && !isLoadingCompany) {
      fetchBoardDetails();
    }
  }, [companyInfo?.id, isLoadingCompany, fetchBoardDetails]);

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

  // Create a refresh handler for the TrelloBoard
  const handleRefresh = useCallback(async () => {
    // Check for unsaved changes before refreshing
    if (hasUnsavedChanges || activelyEditing) {
      const confirmRefresh = window.confirm(
        'You have unsaved changes. Refreshing will lose these changes. Continue?'
      );
      if (!confirmRefresh) {
        return;
      }
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    }
    
    try {
      await fetchBoardDetails();
    } catch (error) {
      console.error('Failed to refresh creative board data:', error);
    }
  }, [hasUnsavedChanges, activelyEditing, fetchBoardDetails]);

  // Handler for when card modal opens
  const handleCardModalOpen = useCallback((listId: string, cardId: string) => {
    console.log('🎯 [Creative Management] Card modal opened, marking as actively editing:', { listId, cardId });
    setActivelyEditing({ cardId, listId });
  }, []);

  // Handler for when card modal closes
  const handleCardModalClose = useCallback(() => {
    console.log('❌ [Creative Management] Card modal closed, clearing actively editing');
    setActivelyEditing(null);
    setHasUnsavedChanges(false);
  }, []);

  // Handler for creating first list to dismiss welcome state
  const handleCreateFirstList = useCallback((templateType?: keyof typeof CREATIVE_WORKFLOW_TEMPLATES) => {
    if (templateType && CREATIVE_WORKFLOW_TEMPLATES[templateType]) {
      // Create multiple lists based on template
      const template = CREATIVE_WORKFLOW_TEMPLATES[templateType];
      template.forEach(async (listName, index) => {
        try {
          await handleListAdd(listName);
          if (index === 0) {
            setShowEmptyBoardWelcome(false);
          }
        } catch (error) {
          console.error('Failed to create template list:', listName, error);
        }
      });
    } else {
      setShowEmptyBoardWelcome(false);
    }
  }, []);

  if (isLoading || isLoadingCompany) {
    return <div>Loading creative management board...</div>;
  }

  if (error) {
    return <div>Error loading creative management: {error}</div>;
  }

  // Show empty board welcome for new companies
  if (showEmptyBoardWelcome && lists.length === 0) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Creative Management!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Start organizing your creative projects with a professional Kanban board system.
          </p>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Choose a workflow template:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(CREATIVE_WORKFLOW_TEMPLATES).map(([key, stages]) => (
                <div key={key} className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                     onClick={() => handleCreateFirstList(key as keyof typeof CREATIVE_WORKFLOW_TEMPLATES)}>
                  <h4 className="font-semibold capitalize mb-2">{key.replace('_', ' ')}</h4>
                  <p className="text-sm text-gray-600">{stages.join(' → ')}</p>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => handleCreateFirstList()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Start with Empty Board
          </button>
        </div>
      </div>
    );
  }

  const handleListMove = async (sourceIndex: number, destinationIndex: number) => {
    try {
      console.log(`🔄 [CreativeManagement] List moved from ${sourceIndex} to ${destinationIndex}`);
      
      // Create a new array reflecting the new order (same as working Projects approach)
      const newLists = Array.from(lists);
      const [removed] = newLists.splice(sourceIndex, 1);
      newLists.splice(destinationIndex, 0, removed);

      console.log(`📍 [CreativeManagement] Updating all ${newLists.length} lists with new positions`);

      // Update ALL lists with their new positions (1-based index) - prevents duplicates
      await Promise.all(
        newLists.map((list, idx) => {
          const newPosition = idx + 1;
          console.log(`  🔄 Updating ${list.title} (${list.id}) to position ${newPosition}`);
          return updateList(list.id, { position: newPosition });
        })
      );
      
      // Update frontend state with new order
      setLists(newLists);
      console.log(`✅ [CreativeManagement] All list positions updated successfully`);
    } catch (error) {
      console.error('❌ [CreativeManagement] Failed to move list:', error);
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
      console.log(`🔄 [CreativeManagement] Card moved: ${cardId} from ${sourceListId}[${sourceIndex}] to ${destinationListId}[${destinationIndex}]`);
      
      // Calculate target position (1-based indexing)
      const targetPosition = destinationIndex + 1;
      
      // Single atomic API call with exact target position
      await updateCard(cardId, {
        list_id: destinationListId,
        position: targetPosition
      });
      
      console.log(`✅ [CreativeManagement] Card position updated successfully`);
    } catch (error) {
      console.error('❌ [CreativeManagement] Failed to move card:', error);
    }
  };

  const handleCardUpdate = async (listId: string, cardId: string, updates: CardUpdate) => {
    setHasUnsavedChanges(true);
    setActivelyEditing({ cardId, listId });
    
    try {
      const apiUpdates = {
        ...updates,
        list_id: listId,
        color_code: updates.colorCode,
        description: updates.description === null ? undefined : updates.description,
        start_date: updates.start_date === null ? undefined : updates.start_date,
        end_date: updates.end_date === null ? undefined : updates.end_date,
        locked_by: updates.locked_by === null ? undefined : updates.locked_by,
      };
      delete apiUpdates.colorCode;
      
      await updateCard(cardId, apiUpdates);
      
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    } catch (error) {
      console.error('Failed to update creative card:', error);
    }
  };

  const handleListTitleChange = async (listId: string, newTitle: string) => {
    setHasUnsavedChanges(true);
    setActivelyEditing({ listId });
    
    try {
      await updateList(listId, { name: newTitle });
      setHasUnsavedChanges(false);
      setActivelyEditing(null);
    } catch (error) {
      console.error('Failed to update creative list title:', error);
    }
  };

  const handleCardAdd = async (listId: string, title: string) => {
    try {
      if (!title) throw new Error('Creative card title is required');
      const list = lists.find(l => l.id === listId);
      const position = list?.cards.length ?? 0;
      const newCard = await createCard({
        list_id: listId,
        title,
        position,
      });
      return newCard.id;
    } catch (error) {
      console.error('Failed to create creative card:', error);
      throw error;
    }
  };

  const handleListAdd = async (title: string, country: string = '') => {
    try {
      if (!title) throw new Error('Creative list title is required');
      
      let targetBoardId = boardId;
      if (!targetBoardId) {
        targetBoardId = creativeBoardId || await getCompanyCreativeBoardId();
      }
      
      const maxPosition = lists.reduce((max, list) => 
        Math.max(max, list.position || 0), -1);
      const newList = await createList({
        name: title,
        position: maxPosition + 1,
        country: country,
        board_id: targetBoardId
      });
      
      // Dismiss welcome state when first list is created
      if (showEmptyBoardWelcome) {
        setShowEmptyBoardWelcome(false);
      }
      
      return newList.id;
    } catch (error) {
      console.error('Failed to create creative list:', error);
      throw error;
    }
  };

  const handleListDelete = async (listId: string) => {
    try {
      await deleteList(listId);
    } catch (error) {
      console.error('Error deleting creative list:', error);
    }
  };

  const handleCardDelete = async (listId: string, cardId: string) => {
    try {
      // Find the card to delete
      const list = lists.find(l => l.id === listId);
      const card = list?.cards.find(c => c.id === cardId);
      
      if (!card) {
        console.error('Creative card not found for deletion');
        return;
      }

      // Delete the card via API
      console.log(`Deleting creative card ${cardId} from list ${listId}`);
      await deleteCard(cardId);
      
      console.log('Creative card deleted successfully');
    } catch (error) {
      console.error('Error deleting creative card:', error);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Creative Management</h1>
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
        onCardAdd={handleCardAdd}
        onListAdd={handleListAdd}
        onListDelete={handleListDelete}
        userRole={userRole}
        session={session}
        onRefresh={handleRefresh}
        onCardModalOpen={handleCardModalOpen}
        onCardModalClose={handleCardModalClose}
        boardId={boardId || creativeBoardId || undefined}
        onCardDelete={handleCardDelete}
      />
    </div>
  );
};

export default CreativeManagement;