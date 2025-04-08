export type EventType = 'Employee Leave' | 'Booth' | 'Meeting' | '1 to 1 Meeting' | 'Other';

export interface Participant {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  profile_pic_url?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: EventType;
  location?: string;
  description?: string;
  start_time: string;
  end_time: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: Participant[];
}

export interface CreateCalendarEventPayload {
  title: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  participant_ids?: string[];
}

export interface UpdateCalendarEventPayload {
  title?: string;
  event_type?: string;
  location?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  participant_ids?: string[];
} 