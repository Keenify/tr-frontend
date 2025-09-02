import { useUserDataContext } from '../contexts/UserDataContext';
import { useEffect, useState } from 'react';

export function useUserAndCompanyData(userId: string) {
  const { getCachedUserData } = useUserDataContext();
  
  console.log(`🎣 [useUserAndCompanyData] Hook called for userId: ${userId}`);
  
  const [data, setData] = useState(() => {
    const initialData = getCachedUserData(userId);
    console.log(`🏁 [useUserAndCompanyData] Initial data for ${userId}:`, {
      hasUserInfo: !!initialData.userInfo,
      hasCompanyInfo: !!initialData.companyInfo,
      isLoading: initialData.isLoading,
      error: !!initialData.error
    });
    return initialData;
  });
  
  useEffect(() => {
    console.log(`🔄 [useUserAndCompanyData] useEffect triggered for userId: ${userId}`);
    if (userId) {
      const newData = getCachedUserData(userId);
      setData(currentData => {
        const hasChanged = JSON.stringify(currentData) !== JSON.stringify(newData);
        console.log(`📊 [useUserAndCompanyData] Data comparison for ${userId}:`, {
          hasChanged,
          currentLoading: currentData.isLoading,
          newLoading: newData.isLoading,
          currentCompanyId: currentData.companyInfo?.id,
          newCompanyId: newData.companyInfo?.id
        });
        
        if (hasChanged) {
          console.log(`🔄 [useUserAndCompanyData] Updating data for ${userId} - WILL TRIGGER RE-RENDER`);
          return newData;
        }
        console.log(`✅ [useUserAndCompanyData] No change for ${userId} - preventing re-render`);
        return currentData; // Keep same reference to prevent re-render
      });
    }
  }, [userId, getCachedUserData]);
  
  console.log(`📤 [useUserAndCompanyData] Returning data for ${userId}:`, {
    hasUserInfo: !!data.userInfo,
    hasCompanyInfo: !!data.companyInfo,
    companyId: data.companyInfo?.id,
    isLoading: data.isLoading,
    error: !!data.error
  });
  
  return data;
} 