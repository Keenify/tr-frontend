import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrelloList } from '../types/TrelloList.types';

// Sales Board ID
const BOARD_ID = '0b9d94dd-1796-43f3-8021-5e22f923ef8a';

// Fetch Trello Lists
const fetchTrelloLists = async (): Promise<TrelloList[]> => {
  const { data } = await axios.get<TrelloList[]>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/boards/${BOARD_ID}/lists`
  );
  return data;
};

// Edit Trello List
export const editTrelloList = async (listId: string, updatedData: Partial<TrelloList>): Promise<TrelloList> => {
  const { data } = await axios.patch<TrelloList>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/lists/${listId}`,
    updatedData
  );
  return data;
};

// Use Trello List
export const useTrelloList = () => {
  return useQuery({
    queryKey: ['trello-lists', BOARD_ID],
    queryFn: fetchTrelloLists,
  });
};
