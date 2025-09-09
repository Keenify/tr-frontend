export interface WeeklyMeetingQuestion {
  id: string;
  company_id: string;
  question_text: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMeetingResponse {
  id: string;
  company_id: string;
  meeting_date: string;
  response_data: Record<string, any>;
  last_edited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMeetingFormData {
  company_id: string;
  meeting_date: string;
  last_edited_by?: string;
  responses: Record<string, Record<string, any>>; // response_id -> response_data
}


export interface CreateQuestionRequest {
  company_id: string;
  question_text: Record<string, any>;
}

export interface UpdateQuestionRequest {
  question_text?: Record<string, any>;
}

export interface CreateResponseRequest {
  company_id: string;
  meeting_date: string;
  response_data: Record<string, any>;
  last_edited_by?: string;
}

export interface UpdateResponseRequest {
  response_data?: Record<string, any>;
  last_edited_by?: string;
}


export interface ViewMode {
  type: 'week' | 'month' | 'year';
  date: Date;
}
