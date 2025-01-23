import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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

/**
 * Updates a Trello card with the provided data
 * @param {string} cardId - The ID of the card to update
 * @param {Partial<TrelloCard>} updateData - The data to update (any card fields can be modified)
 * @returns {Promise<TrelloCard>} The updated card data
 */
const updateTrelloCard = async (cardId: string, updateData: Partial<TrelloCard>): Promise<TrelloCard> => {
  const { data } = await axios.patch<TrelloCard>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/cards/${cardId}`,
    updateData
  );
  return data;
};

export const useTrelloCardUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, updateData }: { cardId: string; updateData: Partial<TrelloCard> }) =>
      updateTrelloCard(cardId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trello-cards'] });
    },
  });
};

/**
 * Creates a new Trello card with the provided data
 * @param {Omit<TrelloCard, 'id' | 'created_at'>} newCardData - The data for the new card (excluding id and created_at)
 * @returns {Promise<TrelloCard>} The created card data
 */
export const createTrelloCard = async (newCardData: Omit<TrelloCard, 'id' | 'created_at'>): Promise<TrelloCard> => {
  const { data } = await axios.post<TrelloCard>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/cards`,
    newCardData
  );
  return data;
}; 