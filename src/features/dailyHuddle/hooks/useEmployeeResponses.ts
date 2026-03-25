import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllEmployees } from '../../../services/useUser';
import { fetchAllResponsesByCompanyAndDate } from '../services/huddleService';
import { ResponseData } from '../types/huddle.types';

interface EmployeeResponse {
  id: string;
  name: string;
  profile_pic_url: string | null;
  response: ResponseData | null;
  submittedTime?: string;
  Is_Employed?: boolean;
}

export function useEmployeeResponses(companyId: string | undefined, selectedDate: string, refreshKey: number = 0) {
  const [employeeResponses, setEmployeeResponses] = useState<EmployeeResponse[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Track active requests to prevent duplicates
  const activeRequestRef = useRef<string | null>(null);
  const lastFetchRef = useRef<string | null>(null);

  const fetchAllResponses = useCallback(async () => {
    if (!companyId) return;

    // Create unique request identifier
    const requestId = `${companyId}-${selectedDate}`;

    // Prevent duplicate requests
    if (activeRequestRef.current === requestId) {
      console.log(`🔄 [useEmployeeResponses] Skipping duplicate request for ${requestId}`);
      return;
    }

    // Don't fetch if we just fetched the same data
    if (lastFetchRef.current === requestId) {
      console.log(`✅ [useEmployeeResponses] Using cached data for ${requestId}`);
      return;
    }

    activeRequestRef.current = requestId;
    setIsLoading(true);
    console.log(`🚀 [useEmployeeResponses] Fetching employee responses for ${requestId} (BULK FETCH)`);

    try {
      // Fetch all employees and all responses in parallel (2 requests instead of N+1)
      const [allEmployeeData, allResponsesData] = await Promise.all([
        getAllEmployees(companyId),
        fetchAllResponsesByCompanyAndDate(companyId, selectedDate)
      ]);

      console.log(`📊 [useEmployeeResponses] Fetched ${allEmployeeData.length} employees and ${allResponsesData.length} responses`);

      // Create a map of employee_id -> response for quick lookup
      const responseMap = new Map();
      allResponsesData.forEach((responseData: any) => {
        responseMap.set(responseData.employee_id, {
          submitted_date: responseData.submitted_date,
          submitted_at: responseData.submitted_at,
          response_id: responseData.response_id,
          questions: responseData.questions
        });
      });

      // Map all employees with their responses (if they have one)
      const responses = allEmployeeData.map((employee) => {
        const response = responseMap.get(employee.id) || null;
        return {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
          profile_pic_url: employee.profile_pic_url || null,
          response,
          submittedTime: response?.submitted_at || response?.submitted_date || '',
          Is_Employed: employee.Is_Employed
        };
      });

      // Sort by submission time (earliest first gets higher rank)
      const sortedResponses = responses.sort((a, b) => {
        if (!a.submittedTime) return 1;
        if (!b.submittedTime) return -1;
        return new Date(a.submittedTime).getTime() - new Date(b.submittedTime).getTime();
      });

      setEmployeeResponses(sortedResponses);
      lastFetchRef.current = requestId;
      console.log(`✅ [useEmployeeResponses] Successfully processed ${responses.length} employee responses (${allResponsesData.length} submitted)`);
    } catch (err) {
      setError(err as Error);
      console.error('❌ [useEmployeeResponses] Error fetching employee responses:', err);
    } finally {
      activeRequestRef.current = null;
      setIsLoading(false);
    }
  }, [companyId, selectedDate]);

  useEffect(() => {
    fetchAllResponses();
  }, [companyId, selectedDate]); // Direct dependencies to avoid circular references

  // Re-fetch when the response tab becomes active (refreshKey increments on tab select)
  useEffect(() => {
    if (refreshKey === 0) return; // Skip initial mount
    lastFetchRef.current = null;
    fetchAllResponses();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshEmployeeResponses = useCallback(async () => {
    lastFetchRef.current = null; // Clear cache so force-refresh always fetches fresh data
    await fetchAllResponses();
  }, [fetchAllResponses]);

  return { employeeResponses, error, isLoading, refreshEmployeeResponses };
}
