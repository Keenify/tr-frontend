export const EVENT_COLORS = {
  timeoff: 'bg-yellow-500 border-yellow-600 text-white',
  booth: 'bg-blue-500 border-blue-600 text-white',
  sick_leave: 'bg-red-500 border-red-600 text-white',
  annual_leave: 'bg-yellow-500 border-yellow-600 text-white',
  meeting: 'bg-green-500 border-green-600 text-white',
  leave_request: 'bg-yellow-500 border-yellow-600 text-white',
  other: 'bg-gray-500 border-gray-600 text-white'
} as const;

export type EventColorType = keyof typeof EVENT_COLORS; 