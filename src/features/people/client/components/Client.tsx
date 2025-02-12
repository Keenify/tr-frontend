import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { createCard, updateCard } from "../../../../shared/components/trello/services/useCard";
import { createList, updateList, deleteList } from "../../../../shared/components/trello/services/useList";
import { CardUpdate, TrelloBoard } from "../../../../shared/components/trello/TrelloBoard";
import { getBoardDetails, HARDCODED_BOARD_ID } from "../services/useBoard";
import { List } from "../types/board";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import { getUserData } from '../../../../services/useUser';

interface ClientProps {
  session: Session;
  boardId?: string;
}

const Client: React.FC<ClientProps> = ({ 
  session, 
  boardId = HARDCODED_BOARD_ID 
}) => {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchBoardDetails = async () => {
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

  const handleListMove = async (sourceIndex: number, destinationIndex: number) => {
    try {
      const sourceList = lists[sourceIndex];
      const destinationList = lists[destinationIndex];
      await Promise.all([
        updateList(sourceList.id, { position: destinationIndex }),
        updateList(destinationList.id, { position: sourceIndex })
      ]);
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
        <h1 className="text-2xl font-bold">Client Management</h1>
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

export default Client;
