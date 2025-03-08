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
import { directoryService } from '../../../../shared/services/directoryService';
import { Employee } from '../../../../shared/types/directory.types';
import { 
  getEmployeeSyncRecords, 
  syncAllCalendarEvents, 
  syncCalendarEvent, 
  updateSyncedCalendarEvent,
  checkEventSyncStatus,
  deleteSyncedCalendarEvent
} from '../services/useGoogleSyncCalendar';
import { validateGoogleToken } from '../../../integration/services/useGoogle';
import { toast } from 'react-hot-toast';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [activeDate, setActiveDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [googleCalendarIntegrated, setGoogleCalendarIntegrated] = useState<boolean>(false);
  const [allEventsSynced, setAllEventsSynced] = useState<boolean>(false);
  const [syncingEvents, setSyncingEvents] = useState<boolean>(false);

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

  const fetchEmployees = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const employeesData = await directoryService.fetchEmployees(companyId);
      setEmployees(employeesData);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  }, [companyId]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!companyId || !userId) {
      console.error('❌ Delete event failed: Missing companyId or userId', { companyId, userId });
      return;
    }

    console.log('🔄 Attempting to delete event:', {
      eventId,
      companyId,
      userId
    });

    try {
      // First check if Google Calendar is integrated
      console.log('🔄 Checking Google Calendar integration status...');
      const validationResponse = await validateGoogleToken({
        employee_id: userId,
        company_id: companyId,
        refresh: false
      });
      
      console.log('📥 Google Calendar validation response:', validationResponse);
      
      // If Google Calendar is integrated, delete the sync first
      if (validationResponse.is_valid) {
        console.log('🔄 Deleting Google Calendar sync first...');
        try {
          const deleteGoogleResult = await deleteSyncedCalendarEvent(eventId, userId, companyId);
          console.log('✅ Google Calendar sync deleted:', deleteGoogleResult);
        } catch (deleteError) {
          console.log('ℹ️ Google Calendar sync deletion result:', deleteError);
          // Continue even if the Google sync deletion fails
        }
      } else {
        console.log('ℹ️ Google Calendar not integrated, skipping sync deletion');
      }
      
      // Then delete the event from our calendar
      console.log('🔄 Now deleting the calendar event...');
      const deleteResult = await deleteCalendarEvent(eventId, companyId);
      console.log('✅ Calendar event deleted successfully:', deleteResult);
      
      // Update UI to remove the deleted event
      setEvents(events.filter(event => event.id !== eventId));
      
      // Update the Google Calendar integration status
      await checkGoogleCalendarStatus();
      
    } catch (err) {
      console.error('❌ Error deleting event:', err);
      // Show error message to user
      toast.error('Failed to delete event. Please try again.');
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
      
      // Sync the newly created event with Google Calendar if integration is active
      try {
        const validationResponse = await validateGoogleToken({
          employee_id: userId,
          company_id: companyId,
          refresh: false
        });
        
        if (validationResponse.is_valid) {
          await syncCalendarEvent(newEvent.id, userId, companyId);
          await checkGoogleCalendarStatus();
        }
      } catch (syncError) {
        console.error('Error syncing new event to Google Calendar:', syncError);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventData: CreateCalendarEventPayload) => {
    if (!companyId || !editingEvent || !userId) return;

    try {
      const updatedEvent = await updateCalendarEvent(editingEvent.id, companyId, eventData);
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? (updatedEvent as CalendarEvent) : event
      ));
      
      // Update the synced event in Google Calendar if integration is active
      try {
        const validationResponse = await validateGoogleToken({
          employee_id: userId,
          company_id: companyId,
          refresh: false
        });
        
        if (validationResponse.is_valid) {
          // Check if the event is already synced
          const syncStatus = await checkEventSyncStatus(updatedEvent.id, userId);
          
          if (syncStatus.is_synced) {
            // Update the existing synced event
            await updateSyncedCalendarEvent(updatedEvent.id, userId, companyId);
          } else {
            // Create a new sync if not already synced
            await syncCalendarEvent(updatedEvent.id, userId, companyId);
          }
          
          await checkGoogleCalendarStatus();
        }
      } catch (syncError) {
        console.error('Error syncing updated event to Google Calendar:', syncError);
      }
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

  const checkGoogleCalendarStatus = useCallback(async () => {
    if (!userId || !companyId) return;
    
    try {
      // First check if Google is actually connected via token validation
      const validationResponse = await validateGoogleToken({
        employee_id: userId,
        company_id: companyId,
        refresh: false
      });
      
      setGoogleCalendarIntegrated(validationResponse.is_valid);
      
      // Then check sync status of events
      const syncRecords = await getEmployeeSyncRecords(userId);
      if (syncRecords.total > 0 && events.length > 0) {
        setAllEventsSynced(syncRecords.total >= events.length);
      } else {
        setAllEventsSynced(false);
      }
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
      setGoogleCalendarIntegrated(false);
      setAllEventsSynced(false);
    }
  }, [userId, companyId, events.length]);

  useEffect(() => {
    if (!companyLoading && companyId) {
      fetchEvents(new Date());
      fetchEmployees();
      checkGoogleCalendarStatus();
    }
  }, [fetchEvents, fetchEmployees, companyLoading, companyId, checkGoogleCalendarStatus]);

  const handleSyncAllEvents = async () => {
    if (!userId || !companyId) return;
    
    try {
      setSyncingEvents(true);
      await syncAllCalendarEvents(userId, companyId);
      await checkGoogleCalendarStatus();
    } catch (error) {
      console.error('Error syncing all events:', error);
    } finally {
      setSyncingEvents(false);
    }
  };

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

  const getStatusEmoji = (description: string = '') => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('pending')) return '⏳';
    if (lowerDesc.includes('approved')) return '✅';
    if (lowerDesc.includes('cancelled') || lowerDesc.includes('rejected')) return '❌';
    return '';
  };

  const formatEventTitle = (event: CalendarEvent) => {
    const eventTypeMapping = {
      'annual_leave': 'Annual Leave',
      'sick_leave': 'Sick Leave',
      'timeoff': 'Time Off'
    };

    const isLeaveEvent = ['sick_leave', 'timeoff', 'annual_leave'].includes(event.event_type.toLowerCase());
    if (!isLeaveEvent) {
      return `${event.event_type}: ${event.title}`;
    }

    // Extract name from the title (assuming format "Leave Request - Name")
    const name = event.title.split(' - ')[1] || event.title;
    const statusEmoji = getStatusEmoji(event.description);
    const formattedEventType = eventTypeMapping[event.event_type.toLowerCase() as keyof typeof eventTypeMapping] || event.event_type;
    return `${formattedEventType}: ${statusEmoji} ${name}`;
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

      // Filter out pending or rejected leave requests
      const isLeaveEvent = ['sick_leave', 'timeoff', 'annual_leave'].includes(event.event_type.toLowerCase());
      if (isLeaveEvent) {
        const description = event.description?.toLowerCase() || '';
        if (description.includes('pending') || description.includes('rejected')) {
          return false;
        }
      }

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
                title={formatEventTitle(event)}
              >
                {formatEventTitle(event)}
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

      // Filter out pending or rejected leave requests
      const isLeaveEvent = ['sick_leave', 'timeoff', 'annual_leave'].includes(event.event_type.toLowerCase());
      if (isLeaveEvent) {
        const description = event.description?.toLowerCase() || '';
        if (description.includes('pending') || description.includes('rejected')) {
          return false;
        }
      }

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
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="ml-4 flex items-center space-x-2">
            <div className="flex items-center" title={googleCalendarIntegrated ? "Google Calendar is connected" : "Google Calendar is not connected"}>
              <span className="mr-1">Google Calendar:</span>
              {googleCalendarIntegrated ? (
                <span className="text-green-500 text-xl">✓</span>
              ) : (
                <span className="text-red-500 text-xl">✗</span>
              )}
            </div>
            
            <div className="flex items-center" title={allEventsSynced ? "All events are synced" : "Not all events are synced"}>
              <span className="mr-1">All Events Synced:</span>
              {allEventsSynced ? (
                <span className="text-green-500 text-xl">✓</span>
              ) : (
                <span className="text-red-500 text-xl">✗</span>
              )}
              {!allEventsSynced && (
                <button 
                  onClick={handleSyncAllEvents}
                  disabled={syncingEvents}
                  className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {syncingEvents ? "Syncing..." : "Sync All"}
                </button>
              )}
            </div>
          </div>
        </div>
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
        employees={employees}
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
          employees={employees}
        />
      )}
    </div>
  );
};

export default CalendarComponent;
