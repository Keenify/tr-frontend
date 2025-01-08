import { useState, useEffect } from 'react';
import { getAllEmployees } from '../../../services/userService';
import { fetchResponse, ResponseData } from '../services/huddleService';

interface EmployeeResponse {
  id: string;
  name: string;
  response: ResponseData | null;
}

export function useEmployeeResponses(companyId: string | undefined) {
  const [employeeResponses, setEmployeeResponses] = useState<EmployeeResponse[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchAllResponses = async () => {
      try {
        const employeeData = await getAllEmployees(companyId);
        const today = new Date().toISOString().split('T')[0];

        const responses = await Promise.all(employeeData.map(async (employee) => {
          const response = await fetchResponse(today, employee.id);
          return {
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            response,
          };
        }));

        setEmployeeResponses(responses);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching employee responses:', err);
      }
    };

    fetchAllResponses();
  }, [companyId]);

  return { employeeResponses, error };
}
