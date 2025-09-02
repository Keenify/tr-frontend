export interface JDPage {
  id: string;
  title: string;
  content: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateJDPageRequest {
  title: string;
  content: string;
}

export interface UpdateJDPageRequest {
  title?: string;
  content?: string;
}
