export type EventType = 'Employee Leave' | 'Booth' | 'Meeting' | 'Other';

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
}

export interface CreateCalendarEventPayload {
  title: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
} 