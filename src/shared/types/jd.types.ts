export interface JDPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  company_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  display_order: number;
}

export interface CreateJDPageRequest {
  title: string;
  content?: string;
  companyId?: string;
}

export interface UpdateJDPageRequest {
  title?: string;
  content?: string;
}

export interface DeleteJDPageResponse {
  success: boolean;
  nextPageId?: string;
}
