export interface WeeklyMeetingQuestion {
  id: string;
  company_id: string;
  question_text: string;
  question_type: 'text' | 'rating' | 'multiple_choice';
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMeetingResponse {
  id: string;
  question_id: string;
  company_id: string;
  meeting_date: string;
  response_data: Record<string, any>;
  last_edited_by: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMeetingFormData {
  company_id: string;
  meeting_date: string;
  last_edited_by: string;
  responses: Record<string, Record<string, any>>; // question_id -> response_data
}

export interface WeeklyMeetingFormResponse {
  meeting_date: string;
  questions: WeeklyMeetingQuestion[];
  responses: WeeklyMeetingResponse[];
}

export interface CreateQuestionRequest {
  company_id: string;
  question_text: string;
  question_type: 'text' | 'rating' | 'multiple_choice';
  position: number;
  is_active: boolean;
}

export interface UpdateQuestionRequest {
  question_text?: string;
  question_type?: 'text' | 'rating' | 'multiple_choice';
  position?: number;
  is_active?: boolean;
}

export interface CreateResponseRequest {
  question_id: string;
  company_id: string;
  meeting_date: string;
  response_data: Record<string, any>;
  last_edited_by: string;
}

export interface UpdateResponseRequest {
  response_data?: Record<string, any>;
  last_edited_by?: string;
}

export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface ViewMode {
  type: 'week' | 'month' | 'year';
  date: Date;
}
