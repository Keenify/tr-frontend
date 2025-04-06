import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useEmployeeResponses } from '../hooks/useEmployeeResponses';
import { fetchQuestions } from '../services/huddleService';
import { ClipLoader } from 'react-spinners';
import { Question, ResponseData } from '../types/huddle.types';
import { CUTOFF_HOUR } from '../constants';
import '../styles/DailyHuddle.css';
import { getCompanyCalendarEvents } from '../../people/calendar/services/useCalendar';
import { CalendarEvent } from '../../people/calendar/types/calendar';

interface DailyHuddleResponseProps {
  session: Session;
}

/**
 * Gets the effective date for submissions based on cutoff time
 * If current time is after cutoff, returns tomorrow's date
 * Otherwise returns today's date
 * 
 * @returns {string} Date string in YYYY-MM-DD format
 */
const getEffectiveDate = (): string => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // If it's after 6 PM, use tomorrow's date
  if (currentHour >= CUTOFF_HOUR) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Otherwise use today's date
  return now.toISOString().split('T')[0];
};

// Helper function to format a Date object to 'YYYY-MM-DD'
const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to format a date string or Date object to "Month YYYY"
const formatMonthYear = (dateString: string | Date): string => {
  const date = new Date(dateString);
  // Adjust for timezone offset when creating the date object
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); 
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

// Interface for employee response with rank
interface RankedEmployeeResponse {
  id: string;
  name: string;
  response: ResponseData | { questions: Array<{ question_id: string; answer_text?: string }> };
  submittedTime?: string;
  profile_pic_url?: string | null;
  rank?: number; // Rank based on submission time (1, 2, or 3 for top 3)
}

/**
 * DailyHuddleResponse Component
 * 
 * This component displays the responses submitted by employees for the daily huddle questions.
 * It fetches the questions and employee responses, and displays them in a tabular format.
 * 
 * @component
 * @param {DailyHuddleResponseProps} props - Component props
 * @param {Session} props.session - User session object containing authentication details
 * @returns {JSX.Element} Rendered Daily Huddle Response component
 */
const DailyHuddleResponse: React.FC<DailyHuddleResponseProps> = ({ session }) => {
  const [loading, setLoading] = React.useState(true);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(getEffectiveDate());
  const { companyInfo, error: dataError } = useUserAndCompanyData(session.user.id);
  const { employeeResponses, error, refreshEmployeeResponses } = useEmployeeResponses(companyInfo?.id, selectedDate);
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null); // Ref for hidden date input

  /**
   * Initializes the component by fetching questions and employee responses.
   */
  React.useEffect(() => {
    const initialize = async () => {
      try {
        const fetchedQuestions = await fetchQuestions();
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      } finally {
        // Ensure loading is only set to false after initial data fetch attempt
        // regardless of whether companyInfo or employeeResponses are immediately available
        setLoading(false);
      }
    };

    initialize();
    // We remove companyInfo and employeeResponses from deps as they cause re-renders
    // We only want to fetch questions once on mount.
  }, []);

  /**
   * Fetch calendar events when the selected date or companyInfo changes
   */
  React.useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (!companyInfo?.id) return;
      
      setLoading(true); // Show loading state while fetching
      
      try {
        const selectedDateObj = new Date(selectedDate);
        // Adjust for timezone offset to ensure correct date range
        selectedDateObj.setMinutes(selectedDateObj.getMinutes() + selectedDateObj.getTimezoneOffset());
        
        const startDate = new Date(selectedDateObj);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDateObj);
        endDate.setHours(23, 59, 59, 999);
        
        const events = await getCompanyCalendarEvents(
          companyInfo.id,
          startDate.toISOString(),
          endDate.toISOString()
        );
        
        setCalendarEvents(events as CalendarEvent[]);
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        setCalendarEvents([]); // Reset events on error
      } finally {
        setLoading(false); // Hide loading state after fetching
      }
    };
    
    fetchCalendarEvents();
  }, [companyInfo?.id, selectedDate]); // Re-run when company ID or selected date changes

  /**
   * Handle date change from the hidden date input
   * @param e - Change event from the date input
   */
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) { // Ensure the date is not empty
      setSelectedDate(newDate);
    }
  };

  /**
   * Sets the selected date to the previous day.
   */
  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate);
    // Directly manipulate the date part, avoiding potential timezone issues with Date constructor
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(formatDateToISO(currentDate));
  };

  /**
   * Sets the selected date to the next day.
   */
  const handleNextDay = () => {
    const currentDate = new Date(selectedDate);
    // Directly manipulate the date part
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(formatDateToISO(currentDate));
  };

  /**
   * Sets the selected date to today's effective date.
   */
  const handleToday = () => {
    setSelectedDate(getEffectiveDate());
  };

  /**
   * Triggers the hidden date input click event.
   */
  const handleCalendarIconClick = () => {
    // Trigger click on the hidden input element
    dateInputRef.current?.click(); 
  };

  /**
   * Checks if an employee is on leave for the selected date
   * @param employeeName - The name of the employee to check
   * @returns boolean indicating if the employee is on leave
   */
  const isEmployeeOnLeave = (employeeName: string): boolean => {
    if (!calendarEvents || !calendarEvents.length) return false;
    
    // Get the selected date in YYYY-MM-DD format for comparison
    const selectedDateStr = selectedDate;
    
    // Find leave events for this employee
    return calendarEvents.some(event => {
      // Check if it's a leave event
      const isLeaveEvent = ['sick_leave', 'timeoff', 'annual_leave'].includes(event.event_type.toLowerCase());
      
      if (!isLeaveEvent) return false;
      
      // Check if the event is for this employee (title format: "Leave Request - Employee Name")
      const eventEmployeeName = event.title.split(' - ')[1] || '';
      const matchesEmployee = eventEmployeeName.toLowerCase() === employeeName.toLowerCase();
      
      // Check if the event is approved (not pending or rejected)
      const description = event.description?.toLowerCase() || '';
      const isApproved = !description.includes('pending') && !description.includes('rejected');
      
      // Check if the event is for the selected date
      const eventStartDate = new Date(event.start_time);
      const eventEndDate = new Date(event.end_time);
      const selectedDateObj = new Date(selectedDateStr);
      
      // Adjust for timezone offset when comparing dates
      selectedDateObj.setMinutes(selectedDateObj.getMinutes() + selectedDateObj.getTimezoneOffset());
      eventStartDate.setMinutes(eventStartDate.getMinutes() + eventStartDate.getTimezoneOffset());
      eventEndDate.setMinutes(eventEndDate.getMinutes() + eventEndDate.getTimezoneOffset());

      // Set hours to avoid time-based comparison issues
      selectedDateObj.setHours(12, 0, 0, 0);
      eventStartDate.setHours(0, 0, 0, 0);
      // Set end date check to be inclusive of the end day
      eventEndDate.setHours(23, 59, 59, 999); 
      
      // Check if the selected date falls within the event date range (inclusive)
      const isWithinDateRange = 
        selectedDateObj >= eventStartDate && 
        selectedDateObj <= eventEndDate;
      
      return matchesEmployee && isApproved && isWithinDateRange;
    });
  };

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  /**
   * Formats a date string into a readable date and time format
   * @param dateString - ISO date string
   * @param employeeName - The name of the employee
   * @param rank - The rank of the employee (1, 2, or 3 for top 3)
   * @returns Formatted date and time string or "Team member is on leave" if applicable
   */
  const formatSubmissionTime = (dateString: string | undefined, employeeName: string, rank?: number) => {
    // Check if employee is on leave for the selected date
    const onLeave = isEmployeeOnLeave(employeeName);
    
    if (!dateString) return onLeave ? 
      <div className="employee-on-leave">Team member is on leave</div> : 
      'Not submitted';
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format the date without year
      const formattedDate = date.toLocaleDateString([], { 
        day: 'numeric',
        month: 'short'
      });
      
      // Format the time
      const formattedTime = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }).toLowerCase(); // Convert to lowercase for "pm" instead of "PM"
      
      // Add visual indicator for top 3 earliest submissions
      const timeClass = rank && rank <= 3 ? `submission-time-rank-${rank}` : '';
      
      // If employee is on leave but has submitted, show both statuses
      if (onLeave) {
        return (
          <div className="submission-info">
            <div className="employee-on-leave">Team member is on leave</div>
            <div className={`submission-time ${timeClass}`}>
              {formattedDate}<br />
              {formattedTime}
            </div>
          </div>
        );
      }
      
      // Return date and time on separate lines with appropriate styling
      return (
        <div className={`submission-time ${timeClass}`}>
          {formattedDate}<br />
          {formattedTime}
        </div>
      );
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  /**
   * Renders a badge for top submitters
   * @param rank - The rank of the employee (1, 2, or 3)
   * @returns JSX element with the appropriate badge
   */
  const renderTopSubmitterBadge = (rank: number) => {
    if (!rank || rank > 3) return null;
    
    const badgeClasses = {
      1: 'top-submitter-badge top-submitter-first',
      2: 'top-submitter-badge top-submitter-second',
      3: 'top-submitter-badge top-submitter-third'
    };
    
    // Simplified badge labels
    const badgeLabels = {
      1: '1st',
      2: '2nd',
      3: '3rd'
    };
    
    return (
      <span className={badgeClasses[rank as keyof typeof badgeClasses]}>
        {badgeLabels[rank as keyof typeof badgeLabels]}
      </span>
    );
  };

  /**
   * Refreshes all data including questions, employee responses, and calendar events
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    
    try {
      // Refresh questions (only if needed, usually fetched once)
      // const fetchedQuestions = await fetchQuestions();
      // setQuestions(fetchedQuestions);
      
      // Refresh employee responses
      if (refreshEmployeeResponses) {
        await refreshEmployeeResponses(); // This uses the current selectedDate
      } else {
         // If hook isn't ready, force a state update to trigger useEffect for responses
         setSelectedDate(current => current); 
      }
      
      // Re-fetch calendar events for the selected date
      if (companyInfo?.id) {
        const selectedDateObj = new Date(selectedDate);
        // Adjust for timezone offset
        selectedDateObj.setMinutes(selectedDateObj.getMinutes() + selectedDateObj.getTimezoneOffset());

        const startDate = new Date(selectedDateObj);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDateObj);
        endDate.setHours(23, 59, 59, 999);
        
        const events = await getCompanyCalendarEvents(
          companyInfo.id,
          startDate.toISOString(),
          endDate.toISOString()
        );
        
        setCalendarEvents(events as CalendarEvent[]);
      } else {
        setCalendarEvents([]); // Clear events if no company info
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
       // Optionally show an error message to the user
    } finally {
      setRefreshing(false);
      setLoading(false); // Ensure loading is always turned off
    }
  };

  // Initial loading state check
  // Show loader only if loading is true and either questions or employeeResponses haven't been fetched yet.
  const showInitialLoader = loading && (!questions.length || !employeeResponses);

  if (showInitialLoader) {
      return (
        <div className="response-container">
           {/* Keep date picker visible during initial load */}
           <div className="date-picker-container">
             <button onClick={handleToday} className="today-button">Today</button>
             <button onClick={handlePreviousDay} className="date-nav-button">&lt;</button>
             <button onClick={handleNextDay} className="date-nav-button">&gt;</button>
             <span className="selected-month-year">{formatMonthYear(selectedDate)}</span>
             {/* Standalone Icon Button */}
             <button onClick={handleCalendarIconClick} className="calendar-icon-button" aria-label="Select date">
               <svg className="calendar-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                </svg>
             </button>
             {/* Hidden Date Input */}
             <input
               ref={dateInputRef}
               type="date"
               value={selectedDate}
               onChange={handleDateChange}
               className="hidden-date-input"
               aria-hidden="true"
             />
             {/* Refresh button remains but might be disabled */}
             <button 
               onClick={handleRefresh} 
               className="refresh-button"
               disabled={true} // Disabled during initial load
               title="Refresh data"
             >
               {/* Loading icon */}
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="refresh-icon refreshing" viewBox="0 0 16 16">
                 <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                 <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
               </svg>
               Loading...
             </button>
           </div>
           <div className="loading-center">
             <ClipLoader size={50} color={"#007BFF"} loading={true} />
             <p className="loading-text">Loading initial data...</p>
           </div>
        </div>
      );
  }

  // Error state check
  if (error || dataError) {
    return (
      <div className="response-container">
        <div className="date-picker-container">
           <button onClick={handleToday} className="today-button">Today</button>
           <button onClick={handlePreviousDay} className="date-nav-button">&lt;</button>
           <button onClick={handleNextDay} className="date-nav-button">&gt;</button>
           <span className="selected-month-year">{formatMonthYear(selectedDate)}</span>
           {/* Standalone Icon Button */}
           <button onClick={handleCalendarIconClick} className="calendar-icon-button" aria-label="Select date">
              <svg className="calendar-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
              </svg>
           </button>
           {/* Hidden Date Input */}
           <input
             ref={dateInputRef}
             type="date"
             value={selectedDate}
             onChange={handleDateChange}
             className="hidden-date-input"
             aria-hidden="true"
           />
           <button 
             onClick={handleRefresh} 
             className="refresh-button"
             disabled={refreshing}
             title="Refresh data"
           >
             <svg 
               xmlns="http://www.w3.org/2000/svg" 
               width="16" 
               height="16" 
               fill="currentColor" 
               className={`refresh-icon ${refreshing ? 'refreshing' : ''}`} 
               viewBox="0 0 16 16"
             >
               <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
               <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
             </svg>
             {refreshing ? 'Refreshing...' : 'Refresh'}
           </button>
        </div>
        {/* Display specific error */}
        <div className="error-message">
          Error: {error?.message || dataError?.message || "Failed to load data."}
        </div>
      </div>
    );
  }

  // Filter out backup employees and add empty response object if needed
  const filteredResponses = (employeeResponses || []) // Handle potentially undefined responses
    .filter(emp => emp && emp.name && !emp.name.toLowerCase().includes('backup'))
    .map(emp => ({
      ...emp,
      response: emp.response || { questions: [] } // Ensure response object exists
    }));

  // Sort employees by submission time and assign ranks to top 3
  const rankedResponses: RankedEmployeeResponse[] = [...filteredResponses]
    .filter(emp => emp.submittedTime && !isEmployeeOnLeave(emp.name)) // Only consider employees who submitted and are not on leave
    .sort((a, b) => {
      // Sort by submission time (earliest first)
      if (!a.submittedTime) return 1; // Should not happen due to filter, but safe guard
      if (!b.submittedTime) return -1; // Should not happen due to filter, but safe guard
      return new Date(a.submittedTime).getTime() - new Date(b.submittedTime).getTime();
    })
    .map((emp, index) => {
      // Assign rank to top 3
      return {
        ...emp,
        rank: index < 3 ? index + 1 : undefined
      };
    });

  // Create a map of employee IDs to their ranks for easy lookup
  const rankMap = new Map<string, number>();
  rankedResponses.forEach(emp => {
    if (emp.rank) {
      rankMap.set(emp.id, emp.rank);
    }
  });

  // Final list of all responses with rank information
  // Sort all responses: submitted first (by time), then non-submitted
  const allResponses = filteredResponses
    .map(emp => ({
      ...emp,
      rank: rankMap.get(emp.id)
    }))
    .sort((a, b) => {
      const aOnLeave = isEmployeeOnLeave(a.name);
      const bOnLeave = isEmployeeOnLeave(b.name);
      const aSubmitted = !!a.submittedTime;
      const bSubmitted = !!b.submittedTime;

      // Prioritize submitted responses over non-submitted
      if (aSubmitted && !bSubmitted) return -1;
      if (!aSubmitted && bSubmitted) return 1;

      // If both submitted, sort by submission time
      if (aSubmitted && bSubmitted && a.submittedTime && b.submittedTime) {
        return new Date(a.submittedTime).getTime() - new Date(b.submittedTime).getTime();
      }
      
      // If both not submitted, prioritize those NOT on leave
      if (!aSubmitted && !bSubmitted) {
         if (!aOnLeave && bOnLeave) return -1;
         if (aOnLeave && !bOnLeave) return 1;
      }

      // Otherwise maintain original order or sort alphabetically by name as fallback
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="response-container">
      <div className="date-picker-container">
         {/* Today, Previous, Next Buttons */}
         <button onClick={handleToday} className="today-button">Today</button>
         <button onClick={handlePreviousDay} className="date-nav-button">&lt;</button>
         <button onClick={handleNextDay} className="date-nav-button">&gt;</button>
         
         <span className="selected-month-year">{formatMonthYear(selectedDate)}</span>
         {/* Standalone Icon Button */}
         <button onClick={handleCalendarIconClick} className="calendar-icon-button" aria-label="Select date">
            <svg className="calendar-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
               <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
            </svg>
         </button>
         {/* Hidden Date Input - controlled by the button */}
         <input
           ref={dateInputRef}
           type="date"
           value={selectedDate}
           onChange={handleDateChange}
           className="hidden-date-input" 
           aria-hidden="true"
         />
         
         {/* Refresh Button */}
         <button 
           onClick={handleRefresh} 
           className="refresh-button"
           disabled={loading || refreshing} // Disable while loading/refreshing
           title="Refresh data"
         >
           <svg 
             xmlns="http://www.w3.org/2000/svg" 
             width="16" 
             height="16" 
             fill="currentColor" 
             className={`refresh-icon ${refreshing ? 'refreshing' : ''}`}
             viewBox="0 0 16 16"
           >
             <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
             <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
           </svg>
           {refreshing ? 'Refreshing...' : (loading ? 'Loading...' : 'Refresh')}
         </button>
      </div>
      
      {/* Loading indicator below date picker if loading data for a new date */}
       {loading && !showInitialLoader && (
         <div className="loading-inline">
           <ClipLoader size={20} color={"#007BFF"} loading={true} />
           <span className="loading-text-inline">Loading data for {selectedDate}...</span>
         </div>
       )}
      
      <h3 className="response-title">Submitted Responses for {selectedDate}</h3>
      <table className="response-table">
        <thead>
          <tr>
            <th className="col-number">No.</th>
            <th className="col-member">Team Member</th>
            {questions.map((q, index) => {
              const replacements: { [key: string]: string } = {
                "One-word opener": "One-Word Opener",
                "Wins(1 work + 1 personal)": "Wins (1 Work + 1 Personal)",
                "I need critical help on": "I Need Critical Help On",
                "Main Priority": "OKR",
                "Today Goals and Targeted Results": "Top 3 Important Task Today"
              };
              
              const displayText = replacements[q.question_text] || q.question_text;
              
              // Determine column class based on question type
              let columnClass = 'col-wins'; // Default
               if (q.question_text.includes('need critical help')) {
                 columnClass = 'col-help';
               } else if (q.question_text.includes('One-word opener')) {
                 columnClass = 'col-one-word';
               } else if (q.question_text.includes('Today Goals and Targeted Results')) {
                 columnClass = 'col-goals';
               } else if (q.question_text.includes('Main Priority')) { // OKR
                 columnClass = 'col-priority';
               }
              
              return (
                <th key={q.id || index} className={columnClass}>{displayText}</th> // Use question ID as key if available
              );
            })}
            <th className="col-submitted">Submitted At</th>
          </tr>
        </thead>
        <tbody>
           {allResponses.length === 0 && !loading && (
             <tr>
               <td colSpan={questions.length + 3} className="no-responses-cell">
                 No responses submitted for {selectedDate}.
               </td>
             </tr>
           )}
          {allResponses.map(({ id, name, response, submittedTime, profile_pic_url, rank }, index) => {
            // Check if employee is on leave
            const onLeave = isEmployeeOnLeave(name);
            const hasSubmitted = !!submittedTime;
            
            // Determine row class based on rank
            const rowClass = rank && rank <= 3 ? `top-performer-${rank}` : '';
            
            return (
              <tr key={id} className={rowClass}>
                <td className={rank && rank <= 3 ? `number-rank-${rank}` : ''}>
                  {index + 1}
                </td>
                <td className="team-member-column">
                  <div className="team-member-cell">
                    {/* First row: Profile picture and name */}
                    <div className="profile-name-row">
                      {/* Profile Picture */}
                      <div className="profile-pic">
                        {profile_pic_url ? (
                          <img
                            src={profile_pic_url}
                            alt={name}
                          />
                        ) : (
                          <div className="profile-pic-placeholder">
                             {/* Display initials */}
                             {name?.split(' ').map(n => n[0]).join('') || '?'}
                          </div>
                        )}
                      </div>
                      {/* Name */}
                      <span className="member-name">{name}</span>
                    </div>
                    
                    {/* Second row: Badge */}
                    <div className="badge-row">
                      {renderTopSubmitterBadge(rank as number)}
                    </div>
                  </div>
                </td>
                
                {/* Logic for displaying leave status or answers */}
                 {onLeave && !hasSubmitted ? (
                   // If employee is on leave and has not submitted, show leave status across all answer cells
                   <td colSpan={questions.length} className="employee-on-leave-cell-span">
                     <div className="employee-on-leave">Team member is on leave</div>
                   </td>
                 ) : (
                   // If employee submitted or is not on leave, show answers
                   <>
                     {questions.map((q, qIndex) => {
                       // Determine column class
                       let columnClass = 'col-wins'; // Default
                       if (q.question_text.includes('need critical help')) {
                         columnClass = 'col-help';
                       } else if (q.question_text.includes('One-word opener')) {
                         columnClass = 'col-one-word';
                       } else if (q.question_text.includes('Today Goals and Targeted Results')) {
                         columnClass = 'col-goals';
                       } else if (q.question_text.includes('Main Priority')) { // OKR
                         columnClass = 'col-priority';
                       }
                       
                       // Add "on-leave-cell" class if the employee is on leave but submitted
                       if (onLeave && hasSubmitted) {
                         columnClass = `${columnClass} on-leave-cell`;
                       }
                       
                       const answer = response?.questions?.find((rq) => rq.question_id === q.id)?.answer_text || '';

                       return (
                         <td key={`${id}-${q.id || qIndex}`} className={columnClass}>
                           {answer.split('\\n').map((line, i) => {
                             const isGoalOrResult = q.question_text.includes('Today Goals') || q.question_text.includes('Targeted Results');
                             const isOneWord = q.question_text.includes('One-word opener');
                             
                             // Capitalize the first letter, trim whitespace
                             const capitalizedLine = capitalizeFirstLetter(line.trim());
                             
                             if (!capitalizedLine) return null; // Don't render empty lines

                             // For one-word opener, ensure single line display
                             if (isOneWord) {
                               // Wrap in span to potentially apply specific styles later
                               return <span key={i} className="one-word-text">{capitalizedLine}</span>;
                             }
                             
                             return (
                               <React.Fragment key={i}>
                                 {isGoalOrResult ? `• ${capitalizedLine}` : capitalizedLine}
                                 {i < answer.split('\\n').length - 1 && <br />} {/* Add <br> only if not the last line */}
                               </React.Fragment>
                             );
                           })}
                         </td>
                       );
                     })}
                   </>
                 )}

                 {/* Submitted At column */}
                 <td className={`submitted-time col-submitted ${onLeave && hasSubmitted ? 'on-leave-cell' : ''}`}>
                   {formatSubmissionTime(submittedTime, name, rank as number)}
                 </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DailyHuddleResponse;
