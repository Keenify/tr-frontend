export const EVENT_COLORS = {
  timeoff: 'bg-yellow-100 border-yellow-200 text-yellow-800',
  booth: 'bg-blue-100 border-blue-200 text-blue-800',
  sick_leave: 'bg-red-100 border-red-200 text-red-800',
  annual_leave: 'bg-yellow-100 border-yellow-200 text-yellow-800',
  meeting: 'bg-green-100 border-green-200 text-green-800',
  leave_request: 'bg-yellow-100 border-yellow-200 text-yellow-800',
  other: 'bg-gray-100 border-gray-200 text-gray-800'
} as const;

export type EventColorType = keyof typeof EVENT_COLORS; 