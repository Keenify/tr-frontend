import { EventType } from '../types/calendar';

export const getEventTypeColor = (eventType: EventType): string => {
  switch (eventType) {
    case 'Employee Leave':
      return 'bg-orange-100 text-orange-700';
    case 'Booth':
      return 'bg-green-100 text-green-700';
    case 'Meeting':
      return 'bg-blue-100 text-blue-700';
    case 'Other':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}; 