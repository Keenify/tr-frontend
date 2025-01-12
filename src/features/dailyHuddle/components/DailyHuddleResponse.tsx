import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../hooks/useUserAndCompanyData';
import { useEmployeeResponses } from '../hooks/useEmployeeResponses';
import { fetchQuestions } from '../services/huddleService';
import { ClipLoader } from 'react-spinners';
import { Question } from '../types/huddle.types';

interface DailyHuddleResponseProps {
  session: Session;
}

const DailyHuddleResponse: React.FC<DailyHuddleResponseProps> = ({ session }) => {
  const [loading, setLoading] = React.useState(true);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const { companyInfo, error: dataError } = useUserAndCompanyData(session.user.id);
  const { employeeResponses, error } = useEmployeeResponses(companyInfo?.id);

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
      <h3 style={{ fontWeight: 'bold', fontSize: '1.5em', marginBottom: '10px' }}>Submitted Responses</h3>
      <table style={{ border: '1px solid black', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black' }}>No.</th>
            <th style={{ border: '1px solid black' }}>Employee Name</th>
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
                  {response.questions.find(rq => rq.question_id === q.id)?.answer_text || ''}
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
