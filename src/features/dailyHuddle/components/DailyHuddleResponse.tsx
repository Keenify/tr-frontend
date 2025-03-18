import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useEmployeeResponses } from '../hooks/useEmployeeResponses';
import { fetchQuestions } from '../services/huddleService';
import { ClipLoader } from 'react-spinners';
import { Question } from '../types/huddle.types';
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

// Interface for employee response with rank
interface RankedEmployeeResponse {
  id: string;
  name: string;
  response: any;
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
  const { employeeResponses, error } = useEmployeeResponses(companyInfo?.id, selectedDate);
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>([]);

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
        if (companyInfo && employeeResponses) {
          setLoading(false);
        }
      }
    };

    initialize();
  }, [companyInfo, employeeResponses]);

  /**
   * Fetch calendar events when the selected date changes
   */
  React.useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (!companyInfo?.id) return;
      
      // Set loading to true when date changes to show loading state
      setLoading(true);
      
      try {
        // Create date range for the selected date (full day)
        const selectedDateObj = new Date(selectedDate);
        const startDate = new Date(selectedDateObj);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDateObj);
        endDate.setHours(23, 59, 59, 999);
        
        const events = await getCompanyCalendarEvents(
          companyInfo.id,
          startDate.toISOString(),
          endDate.toISOString()
        );
        
        // Clear previous events and set new ones
        setCalendarEvents(events as CalendarEvent[]);
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);
      } finally {
        // Set loading to false after fetching calendar events
        if (companyInfo && employeeResponses) {
          setLoading(false);
        }
      }
    };
    
    fetchCalendarEvents();
  }, [companyInfo?.id, selectedDate]);

  /**
   * Reset component state when date changes
   */
  React.useEffect(() => {
    // Reset state when date changes
    setLoading(true);
    
    // Reset calendar events
    setCalendarEvents([]);
    
    // The employeeResponses will be automatically refreshed by the useEmployeeResponses hook
    // since it depends on the selectedDate
  }, [selectedDate]);

  /**
   * Handle date change in the date picker
   * @param e - Change event from the date input
   */
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
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
      
      // Set hours to noon to avoid timezone issues
      selectedDateObj.setHours(12, 0, 0, 0);
      
      // Check if the selected date falls within the event date range
      const isWithinDateRange = 
        selectedDateObj >= new Date(eventStartDate.setHours(0, 0, 0, 0)) && 
        selectedDateObj <= new Date(eventEndDate.setHours(23, 59, 59, 999));
      
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
    if (isEmployeeOnLeave(employeeName)) {
      return <span className="employee-on-leave">Team member is on leave</span>;
    }
    
    if (!dateString) return 'Not submitted';
    
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
   * Renders a motivational message for top performers
   * @param rank - The rank of the employee (1, 2, or 3)
   * @returns JSX element with a motivational message
   */
  const renderMotivationalMessage = (rank: number) => {
    if (!rank || rank > 3) return null;
    
    const messages = {
      1: "Incredible! You're leading the team with your promptness! 🌟",
      2: "Amazing work! You're setting a great example for the team! ✨",
      3: "Excellent! Your commitment to timely updates is noticed! 👏"
    };
    
    return (
      <div className={`motivational-message rank-${rank}`}>
        {messages[rank as keyof typeof messages]}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="response-container">
        <div className="date-picker-container">
          <label htmlFor="datePicker" className="date-picker-label">Select Date: </label>
          <input
            type="date"
            id="datePicker"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-picker"
          />
        </div>
        <div className="loading-center">
          <ClipLoader size={50} color={"#007BFF"} loading={loading} />
          <p className="loading-text">Loading data for {selectedDate}...</p>
        </div>
      </div>
    );
  }

  if (error || dataError) {
    return (
      <div className="response-container">
        <div className="date-picker-container">
          <label htmlFor="datePicker" className="date-picker-label">Select Date: </label>
          <input
            type="date"
            id="datePicker"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-picker"
          />
        </div>
        <div className="error-message">Error loading employee responses: {error?.message || dataError?.message}</div>
      </div>
    );
  }

  // Filter out backup employees and add empty response object if needed
  const filteredResponses = employeeResponses
    .filter(emp => !emp.name.toLowerCase().includes('backup'))
    .map(emp => ({
      ...emp,
      response: emp.response || { questions: [] }
    }));

  // Sort employees by submission time and assign ranks to top 3
  const rankedResponses: RankedEmployeeResponse[] = [...filteredResponses]
    .filter(emp => emp.submittedTime && !isEmployeeOnLeave(emp.name)) // Only consider employees who submitted and are not on leave
    .sort((a, b) => {
      // Sort by submission time (earliest first)
      if (!a.submittedTime) return 1;
      if (!b.submittedTime) return -1;
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
  // Sort all responses by submission time (earliest first), then put non-submitted at the end
  const allResponses = filteredResponses
    .map(emp => ({
      ...emp,
      rank: rankMap.get(emp.id)
    }))
    .sort((a, b) => {
      // If both have submitted, sort by submission time
      if (a.submittedTime && b.submittedTime) {
        return new Date(a.submittedTime).getTime() - new Date(b.submittedTime).getTime();
      }
      
      // If only one has submitted, put the one who submitted first
      if (a.submittedTime && !b.submittedTime) return -1;
      if (!a.submittedTime && b.submittedTime) return 1;
      
      // If neither has submitted, maintain original order
      return 0;
    });

  return (
    <div className="response-container">
      <div className="date-picker-container">
        <label htmlFor="datePicker" className="date-picker-label">Select Date: </label>
        <input
          type="date"
          id="datePicker"
          value={selectedDate}
          onChange={handleDateChange}
          className="date-picker"
        />
      </div>
      
      <h3 className="response-title">Submitted Responses</h3>
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
              let columnClass = 'col-wins';
              if (q.question_text.includes('need critical help')) {
                columnClass = 'col-help';
              } else if (q.question_text.includes('One-word opener')) {
                columnClass = 'col-one-word';
              } else if (q.question_text.includes('Today Goals and Targeted Results')) {
                columnClass = 'col-goals';
              } else if (q.question_text.includes('Main Priority')) {
                columnClass = 'col-priority';
              }
              
              return (
                <th key={index} className={columnClass}>{displayText}</th>
              );
            })}
            <th className="col-submitted">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {allResponses.map(({ id, name, response, submittedTime, profile_pic_url, rank }, index) => {
            // Check if employee is on leave
            const onLeave = isEmployeeOnLeave(name);
            
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
                            {name.charAt(0)}
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
                
                {onLeave ? (
                  // If employee is on leave, merge all remaining cells
                  <td colSpan={questions.length + 1} className="employee-on-leave-cell">
                    <span className="employee-on-leave">Team member is on leave</span>
                  </td>
                ) : (
                  // If not on leave, render normal cells
                  <>
                    {questions.map((q, qIndex) => {
                      // Determine column class based on question type
                      let columnClass = '';
                      if (q.question_text.includes('need critical help')) {
                        columnClass = 'col-help';
                      } else if (q.question_text.includes('One-word opener')) {
                        columnClass = 'col-one-word';
                      } else if (q.question_text.includes('Today Goals and Targeted Results')) {
                        columnClass = 'col-goals';
                      } else if (q.question_text.includes('Main Priority')) {
                        columnClass = 'col-priority';
                      } else {
                        columnClass = 'col-wins';
                      }
                      
                      return (
                        <td key={qIndex} className={columnClass}>
                          {response.questions.find((rq) => rq.question_id === q.id)?.answer_text?.split('\n').map((line, i) => {
                            const isGoalOrResult = q.question_text.includes('Today Goals') || q.question_text.includes('Targeted Results');
                            const isOneWord = q.question_text.includes('One-word opener');
                            
                            // Capitalize the first letter of each line
                            const capitalizedLine = capitalizeFirstLetter(line);
                            
                            // For one-word opener, don't add line breaks and ensure full display
                            if (isOneWord) {
                              return <span className="one-word-text">{capitalizedLine}</span>;
                            }
                            
                            return (
                              <React.Fragment key={i}>
                                {isGoalOrResult ? `• ${capitalizedLine}` : capitalizedLine}
                                <br />
                              </React.Fragment>
                            );
                          }) || ''}
                        </td>
                      );
                    })}
                    <td className="submitted-time col-submitted">
                      {formatSubmissionTime(submittedTime, name, rank as number)}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DailyHuddleResponse;
