import { useState, useEffect } from 'react';
import { getAllEmployees } from '../../../services/useUser';
import { fetchResponse } from '../services/huddleService';
import { ResponseData } from '../types/huddle.types';

interface EmployeeResponse {
  id: string;
  name: string;
  response: ResponseData | null;
  submittedTime?: string;
}

export function useEmployeeResponses(companyId: string | undefined, selectedDate: string) {
  const [employeeResponses, setEmployeeResponses] = useState<EmployeeResponse[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchAllResponses = async () => {
      try {
        const employeeData = await getAllEmployees(companyId);
        
        const responses = await Promise.all(employeeData.map(async (employee) => {
          const response = await fetchResponse(selectedDate, employee.id);
          return {
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            response,
            submittedTime: response?.submitted_at || response?.submitted_date || '',
          };
        }));

        const sortedResponses = responses.sort((a, b) => {
          if (!a.submittedTime) return 1;
          if (!b.submittedTime) return -1;
          return new Date(b.submittedTime).getTime() - new Date(a.submittedTime).getTime();
        });

        setEmployeeResponses(sortedResponses);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching employee responses:', err);
      }
    };

    fetchAllResponses();
  }, [companyId, selectedDate]);

  return { employeeResponses, error };
}
