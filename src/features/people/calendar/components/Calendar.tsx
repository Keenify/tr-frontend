import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { ClipLoader } from 'react-spinners';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { deleteCalendarEvent, getCompanyCalendarEvents, createCalendarEvent, updateCalendarEvent } from '../services/useCalendar';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import CreateEventModal from './CreateEventModal';
import DayEventsModal from './DayEventsModal';
import EditEventModal from './EditEventModal';
import { CalendarEvent, CreateCalendarEventPayload } from '../types/calendar';
import { getEventTypeColor } from '../utils/eventUtils';
import '../styles/calendar.css';
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
import { EventClickArg, DateSelectArg, DatesSetArg } from '@fullcalendar/core';

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
  const [currentViewRange, setCurrentViewRange] = useState<{ start: Date, end: Date } | null>(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [googleCalendarIntegrated, setGoogleCalendarIntegrated] = useState<boolean>(false);
  const [allEventsSynced, setAllEventsSynced] = useState<boolean>(false);
  const [syncingEvents, setSyncingEvents] = useState<boolean>(false);

  type ActiveModal = 'none' | 'create' | 'dayEvents' | 'edit';
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  const authUserId = session?.user?.id;
  const { userInfo, companyInfo, error: companyError, isLoading: companyLoading } = useUserAndCompanyData(authUserId || '');
  const userId = userInfo?.id;
  const companyId = companyInfo?.id;

  const fetchEvents = useCallback(async (startDate: Date, endDate: Date) => {
    if (!companyId) {
      setError('Company ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      console.log(`🔄 Fetching events for range: ${startISO} to ${endISO}`);

      const calendarEvents = await getCompanyCalendarEvents(companyId, startISO, endISO);

      console.log(`✅ Retrieved ${calendarEvents.length} calendar events.`);
      if (calendarEvents.length > 0) {
        console.log('Sample event:', calendarEvents[0]);
      }

      const filteredEvents = calendarEvents.filter(event => {
        const isLeaveEvent = ['sick_leave', 'timeoff', 'annual_leave'].includes(event.event_type.toLowerCase());
        if (isLeaveEvent) {
            const description = event.description?.toLowerCase() || '';
            return !description.includes('pending') && !description.includes('rejected');
        }
        return true;
      });

      setEvents(filteredEvents as CalendarEvent[]);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
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
      toast.error('Failed to delete event. Missing required information.');
      return;
    }

    console.log('🔄 Attempting to delete event:', { eventId, companyId, userId });

    try {
      let isGoogleIntegrated = false;
      try {
        console.log('🔄 Checking Google Calendar integration status...');
        const validationResponse = await validateGoogleToken({
          employee_id: userId,
          company_id: companyId,
          refresh: false
        });
        console.log('📥 Google Calendar validation response:', validationResponse);
        isGoogleIntegrated = validationResponse.is_valid;
      } catch (googleError) {
        console.log('ℹ️ Google Calendar integration check failed:', googleError);
        isGoogleIntegrated = false;
      }

      if (isGoogleIntegrated) {
        console.log('🔄 Deleting Google Calendar sync first...');
        try {
          const deleteGoogleResult = await deleteSyncedCalendarEvent(eventId, userId, companyId);
          console.log('✅ Google Calendar sync deleted:', deleteGoogleResult);
        } catch (deleteError) {
          console.log('ℹ️ Google Calendar sync deletion result:', deleteError);
        }
      } else {
        console.log('ℹ️ Google Calendar not integrated or check failed, skipping sync deletion');
      }

      console.log('🔄 Now deleting the calendar event...');
      const deleteResult = await deleteCalendarEvent(eventId, companyId);
      console.log('✅ Calendar event deleted successfully:', deleteResult);

      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      setActiveModal('none');
      setSelectedEvent(null);
      setEditingEvent(null);

      toast.success('Event deleted successfully');

      try {
        await checkGoogleCalendarStatus();
      } catch (statusError) {
        console.log('ℹ️ Failed to update Google Calendar status after deletion:', statusError);
      }

    } catch (err) {
      console.error('❌ Error deleting event:', err);
      toast.error('Failed to delete event. Please try again.');
      if (currentViewRange) {
         fetchEvents(currentViewRange.start, currentViewRange.end);
      }
    }
  };

  const handleCreateEvent = async (eventData: CreateCalendarEventPayload) => {
    if (!companyId || !userId) return;

    try {
      console.log('Creating event with payload:', { eventData, companyId, userId });
      const newEvent = await createCalendarEvent(companyId, userId, eventData);
      console.log('Created event response:', newEvent);
      if (currentViewRange && new Date(newEvent.start_time) <= currentViewRange.end && new Date(newEvent.end_time) >= currentViewRange.start) {
         setEvents(prev => [...prev, newEvent as CalendarEvent]);
       } else if (currentViewRange) {
         fetchEvents(currentViewRange.start, currentViewRange.end);
       }
      toast.success('Event created successfully');

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
      toast.error('Failed to create event. Please try again.');
    }
  };

  const handleUpdateEvent = async (eventData: CreateCalendarEventPayload) => {
    if (!companyId || !editingEvent || !userId) return;
    const eventIdToUpdate = editingEvent.id;

    try {
      const updatedEvent = await updateCalendarEvent(eventIdToUpdate, companyId, eventData);
      if (currentViewRange) {
         fetchEvents(currentViewRange.start, currentViewRange.end);
       }
      toast.success('Event updated successfully');

      try {
        const validationResponse = await validateGoogleToken({
          employee_id: userId,
          company_id: companyId,
          refresh: false
        });
        if (validationResponse.is_valid) {
          const syncStatus = await checkEventSyncStatus(updatedEvent.id, userId);
          if (syncStatus.is_synced) {
            await updateSyncedCalendarEvent(updatedEvent.id, userId, companyId);
          } else {
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
      toast.error('Failed to update event. Please try again.');
      if (currentViewRange) {
         fetchEvents(currentViewRange.start, currentViewRange.end);
       }
    } finally {
      setActiveModal('none');
      setEditingEvent(null);
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setActiveModal('edit');
    setSelectedEvent(null);
    setSelectedDateForModal(null);
  };

  const checkGoogleCalendarStatus = useCallback(async () => {
    if (!userId || !companyId) return;
    
    try {
      const validationResponse = await validateGoogleToken({
        employee_id: userId,
        company_id: companyId,
        refresh: false
      });
      
      setGoogleCalendarIntegrated(validationResponse.is_valid);
      
      const syncRecords = await getEmployeeSyncRecords(userId);
      
      setAllEventsSynced(syncRecords.total > 0);
    } catch (error) {
       console.error('Error checking Google Calendar status:', error);
       // Gracefully handle the error: Assume not integrated if validation fails
       setGoogleCalendarIntegrated(false);
       setAllEventsSynced(false);
     }
  }, [userId, companyId]);

  useEffect(() => {
    if (!companyLoading && companyId) {
      fetchEmployees();
    }
  }, [companyLoading, companyId, fetchEmployees]);

  useEffect(() => {
    if (companyId) {
      console.log('🚀 Checking Google status once.');
      checkGoogleCalendarStatus();
    }
    // Intentionally run only when companyId changes from undefined to defined
  }, [companyId, checkGoogleCalendarStatus]);

  useEffect(() => {
    if (currentViewRange && companyId) {
      console.log('🔄 currentViewRange changed, fetching events:', currentViewRange);
      fetchEvents(currentViewRange.start, currentViewRange.end);
    }
  }, [currentViewRange, companyId, fetchEvents]);

  const handleSyncAllEvents = async () => {
    if (!userId || !companyId) return;
    
    try {
      setSyncingEvents(true);
      await syncAllCalendarEvents(userId, companyId);
      await checkGoogleCalendarStatus();
      toast.success('All events synced successfully.');
    } catch (error) {
      console.error('Error syncing all events:', error);
      toast.error('Failed to sync all events.');
    } finally {
      setSyncingEvents(false);
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    console.log(`📅 datesSet triggered. Requesting view range: ${arg.start.toISOString()} to ${arg.end.toISOString()}`);

    // Prevent redundant state updates if the range hasn't changed
    if (
      !currentViewRange || 
      arg.start.getTime() !== currentViewRange.start.getTime() ||
      arg.end.getTime() !== currentViewRange.end.getTime()
    ) {
        console.log('🚀 Setting new currentViewRange.');
        setCurrentViewRange({ start: arg.start, end: arg.end });
    } else {
        console.log('💨 datesSet called but range is the same, skipping state update.');
    }
  };

  const handleDateClick = (arg: DateSelectArg) => {
    console.log('🖱️ Date clicked:', arg.startStr);
    setSelectedDateForModal(arg.start);
    setActiveModal('create');
    setSelectedEvent(null);
    setEditingEvent(null);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    console.log('🖱️ Event clicked:', clickInfo.event.id, clickInfo.event.title);
    const clickedEvent = events.find(event => event.id === clickInfo.event.id);
    if (clickedEvent) {
      setSelectedEvent(clickedEvent);
      setActiveModal('dayEvents');
      setSelectedDateForModal(null);
      setEditingEvent(null);
    } else {
      console.warn("Clicked event not found in state:", clickInfo.event.id);
    }
  };

  const fullCalendarEvents = events.map(event => ({
    id: event.id,
    title: formatEventTitleForDisplay(event),
    start: event.start_time,
    end: event.end_time,
    allDay: new Date(event.start_time).getHours() === 0 && 
            new Date(event.start_time).getMinutes() === 0 && 
            new Date(event.start_time).getSeconds() === 0,
    extendedProps: {
      ...event,
    },
    className: getEventClassNames(event),
  }));

  function formatEventTitleForDisplay(event: CalendarEvent): string {
      const eventTypeMapping = {
          'annual_leave': 'Annual Leave',
          'sick_leave': 'Sick Leave',
          'timeoff': 'Time Off'
      };
      const isLeaveEvent = ['sick_leave', 'timeoff', 'annual_leave'].includes(event.event_type.toLowerCase());

      if (!isLeaveEvent) {
          return `${event.event_type}: ${event.title}`;
      }

      const name = event.title.split(' - ')[1] || event.title;
      const formattedEventType = eventTypeMapping[event.event_type.toLowerCase() as keyof typeof eventTypeMapping] || event.event_type;
       return `${formattedEventType}: ${name}`;
  }

  function getEventClassNames(event: CalendarEvent): string[] {
    const classes = ['fc-event-custom'];
    const colorClass = getEventTypeColor(event.event_type);

    // Add the type-specific class
    classes.push(`fc-event-${event.event_type.toLowerCase()}`); 

    // Only add the BACKGROUND class from getEventTypeColor
    if (colorClass) { 
      const backgroundClass = colorClass.split(' ').find(cls => cls.startsWith('bg-'));
      if (backgroundClass) {
        classes.push(backgroundClass);
      } else {
        // Fallback if no bg- class found in the string
        classes.push(colorClass.split(' ')[0]); // Add the first class as a potential background
      }
    }

    return classes;
  }

  if (companyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader color="#4F46E5" /> Loading company data...
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Error Loading Company Data</h1>
        <p>{companyError?.message}</p>
      </div>
    );
  }

   if (error && !loading) {
     return (
       <div className="p-4 bg-red-50 text-red-600 rounded-lg">
         <h1 className="text-2xl font-bold mb-4">Error Loading Calendar</h1>
         <p>{error}</p>
         <button
           onClick={() => currentViewRange && fetchEvents(currentViewRange.start, currentViewRange.end)}
           className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
         >
           Retry
         </button>
       </div>
     );
   }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center">
           <h1 className="text-2xl font-bold">Calendar</h1>
           {loading && <ClipLoader size={20} color="#4F46E5" className="ml-2" />}
        </div>
         <div className="flex flex-wrap items-center space-x-2">
            <div className="flex items-center p-1 bg-gray-100 rounded" title={googleCalendarIntegrated ? "Google Calendar is connected" : "Google Calendar is not connected"}>
               <span className="mr-1 text-sm">Google Calendar:</span>
               {googleCalendarIntegrated ? (
                 <span className="text-green-500 text-xl">✓</span>
               ) : (
                 <span className="text-red-500 text-xl">✗</span>
               )}
             </div>
            {googleCalendarIntegrated && (
                <div className="flex items-center p-1 bg-gray-100 rounded" title={allEventsSynced ? "Displayed events are synced" : "Not all displayed events are synced"}>
                    <span className="mr-1 text-sm">Events Synced:</span>
                    {allEventsSynced ? (
                        <span className="text-green-500 text-xl">✓</span>
                    ) : (
                        <span className="text-red-500 text-xl">✗</span>
                    )}
                    {!allEventsSynced && (
                        <button
                            onClick={handleSyncAllEvents}
                            disabled={syncingEvents || loading}
                            className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {syncingEvents ? "Syncing..." : "Sync All"}
                        </button>
                    )}
                </div>
            )}
             <button
                 onClick={() => {
                     setSelectedDateForModal(new Date());
                     setActiveModal('create');
                     setSelectedEvent(null);
                     setEditingEvent(null);
                 }}
                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
             >
                 Create Event
             </button>
         </div>
      </div>

      <div className="calendar-container fc-custom-style">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          dayMaxEvents={false}
          events={fullCalendarEvents}
          datesSet={handleDatesSet}
          selectable={true}
          select={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
        />

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10">
            <ClipLoader color="#4F46E5" />
          </div>
        )}
      </div>

       <div className="mt-4 p-3 bg-gray-50 rounded border text-sm">
         <p className="font-medium mb-1">Current View Info</p>
         {currentViewRange ? (
             <ul className="text-gray-600 list-disc pl-5 space-y-1">
               <li>Start: {currentViewRange.start.toDateString()}</li>
               <li>End: {currentViewRange.end.toDateString()}</li>
               <li>Events loaded: {events.length}</li>
             </ul>
         ) : (
            <p>Loading view...</p>
         )}
         {events.length === 0 && !loading && (
           <p className="mt-2 text-amber-600">No approved events found for this period. Click a date to create one.</p>
         )}
          {loading && <p className="mt-2 text-blue-600">Loading events...</p>}
       </div>

      <CreateEventModal
        isOpen={activeModal === 'create'}
        onClose={() => setActiveModal('none')}
        onSubmit={(eventData) => {
          handleCreateEvent(eventData);
          setActiveModal('none');
        }}
        initialDate={selectedDateForModal || undefined}
        employees={employees}
      />

       {selectedEvent && (
         <DayEventsModal
           events={[selectedEvent]}
           date={new Date(selectedEvent.start_time)}
           isOpen={activeModal === 'dayEvents'}
           onClose={() => {
             setActiveModal('none');
             setSelectedEvent(null);
           }}
           onEditEvent={() => {
             if (selectedEvent) {
               handleEdit(selectedEvent);
             }
           }}
           onDeleteEvent={(eventId) => {
             handleDeleteEvent(eventId);
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
          }}
          event={editingEvent}
          employees={employees}
        />
      )}
    </div>
  );
};

export default CalendarComponent;
