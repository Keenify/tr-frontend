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
            <th style={{ border: '1px solid black' }}>No.</th>
            <th style={{ border: '1px solid black' }}>Team Member</th>
            {questions.map((q, index) => (
              <th key={index} style={{ border: '1px solid black' }}>{q.question_text}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allResponses.map(({ id, name, response }, index) => (
            <tr key={id}>
              <td style={{ border: '1px solid black' }}>{index + 1}</td>
              <td style={{ border: '1px solid black' }}>{name}</td>
              {questions.map((q, qIndex) => (
                <td key={qIndex} style={{ border: '1px solid black' }}>
                  {response.questions.find((rq) => rq.question_id === q.id)?.answer_text || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyHuddleResponse;
