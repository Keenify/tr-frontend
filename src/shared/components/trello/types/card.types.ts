import { CardAttachment } from '../services/useCardAttachment';

export interface Card {
  id: string;
  title: string;
  description?: string;
  colorCode?: string;
  color_code?: string;  // API field
  thumbnailUrl?: string;
  assignees?: string[];
  start_date?: string;
  end_date?: string;
  position?: number;
  due_date?: string;
  is_locked?: boolean;
  locked_by?: string;
  list_id?: string;
  created_at?: string;
}

/**
 * Interface representing the possible updates that can be made to a Trello card
 */
export interface CardUpdate {
  title?: string;
  description?: string;
  colorCode?: string;
  color_code?: string;  // API field
  thumbnailUrl?: string;
  assignees?: string[];
  start_date?: string;
  end_date?: string;
  position?: number;
  due_date?: string;
  list_id?: string;
  is_locked?: boolean;
  locked_by?: string;
  attachments?: CardAttachment[];
} 