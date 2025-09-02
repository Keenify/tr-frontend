export interface JDContentBlock {
  id: string;
  type: 'text' | 'image' | 'bullet';
  content: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  imageUrl?: string;
  imageAlt?: string;
  order: number;
}

export interface JDPage {
  id: string;
  title: string;
  content: JDContentBlock[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateJDPageRequest {
  title: string;
  content: JDContentBlock[];
}

export interface UpdateJDPageRequest {
  title?: string;
  content?: JDContentBlock[];
}
