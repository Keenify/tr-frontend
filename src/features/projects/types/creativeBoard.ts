import { Label } from '../../../shared/types/label.types';

// Creative Management Card interface
export interface CreativeCard {
  id: string;
  title: string;
  description?: string;
  position: number;
  due_date?: string;
  color_code?: string;
  is_locked?: boolean;
  locked_by?: string | null;
  start_date?: string;
  end_date?: string;
  thumbnail_url?: string;
  attachment_count?: number;
  labels?: Label[];
  assignees?: CreativeAssignee[];
  created_at: string;
}

// Creative Management List interface
export interface CreativeList {
  id: string;
  name: string;
  position: number;
  country?: string;
  cards: CreativeCard[];
  created_at: string;
}

// Creative Management Board Details interface
export type CreativeBoardDetails = CreativeList[];

// Creative Management Assignee interface
export interface CreativeAssignee {
  employee_id: string;
  assigned_at: string;
}

// Creative Management specific card update interface
export interface CreativeCardUpdate {
  title?: string;
  description?: string | null;
  position?: number;
  due_date?: string | null;
  colorCode?: string;
  is_locked?: boolean;
  locked_by?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  list_id?: string;
  label_ids?: string[];
}

// Creative Management specific list interface for UI
export interface CreativeUIList extends Omit<CreativeList, 'cards'> {
  title: string;
  cards: (CreativeCard & {
    thumbnailUrl?: string;
    colorCode?: string;
    due_date?: string;
    labels?: Label[];
  })[];
}

// Creative workflow templates
export const CREATIVE_WORKFLOW_TEMPLATES = {
  campaign: ['Brief', 'Concepts', 'Design', 'Review', 'Final'],
  branding: ['Research', 'Concepts', 'Development', 'Refinement', 'Delivery'],
  content: ['Planning', 'Creation', 'Review', 'Approval', 'Publishing'],
  design: ['Requirements', 'Wireframes', 'Design', 'Development', 'Testing'],
  social_media: ['Strategy', 'Content Creation', 'Scheduling', 'Published', 'Analytics']
} as const;

// Creative file types for enhanced file support
export const CREATIVE_FILE_TYPES = {
  design: ['.psd', '.ai', '.sketch', '.fig', '.xd'],
  images: ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif'],
  videos: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  documents: ['.pdf', '.doc', '.docx', '.ppt', '.pptx'],
  fonts: ['.ttf', '.otf', '.woff', '.woff2']
} as const;