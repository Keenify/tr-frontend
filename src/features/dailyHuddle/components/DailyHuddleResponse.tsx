import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useEmployeeResponses } from '../hooks/useEmployeeResponses';
import { fetchQuestions } from '../services/huddleService';
import { ClipLoader } from 'react-spinners';
import { Question } from '../types/huddle.types';

interface DailyHuddleResponseProps {
  session: Session;
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
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
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
   * Formats a date string into a readable time format
   * @param dateString - ISO date string
   * @returns Formatted time string (e.g., "10:30 AM")
   */
  const formatSubmissionTime = (dateString: string | undefined) => {
    if (!dateString) return 'Not submitted';
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format the time as HH:MM AM/PM
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader size={50} color={"#007BFF"} loading={loading} />
      </div>
    );
  }

  if (error || dataError) {
    return <div>Error loading employee responses: {error?.message || dataError?.message}</div>;
  }

  const allResponses = employeeResponses.map(emp => ({
    ...emp,
    response: emp.response || { questions: [] }
  }));

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="datePicker" style={{ marginRight: '10px' }}>Select Date: </label>
        <input
          type="date"
          id="datePicker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>
      <h3 style={{ fontWeight: 'bold', fontSize: '1.5em', marginBottom: '10px' }}>Submitted Responses</h3>
      <table style={{ border: '1px solid black', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', width: '5%' }}>No.</th>
            <th style={{ border: '1px solid black', width: '10%' }}>Team Member</th>
            {questions.map((q, index) => {
              const replacements: { [key: string]: string } = {
                "One-word opener": "One-Word",
                "Wins(1 work + 1 personal)": "Wins (1 Work + 1 Personal)",
                "I need critical help on": "I Need Critical Help On",
                "Main Priority": "Main Priority for Today"
              };
              
              const displayText = replacements[q.question_text] || q.question_text;
              
              // Determine column width based on question type
              let columnWidth = '15%';
              if (q.question_text.includes('need critical help')) {
                columnWidth = '20%';
              } else if (q.question_text.includes('One-word opener')) {
                columnWidth = '7%';
              } else if (q.question_text.includes('Today Goals and Targeted Results')) {
                columnWidth = '28%'; // Allocate more space for this column
              }
              
              return (
                <th key={index} style={{ 
                  border: '1px solid black',
                  width: columnWidth,
                  textAlign: 'center'
                }}>{displayText}</th>
              );
            })}
            <th style={{ border: '1px solid black', width: '10%' }}>Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {allResponses.map(({ id, name, response, submittedTime }, index) => (
            <tr key={id}>
              <td style={{ border: '1px solid black', textAlign: 'center' }}>{index + 1}</td>
              <td style={{ border: '1px solid black', textAlign: 'center' }}>{name}</td>
              {questions.map((q, qIndex) => (
                <td key={qIndex} style={{ 
                  border: '1px solid black', 
                  textAlign: 'center',
                  padding: '8px'
                }}>
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
              <td style={{ border: '1px solid black', textAlign: 'center' }}>
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
