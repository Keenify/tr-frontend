import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../hooks/useUserAndCompanyData';
import { useEmployeeResponses } from '../hooks/useEmployeeResponses';
import { ClipLoader } from 'react-spinners';

interface DailyHuddleResponseProps {
  session: Session;
}

const DailyHuddleResponse: React.FC<DailyHuddleResponseProps> = ({ session }) => {
  const [loading, setLoading] = React.useState(true);
  const { companyInfo, error: dataError } = useUserAndCompanyData(session.user.id);
  const { employeeResponses, error } = useEmployeeResponses(companyInfo?.id);

  React.useEffect(() => {
    if (companyInfo && employeeResponses) {
      setLoading(false);
    }
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

  // Separate submitted and not submitted responses
  const submittedResponses = employeeResponses.filter(emp => emp.response !== null);
  const notSubmittedResponses = employeeResponses.filter(emp => emp.response === null);

  return (
    <div>
      <h3 style={{ fontWeight: 'bold', fontSize: '1.5em', marginBottom: '10px' }}>Submitted Responses</h3>
      <table style={{ border: '1px solid black', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black' }}>Employee Name</th>
            {submittedResponses[0]?.response?.questions.map((q, index) => (
              <th key={index} style={{ border: '1px solid black' }}>{q.question_text}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {submittedResponses.map(({ id, name, response }) => (
            <tr key={id}>
              <td style={{ border: '1px solid black' }}>{name}</td>
              {response?.questions.map((q, index) => (
                <td key={index} style={{ border: '1px solid black' }}>{q.answer_text}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ borderTop: '2px solid grey', margin: '20px 0' }}></div>
      <h3 style={{ fontWeight: 'bold', fontSize: '1.5em', marginBottom: '10px' }}>Employees Who Have Not Submitted</h3>
      <ul style={{ textAlign: 'left' }}>
        {notSubmittedResponses.map(({ id, name }) => (
          <li key={id}>{name}</li>
        ))}
      </ul>
    </div>
  );
};

export default DailyHuddleResponse;
