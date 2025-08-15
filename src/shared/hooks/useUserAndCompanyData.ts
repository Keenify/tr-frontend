import { useUserDataContext } from '../contexts/UserDataContext';
import { useEffect } from 'react';

export function useUserAndCompanyData(userId: string) {
  const { getCachedUserData, triggerFetch } = useUserDataContext();
  const data = getCachedUserData(userId);
  
  // Trigger fetch if data is not loading and we don't have data
  useEffect(() => {
    if (userId && !data.isLoading && !data.userInfo && !data.error) {
      triggerFetch(userId);
    }
  }, [userId, data.isLoading, data.userInfo, data.error, triggerFetch]);
  
  return data;
} 