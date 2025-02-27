export interface Card {
  id: string;
  title: string;
  description?: string;
  colorCode?: string;
  thumbnailUrl?: string;
  assignees?: string[];
}

/**
 * Interface representing the possible updates that can be made to a Trello card
 */
export interface CardUpdate {
  title?: string;
  description?: string;
  colorCode?: string;
  thumbnailUrl?: string;
  assignees?: string[];
} 