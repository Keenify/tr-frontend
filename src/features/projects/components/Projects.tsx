import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { createCard, updateCard, deleteCard } from "../../../shared/components/trello/services/useCard";
import { createList, updateList, deleteList } from "../../../shared/components/trello/services/useList";
import { TrelloBoard } from "../../../shared/components/trello/TrelloBoard";
import { CardUpdate, Card as TrelloCard } from "../../../shared/components/trello/types/card.types";
import { Label } from "../../../shared/types/label.types";
import { getBoardDetails, getCompanyProjectsBoard, HARDCODED_BOARD_ID } from "../services/useBoard";
import { List, Card as ProjectCard } from "../types/board";
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { getUserData } from '../../../services/useUser';
import { logDeletion } from '../../../shared/services/deletionLogService';
import { MobileNavToggle } from '../../dailyHuddle/components/MobileNavToggle';
import { MobileSidebarOverlay } from '../../dailyHuddle/components/MobileSidebarOverlay';
import { SidebarNavigation } from '../../../shared/components/SidebarNavigation';
import { useIsMobileOrTablet } from '../../../hooks/useResponsive';
import '../styles/Projects.css';

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

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobileOrTablet = useIsMobileOrTablet();

  // Use ref to store companyBoardId to avoid dependency recreation cycles
  const companyBoardIdRef = useRef<string | null>(null);
  
  // Update ref whenever state changes
  useEffect(() => {
    companyBoardIdRef.current = companyBoardId;
  }, [companyBoardId]);

  // Debug logging for component lifecycle
  useEffect(() => {
    console.log('🔄 [Projects] Component mounted');
    return () => {
      console.log('💪 [Projects] Component unmounting');
    };
  }, []);

  // Mobile sidebar handlers
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // Get or create company-specific Projects board
  const getCompanyBoard = useCallback(async () => {
    console.log('🔄 [Projects] getCompanyBoard recreated with companyInfo?.id:', companyInfo?.id);
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

  // Extract fetchBoardDetails into a reusable function with minimal dependencies
  const fetchBoardDetails = useCallback(async () => {
    console.log('🔄 [Projects] fetchBoardDetails called');
    try {
      setIsLoading(true);
      
      // Determine which board to use: provided boardId, company board, or fallback
      let targetBoardId = boardId;
      if (!targetBoardId) {
        // Use ref to avoid dependency recreation cycle
        if (companyBoardIdRef.current) {
          targetBoardId = companyBoardIdRef.current;
        } else if (companyInfo?.id) {
          // Inline the company board logic to reduce dependencies
          const boardResponse = await getCompanyProjectsBoard(companyInfo.id);
          setCompanyBoardId(boardResponse.board_id);
          companyBoardIdRef.current = boardResponse.board_id;
          targetBoardId = boardResponse.board_id;
        } else {
          throw new Error('Company information not available');
        }
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
  }, [boardId, companyInfo?.id]); // Removed companyBoardId dependency

  // Load board details on mount and when company data is available
  useEffect(() => {
    console.log('🔥 [Projects] Main useEffect triggered with:', { companyInfoId: companyInfo?.id, isLoadingCompany });
    // Only fetch if company info is available and loading is complete
    if (companyInfo?.id && !isLoadingCompany) {
      console.log('✅ [Projects] Calling fetchBoardDetails');
      fetchBoardDetails();
    }
  }, [companyInfo?.id, isLoadingCompany]); // Removed fetchBoardDetails to prevent infinite loop

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
    console.log('🔄 [Projects] handleRefresh called');
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
  }, [hasUnsavedChanges, activelyEditing]); // Removed fetchBoardDetails dependency

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
      console.log(`🔄 [Projects] List moved from ${sourceIndex} to ${destinationIndex}`);
      
      // Create a new array reflecting the new order (original working approach)
      const newLists = Array.from(lists);
      const [removed] = newLists.splice(sourceIndex, 1);
      newLists.splice(destinationIndex, 0, removed);

      console.log(`📍 [Projects] Updating all ${newLists.length} lists with new positions`);

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
      console.log(`✅ [Projects] All list positions updated successfully`);
    } catch (error) {
      console.error('❌ [Projects] Failed to move list:', error);
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
      console.log(`🔄 [Projects] Card moved: ${cardId} from ${sourceListId}[${sourceIndex}] to ${destinationListId}[${destinationIndex}]`);
      
      // Calculate target position (1-based indexing)
      const targetPosition = destinationIndex + 1;
      
      // Single atomic API call with exact target position
      await updateCard(cardId, {
        list_id: destinationListId,
        position: targetPosition
      });
      
      console.log(`✅ [Projects] Card position updated successfully`);
    } catch (error) {
      console.error('❌ [Projects] Failed to move card:', error);
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
      // Find the list to get its title for logging
      const listToDelete = lists.find(l => l.id === listId);
      const listTitle = listToDelete?.title || listToDelete?.name || 'Unknown List';
      
      await deleteList(listId);
      
      // Log the deletion
      if (companyInfo?.id && session.user.id) {
        const userData = await getUserData(session.user.id);
        const fullName = `${userData.first_name} ${userData.last_name}`.trim() || 'Unknown User';
        await logDeletion(
          'delete_list',
          listId,
          listTitle,
          session.user.id,
          fullName,
          companyInfo.id,
          'projects'
        );
      }
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

  return (
    <>
      {/* Mobile-only components - ONLY render on mobile/tablet */}
      {isMobileOrTablet && (
        <>
          <MobileNavToggle isOpen={isMobileSidebarOpen} onClick={toggleMobileSidebar} />
          <MobileSidebarOverlay isOpen={isMobileSidebarOpen} onClose={closeMobileSidebar}>
            <SidebarNavigation
              session={session}
              onNavigate={closeMobileSidebar}
              isMobile={true}
            />
          </MobileSidebarOverlay>
        </>
      )}

      <div className="projects-page min-h-screen p-6 flex flex-col">
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
          onCardDelete={handleCardDelete}
          onListDelete={handleListDelete}
          userRole={userRole}
          session={session}
          onRefresh={handleRefresh}
          onCardModalOpen={handleCardModalOpen}
          onCardModalClose={handleCardModalClose}
          boardModule="projects"
        />
      </div>
    </>
  );
};

export default Project;
