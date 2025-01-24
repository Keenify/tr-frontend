import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { TrelloCard, TrelloCardAttachment } from '../types/TrelloCard.types';

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

/**
 * Deletes a Trello card by its ID
 * @param {string} cardId - The ID of the card to delete
 * @returns {Promise<boolean>} True if the card was successfully deleted, otherwise false
 */
export const deleteTrelloCard = async (cardId: string): Promise<boolean> => {
  try {
    await axios.delete(
      `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/cards/${cardId}`
    );
    return true;
  } catch (error) {
    console.error('Failed to delete card:', error);
    return false;
  }
};

/**
 * Creates an attachment for a Trello card
 * @param {string} cardId - The ID of the card to attach the file to
 * @param {File} file - The file to attach
 * @param {boolean} isThumbnail - Whether the file is a thumbnail
 * @returns {Promise<TrelloCardAttachment>} The created attachment data
 */
export const createTrelloCardAttachment = async (
  cardId: string,
  file: File,
  isThumbnail: boolean
): Promise<TrelloCardAttachment> => {

  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axios.post<TrelloCardAttachment>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/attachments?card_id=${cardId}&is_thumbnail=${isThumbnail}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data;
};

/**
 * Fetches all attachments for a given Trello card by its ID
 * @param {string} cardId - The ID of the card to fetch attachments for
 * @returns {Promise<TrelloCardAttachment[]>} The list of attachments for the card
 */
export const getTrelloCardAttachments = async (cardId: string): Promise<TrelloCardAttachment[]> => {
  const { data } = await axios.get<TrelloCardAttachment[]>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/cards/${cardId}/attachments`
  );
  return data;
};

/**
 * Fetches the URL of a Trello card attachment by its ID
 * @param {string} attachmentId - The ID of the attachment
 * @returns {Promise<string>} The URL of the attachment
 */
export const getTrelloCardAttachmentUrl = async (attachmentId: string): Promise<string> => {
  const { data } = await axios.get<string>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/attachments/${attachmentId}/url`
  );
  return data;
};

/**
 * Deletes a Trello card attachment by its ID
 * @param {string} attachmentId - The ID of the attachment to delete
 * @returns {Promise<boolean>} True if the attachment was successfully deleted, otherwise false
 */
export const deleteTrelloCardAttachment = async (attachmentId: string): Promise<boolean> => {
  try {
    await axios.delete(
      `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/attachments/${attachmentId}`
    );
    return true;
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    return false;
  }
};

/**
 * Updates a Trello card attachment with the provided data
 * @param {string} attachmentId - The ID of the attachment to update
 * @param {Partial<TrelloCardAttachment>} updateData - The data to update (any attachment fields can be modified)
 * @returns {Promise<TrelloCardAttachment>} The updated attachment data
 */
export const updateTrelloCardAttachment = async (
  attachmentId: string,
  updateData: Partial<TrelloCardAttachment>
): Promise<TrelloCardAttachment> => {
  const { data } = await axios.patch<TrelloCardAttachment>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/attachments/${attachmentId}`,
    updateData,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
};

/**
 * Fetches the thumbnail URL for a given Trello card by its ID
 * @param {string} cardId - The ID of the card to fetch the thumbnail for
 * @returns {Promise<string>} The URL of the thumbnail
 */
export const getTrelloCardThumbnailUrl = async (cardId: string): Promise<string> => {
  const { data } = await axios.get<string>(
    `${import.meta.env.VITE_BACKEND_API_DOMAIN}/trello/cards/${cardId}/thumbnail`
  );
  return data;
};