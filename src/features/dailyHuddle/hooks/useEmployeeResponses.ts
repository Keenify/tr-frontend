import { useState, useEffect, useCallback } from 'react';
import { getAllEmployees } from '../../../services/useUser';
import { fetchResponse } from '../services/huddleService';
import { ResponseData } from '../types/huddle.types';

interface EmployeeResponse {
  id: string;
  name: string;
  profile_pic_url: string | null;
  response: ResponseData | null;
  submittedTime?: string;
  Is_Employed?: boolean;
}

export function useEmployeeResponses(companyId: string | undefined, selectedDate: string) {
  const [employeeResponses, setEmployeeResponses] = useState<EmployeeResponse[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllResponses = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const allEmployeeData = await getAllEmployees(companyId);
      
      const employedEmployeeData = allEmployeeData.filter(employee => employee.Is_Employed === true);

      const responses = await Promise.all(employedEmployeeData.map(async (employee) => {
        const response = await fetchResponse(selectedDate, employee.id);
        return {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
          profile_pic_url: employee.profile_pic_url || null,
          response,
          submittedTime: response?.submitted_at || response?.submitted_date || '',
          Is_Employed: employee.Is_Employed
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
  }, [companyId, selectedDate]);

  useEffect(() => {
    fetchAllResponses();
  }, [fetchAllResponses]);

  return { employeeResponses, error, refreshEmployeeResponses: fetchAllResponses };
}
