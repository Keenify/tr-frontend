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

export interface TrelloCardAttachment {
  id: string;
  card_id: string;
  file_url: string;
  file_type: string;
  is_thumbnail: boolean;
  created_at: string;
} 