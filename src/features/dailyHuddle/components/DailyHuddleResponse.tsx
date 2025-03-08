import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useEmployeeResponses } from '../hooks/useEmployeeResponses';
import { fetchQuestions } from '../services/huddleService';
import { ClipLoader } from 'react-spinners';
import { Question } from '../types/huddle.types';
import { CUTOFF_HOUR } from '../constants';
import '../styles/DailyHuddle.css';

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

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  /**
   * Formats a date string into a readable date and time format
   * @param dateString - ISO date string
   * @returns Formatted date and time string (e.g., "7 Mar 10:30 PM")
   */
  const formatSubmissionTime = (dateString: string | undefined) => {
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
      });
      
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <ClipLoader size={50} color={"#007BFF"} loading={loading} />
      </div>
    );
  }

  if (error || dataError) {
    return <div className="error-message">Error loading employee responses: {error?.message || dataError?.message}</div>;
  }

  const allResponses = employeeResponses.map(emp => ({
    ...emp,
    response: emp.response || { questions: [] }
  }));

  return (
    <div className="response-container">
      <div className="date-picker-container">
        <label htmlFor="datePicker" className="date-picker-label">Select Date: </label>
        <input
          type="date"
          id="datePicker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker"
        />
      </div>
      <h3 className="response-title">Submitted Responses</h3>
      <table className="response-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>No.</th>
            <th style={{ width: '10%' }}>Team Member</th>
            {questions.map((q, index) => {
              const replacements: { [key: string]: string } = {
                "One-word opener": "One-Word",
                "Wins(1 work + 1 personal)": "Wins (1 Work + 1 Personal)",
                "I need critical help on": "I Need Critical Help On",
                "Main Priority": "Main Priority for Today"
              };
              
              const displayText = replacements[q.question_text] || q.question_text;
              
              // Determine column width based on question type
              let columnWidth = '14%';
              if (q.question_text.includes('need critical help')) {
                columnWidth = '18%';
              } else if (q.question_text.includes('One-word opener')) {
                columnWidth = '7%';
              } else if (q.question_text.includes('Today Goals and Targeted Results')) {
                columnWidth = '23%'; // Further reduced to accommodate wider Submitted At column
              }
              
              return (
                <th key={index} style={{ width: columnWidth }}>{displayText}</th>
              );
            })}
            <th style={{ width: '18%' }}>Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {allResponses.map(({ id, name, response, submittedTime }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>{name}</td>
              {questions.map((q, qIndex) => (
                <td key={qIndex}>
                  {response.questions.find((rq) => rq.question_id === q.id)?.answer_text?.split('\n').map((line, i) => {
                    const isGoalOrResult = q.question_text.includes('Today Goals') || q.question_text.includes('Targeted Results');
                    // Capitalize the first letter of each line
                    const capitalizedLine = capitalizeFirstLetter(line);
                    return (
                      <React.Fragment key={i}>
                        {isGoalOrResult ? `• ${capitalizedLine}` : capitalizedLine}
                        <br />
                      </React.Fragment>
                    );
                  }) || ''}
                </td>
              ))}
              <td className="submitted-time">
                {formatSubmissionTime(submittedTime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyHuddleResponse;
