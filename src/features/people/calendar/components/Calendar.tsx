import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { ClipLoader } from 'react-spinners';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { deleteCalendarEvent, getCompanyCalendarEvents, createCalendarEvent, updateCalendarEvent } from '../services/useCalendar';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import CreateEventModal from './CreateEventModal';
import DayEventsModal from './DayEventsModal';
import EditEventModal from './EditEventModal';
import { CalendarEvent, CreateCalendarEventPayload } from '../types/calendar';
import { getEventTypeColor } from '../utils/eventUtils';
import '../styles/calendar.css';
import { Value } from 'react-calendar/dist/esm/shared/types.js';

interface CalendarProps {
  session?: Session;
}

/**
 * Main calendar component that displays and manages company events
 * Features:
 * - Monthly view of events
 * - Create, edit, and delete events
 * - View event details
 * - Automatic event fetching when month changes
 */
const CalendarComponent: React.FC<CalendarProps> = ({ session }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [activeDate, setActiveDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Add new modal state management
  type ActiveModal = 'none' | 'create' | 'dayEvents' | 'edit';
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  const authUserId = session?.user?.id;
  const { userInfo, companyInfo, error: companyError, isLoading: companyLoading } = useUserAndCompanyData(authUserId || '');
  const userId = userInfo?.id;
  const companyId = companyInfo?.id;

  const MAX_VISIBLE_EVENTS = 3; // Maximum number of events to show before adding scroll

  const fetchEvents = useCallback(async (date: Date) => {
    if (!companyId) {
      setError('Company ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      console.log('Fetching events for date range:', {
        firstDay: firstDay.toISOString(),
        lastDay: lastDay.toISOString(),
        companyId
      });

      const calendarEvents = await getCompanyCalendarEvents(
        companyId,
        firstDay.toISOString(),
        lastDay.toISOString()
      );

      console.log('Retrieved calendar events:', calendarEvents);
      setEvents(calendarEvents as CalendarEvent[]);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!companyId) return;

    try {
      await deleteCalendarEvent(eventId, companyId);
      setEvents(events.filter(event => event.id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      // Add error handling UI feedback here
    }
  };

  const handleCreateEvent = async (eventData: CreateCalendarEventPayload) => {
    if (!companyId || !userId) return;

    try {
      console.log('Creating event with payload:', {
        eventData,
        companyId,
        userId
      });
      const newEvent = await createCalendarEvent(companyId, userId, eventData);
      console.log('Created event response:', newEvent);
      setEvents(prev => [...prev, newEvent as CalendarEvent]);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventData: CreateCalendarEventPayload) => {
    if (!companyId || !editingEvent) return;

    try {
      const updatedEvent = await updateCalendarEvent(editingEvent.id, companyId, eventData);
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? (updatedEvent as CalendarEvent) : event
      ));
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to update event');
    }
  };

  // Update modal handling functions
  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setActiveModal('edit');
    setSelectedEvent(null);
  };

  useEffect(() => {
    if (!companyLoading && companyId) {
      fetchEvents(new Date());
    }
  }, [fetchEvents, companyLoading, companyId]);

  /**
   * Determines if an event should be displayed as a continuation
   * Returns 'start', 'middle', 'end', or 'single' to indicate event position
   */
  const getEventPosition = (event: CalendarEvent, date: Date) => {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    const currentDate = new Date(date);
    
    // Reset time portions for date comparison
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (eventStart.getTime() === currentDate.getTime() && eventEnd.getTime() === currentDate.getTime()) {
      return 'single';
    }
    if (eventStart.getTime() === currentDate.getTime()) {
      return 'start';
    }
    if (eventEnd.getTime() === currentDate.getTime()) {
      return 'end';
    }
    if (currentDate > eventStart && currentDate < eventEnd) {
      return 'middle';
    }
    return null;
  };

  const getTileContent = ({ date }: { date: Date }) => {
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const currentDate = new Date(date);
      
      // Reset time portions for date comparison
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      return currentDate >= eventStart && currentDate <= eventEnd;
    });

    if (dayEvents.length === 0) return null;

    const hasMoreEvents = dayEvents.length > MAX_VISIBLE_EVENTS;

    return (
      <div className="mt-1 w-full">
        <div className={`event-list ${hasMoreEvents ? 'overflow-y-auto max-h-[80px]' : ''}`}>
          {dayEvents.map(event => {
            const position = getEventPosition(event, date);
            if (!position) return null;

            return (
              <div
                key={event.id}
                className={`text-xs p-1 truncate mb-1 cursor-pointer
                  ${getEventTypeColor(event.event_type)}
                  ${position === 'start' ? 'rounded-l event-start' : ''}
                  ${position === 'end' ? 'rounded-r event-end' : ''}
                  ${position === 'middle' ? 'event-middle' : ''}
                  ${position === 'single' ? 'rounded' : ''}
                  event-container`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
                title={`${event.event_type}: ${event.title}`}
              >
                <span className="font-semibold">{event.event_type}</span>: {event.title}
              </div>
            );
          })}
        </div>
        {hasMoreEvents && (
          <div className="text-xs text-gray-500 mt-1 text-center bg-gray-100 rounded-sm">
            Scroll to see {dayEvents.length - MAX_VISIBLE_EVENTS} more events
          </div>
        )}
      </div>
    );
  };

  // Add this function to get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const currentDate = new Date(date);
      
      // Reset time portions for date comparison
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      return currentDate >= eventStart && currentDate <= eventEnd;
    });
  };

  if (companyLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader color="#4F46E5" />
      </div>
    );
  }

  if (companyError || error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{companyError?.message || error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <button
          onClick={() => setActiveModal('create')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Event
        </button>
      </div>

      <div className="calendar-container">
        <Calendar
          value={activeDate}
          onChange={(value: Value) => {
            if (value instanceof Date) {
              setActiveDate(value);
              setSelectedDate(value);
              setActiveModal('dayEvents');
            }
          }}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              setActiveDate(activeStartDate);
              fetchEvents(activeStartDate);
            }
          }}
          tileContent={getTileContent}
          className="rounded-lg border shadow"
        />
      </div>

      {/* Modal Components */}
      <CreateEventModal
        isOpen={activeModal === 'create'}
        onClose={() => setActiveModal('none')}
        onSubmit={(eventData) => {
          handleCreateEvent(eventData);
          setActiveModal('none');
        }}
        initialDate={selectedDate || undefined}
      />

      {(selectedDate || selectedEvent) && (
        <DayEventsModal
          date={selectedDate || new Date(selectedEvent?.start_time || '')}
          events={selectedDate 
            ? getEventsForDay(selectedDate)
            : selectedEvent 
              ? [selectedEvent]
              : []
          }
          isOpen={activeModal === 'dayEvents'}
          onClose={() => {
            setActiveModal('none');
            setSelectedDate(null);
            setSelectedEvent(null);
          }}
          onEditEvent={handleEdit}
          onDeleteEvent={(eventId) => {
            handleDeleteEvent(eventId);
            setActiveModal('none');
          }}
        />
      )}

      {editingEvent && (
        <EditEventModal
          isOpen={activeModal === 'edit'}
          onClose={() => {
            setActiveModal('none');
            setEditingEvent(null);
          }}
          onSubmit={(eventData) => {
            handleUpdateEvent(eventData);
            setActiveModal('none');
          }}
          event={editingEvent}
        />
      )}
    </div>
  );
};

export default CalendarComponent;
