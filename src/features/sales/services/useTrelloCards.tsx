import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrelloCard } from '../types/TrelloCard.types';

const fetchTrelloCards = async (listId: string): Promise<TrelloCard[]> => {
  const { data } = await axios.get<TrelloCard[]>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/lists/${listId}/cards`
  );
  return data;
};

export const getTrelloCards = (listIds: string[] | undefined) => {
  return useQuery({
    queryKey: ['trello-cards', listIds],
    queryFn: async () => {
      if (!listIds) return [];
      const results = await Promise.all(
        listIds.map(listId => fetchTrelloCards(listId))
      );
      return results;
    },
    enabled: !!listIds
  });
}; 