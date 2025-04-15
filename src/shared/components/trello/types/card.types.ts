import { CardAttachment } from '../services/useCardAttachment';
import { Label } from "../../../types/label.types";

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
  attachmentCount?: number;
  labels?: Label[];
  label_ids?: string[];
}

/**
 * Interface representing the possible updates that can be made to a Trello card
 */
export interface CardUpdate {
  title?: string;
  description?: string | null;
  colorCode?: string;
  color_code?: string;
  assignees?: string[];
  attachments?: CardAttachment[];
  attachmentCount?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_locked?: boolean;
  locked_by?: string | null;
  list_id?: string;
  position?: number;
  label_ids?: string[];
} 