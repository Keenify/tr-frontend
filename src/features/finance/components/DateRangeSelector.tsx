import React, { useCallback } from 'react';
import { format } from 'date-fns';

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onSubmit: () => void;
  minDate?: string;
  maxDate?: string;
  isRefreshing?: boolean;
  extraButton?: React.ReactNode;
}

/**
 * Component for selecting a date range with start and end dates
 */
const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  minDate = "2020-01-01",
  maxDate = "2025-12-31",
  isRefreshing = false,
  extraButton
}) => {
  // Format date for input value
  const formatDateValue = useCallback((date: Date): string => {
    try {
      return format(date, "yyyy-MM-dd");
    } catch (err) {
      console.error("Error formatting date:", date, err);
      return new Date().toISOString().split('T')[0]; // Fallback
    }
  }, []);

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      try {
        const [year, month, day] = e.target.value.split('-').map(Number);
        // Month is 0-indexed in JavaScript Date
        const newDate = new Date(year, month - 1, day);
        
        if (!isNaN(newDate.getTime())) {
          onStartDateChange(newDate);
        } else {
          console.error("Invalid date format from input:", e.target.value);
        }
      } catch (err) {
        console.error("Error parsing date:", err);
      }
    }
  };

  // Handle end date change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      try {
        const [year, month, day] = e.target.value.split('-').map(Number);
        // Month is 0-indexed in JavaScript Date
        const newDate = new Date(year, month - 1, day);
        
        if (!isNaN(newDate.getTime())) {
          onEndDateChange(newDate);
        } else {
          console.error("Invalid date format from input:", e.target.value);
        }
      } catch (err) {
        console.error("Error parsing date:", err);
      }
    }
  };

  return (
    <div className="flex flex-col flex-grow">
      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
        <div className="w-full md:w-auto">
          <label htmlFor="start-date" className="sr-only">Start Date</label>
          <input
            type="date"
            id="start-date"
            value={formatDateValue(startDate)}
            onChange={handleStartDateChange}
            min={minDate}
            max={maxDate}
            className="p-2 border border-gray-300 rounded-md w-full"
            data-testid="start-date-picker"
            aria-label="Start Date"
          />
        </div>
        <span className="text-gray-500">to</span>
        <div className="w-full md:w-auto">
          <label htmlFor="end-date" className="sr-only">End Date</label>
          <input
            type="date"
            id="end-date"
            value={formatDateValue(endDate)}
            onChange={handleEndDateChange}
            min={minDate}
            max={maxDate}
            className="p-2 border border-gray-300 rounded-md w-full"
            data-testid="end-date-picker"
            aria-label="End Date"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSubmit}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
            disabled={isRefreshing}
            title="Apply date range"
          >
            {isRefreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
          {extraButton}
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector; 