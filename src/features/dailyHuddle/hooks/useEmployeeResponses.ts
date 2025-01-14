import { useState, useEffect } from 'react';
import { getAllEmployees } from '../../../services/userService';
import { fetchResponse } from '../services/huddleService';
import { ResponseData } from '../types/huddle.types';

interface EmployeeResponse {
  id: string;
  name: string;
  response: ResponseData | null;
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
          };
        }));

        setEmployeeResponses(responses);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching employee responses:', err);
      }
    };

    fetchAllResponses();
  }, [companyId, selectedDate]);

  return { employeeResponses, error };
}
