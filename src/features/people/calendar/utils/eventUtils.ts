import { EVENT_COLORS, EventColorType } from '../constants/eventColors';

export const getEventTypeColor = (eventType: string): string => {
  const type = eventType.toLowerCase().replace(' ', '_') as EventColorType;
  return EVENT_COLORS[type] || EVENT_COLORS.other;
}; 