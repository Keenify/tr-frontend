import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { ClipLoader } from 'react-spinners';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { X } from 'react-feather';

interface CalendarProps {
  session?: Session;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    date?: string;
  };
  end: {
    dateTime: string;
    date?: string;
  };
}

interface EventDetailsModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose }) => {
  if (!isOpen) return null;

  const startDate = new Date(event.start.dateTime || event.start.date || '');
  const endDate = new Date(event.end.dateTime || event.end.date || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Event Details</h2>
          <button
            title="Close"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Title</h3>
            <p>{event.summary}</p>
          </div>

          {event.description && (
            <div>
              <h3 className="font-medium text-gray-700">Description</h3>
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.location && (
            <div>
              <h3 className="font-medium text-gray-700">Location</h3>
              <p>{event.location}</p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-700">Time</h3>
            <p>
              Start: {startDate.toLocaleString()}<br />
              End: {endDate.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarComponent: React.FC<CalendarProps> = ({ session }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const calendarId = encodeURIComponent('c_83e1dcebb689ae76181f75058469325cb1391f663f4103d3214e2b7ebf4067cc@group.calendar.google.com');
  const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;

  console.log("Session", session);

  const fetchEvents = useCallback(async (date: Date) => {
    try {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const baseUrl = 'https://www.googleapis.com/calendar/v3/calendars';
      const params = new URLSearchParams({
        key: apiKey,
        timeMin: firstDay.toISOString(),
        timeMax: lastDay.toISOString(),
        orderBy: 'startTime',
        singleEvents: 'true'
      });

      const url = `${baseUrl}/${calendarId}/events?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch calendar events: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      setEvents(data.items || []);
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiKey, calendarId]);

  useEffect(() => {
    fetchEvents(new Date());
  }, [fetchEvents]);

  const getTileContent = ({ date }: { date: Date }) => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date || '');
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });

    return dayEvents.length > 0 ? (
      <div className="mt-1">
        {dayEvents.map(event => (
          <div
            key={event.id}
            className="text-xs p-1 bg-indigo-100 text-indigo-700 rounded truncate mb-1 cursor-pointer hover:bg-indigo-200"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEvent(event);
            }}
          >
            {event.summary}
          </div>
        ))}
      </div>
    ) : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader color="#4F46E5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      <div className="calendar-container">
        <Calendar
          onChange={() => {}}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              fetchEvents(activeStartDate);
            }
          }}
          tileContent={getTileContent}
          className="rounded-lg border shadow"
        />
      </div>

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      <style>
        {`
          .calendar-container .react-calendar {
            width: 100%;
            background: white;
            padding: 1rem;
          }

          .calendar-container .react-calendar__tile {
            height: 100px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            padding: 0.5rem;
          }

          .calendar-container .react-calendar__tile--now {
            background: #EEF2FF;
          }
        `}
      </style>
    </div>
  );
};

export default CalendarComponent;
