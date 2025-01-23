export interface TrelloCard {
  id: string;
  title: string;
  position: number;
  description: string | null;
  due_date: string | null;
  color_code: string | null;
  list_id: string;
  created_at: string;
}

/**
 * Represents an attachment for a Trello card.
 * Example response:
 * [
 *   {
 *     "file_url": "5cb130b6-1508-41c8-872a-b8b5fe675a74/20250123_215445_360_F_143428338_gcxw3Jcd0tJpkvvb53pfEztwtU9sxsgT.jpg",
 *     "file_type": "image/jpeg",
 *     "is_thumbnail": true,
 *     "id": "8807aa7c-e5da-44bc-b23e-39392fa436fb",
 *     "card_id": "5cb130b6-1508-41c8-872a-b8b5fe675a74",
 *     "created_at": "2025-01-23T13:54:46.072519"
 *   }
 * ]
 */
export interface TrelloCardAttachment {
  id: string;
  card_id: string;
  file_url: string;
  file_type: string;
  is_thumbnail: boolean;
  created_at: string;
} 