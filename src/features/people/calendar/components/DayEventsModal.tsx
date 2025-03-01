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

type EventType = 'annual_leave' | 'sick_leave' | 'timeoff';

const eventTypeMapping: Record<EventType, string> = {
  'annual_leave': 'Annual Leave',
  'sick_leave': 'Sick Leave',
  'timeoff': 'Time Off'
};

const formatEventType = (eventType: string): string => {
  const normalizedType = eventType.toLowerCase();
  return eventTypeMapping[normalizedType as EventType] || eventType;
};

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

// Helper function to get background color based on event type
const getEventBackgroundColor = (eventType: string): string => {
  const type = eventType.toLowerCase();
  switch (type) {
    case 'meeting':
      return 'bg-blue-50';
    case 'booth':
      return 'bg-purple-50';
    case 'annual_leave':
    case 'sick_leave':
    case 'timeoff':
      return 'bg-amber-50';
    default:
      return 'bg-gray-50';
  }
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

  const isLeaveEvent = (eventType: string) => {
    return ['timeoff', 'sick_leave', 'annual_leave'].includes(eventType.toLowerCase());
  };

  const formatDescription = (description: string) => {
    // Split the description into lines
    const lines = description.split('\n');
    // Filter out the line that contains "Type: "
    return lines.filter(line => !line.toLowerCase().startsWith('type:')).join('\n');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-gray-300 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No events scheduled for this day</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`rounded-lg overflow-hidden shadow-sm border-l-4 ${getEventTypeColor(event.event_type)} ${getEventBackgroundColor(event.event_type)} hover:shadow-md transition-shadow`}
              >
                {/* Event Header */}
                <div className="px-5 py-4 bg-white bg-opacity-60 flex justify-between items-start border-b border-gray-100">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{event.title}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                        {formatEventType(event.event_type)}
                      </span>
                      <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                    </div>
                  </div>
                  
                  {!isLeaveEvent(event.event_type) && (
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent({
                            ...event,
                            location: event.location || ''
                          });
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEvent(event.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Event Details */}
                <div className="px-5 py-4 space-y-3">
                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start">
                      <div className="text-gray-400 mt-0.5 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{event.location.split(' - ')[0]}</p>
                        <a
                          href={event.location.split(' - ')[1]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Description */}
                  {event.description && (
                    <div className="flex items-start">
                      <div className="text-gray-400 mt-0.5 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {formatDescription(event.description)}
                      </p>
                    </div>
                  )}
                  
                  {/* Participants */}
                  {event.participants && event.participants.length > 0 && (
                    <div className="flex items-start">
                      <div className="text-gray-400 mt-0.5 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1.5">Participants</p>
                        <div className="flex flex-wrap gap-1.5">
                          {event.participants.map(participant => (
                            <span 
                              key={participant.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
                            >
                              {participant.profile_pic_url ? (
                                <img 
                                  src={participant.profile_pic_url} 
                                  alt={`${participant.first_name} ${participant.last_name}`}
                                  className="w-4 h-4 rounded-full mr-1 object-cover"
                                />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center mr-1 text-[10px] font-bold">
                                  {participant.first_name[0]}
                                </span>
                              )}
                              {participant.first_name} {participant.last_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Created by */}
                  <div className="flex items-center mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Created by: {eventCreators[event.created_by] 
                        ? `${eventCreators[event.created_by].first_name} ${eventCreators[event.created_by].last_name}`
                        : 'Loading...'}
                    </p>
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