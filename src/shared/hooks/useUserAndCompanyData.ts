import { useUserDataContext } from '../contexts/UserDataContext';
import { useEffect, useState } from 'react';

export function useUserAndCompanyData(userId: string) {
  const { getCachedUserData } = useUserDataContext();
  const [data, setData] = useState(() => getCachedUserData(userId));
  
  useEffect(() => {
    if (userId) {
      const newData = getCachedUserData(userId);
      setData(newData);
    }
  }, [userId, getCachedUserData]);
  
  return data;
} 