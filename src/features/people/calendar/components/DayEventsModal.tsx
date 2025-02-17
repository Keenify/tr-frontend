import React, { useEffect, useState } from 'react';
import { X, Edit2, Trash2 } from 'react-feather';
import { CalendarEvent } from '../types/calendar';
import { getUserData, UserData } from '../../../../services/useUser';
import { getEventTypeColor } from '../utils/eventUtils';

interface DayEventsModalProps {
  date: Date;
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Singapore' // Set to your timezone
  });
};

const DayEventsModal: React.FC<DayEventsModalProps> = ({
  date,
  events,
  isOpen,
  onClose,
  onEditEvent,
  onDeleteEvent,
}) => {
  const [eventCreators, setEventCreators] = useState<Record<string, UserData>>({});

  useEffect(() => {
    const fetchEventCreators = async () => {
      const creators: Record<string, UserData> = {};
      for (const event of events) {
        try {
          const userData = await getUserData(event.created_by);
          creators[event.created_by] = userData;
        } catch (error) {
          console.error(`Failed to fetch user data for ID ${event.created_by}:`, error);
        }
      }
      setEventCreators(creators);
    };

    if (isOpen && events.length > 0) {
      fetchEventCreators();
    }
  }, [isOpen, events]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Events for {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No events for this day</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg shadow-sm border ${getEventTypeColor(event.event_type)}`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-sm font-medium">{event.event_type}</p>
                    <p className="text-sm mt-1">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </p>
                    {event.location && (
                      <div className="text-sm mt-1">
                        <p>📍 {event.location.split(' - ')[0]}</p>
                        <a
                          href={event.location.split(' - ')[1]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm mt-2 whitespace-pre-wrap">{event.description}</p>
                    )}
                    <p className="text-sm mt-2 text-gray-600">
                      Created by: {eventCreators[event.created_by] 
                        ? `${eventCreators[event.created_by].first_name} ${eventCreators[event.created_by].last_name}`
                        : 'Loading...'}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(event);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event.id);
                      }}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DayEventsModal; 