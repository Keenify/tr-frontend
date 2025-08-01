import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getUserData, UserData } from '../../services/useUser';
import { getCompanyData } from '../../services/useCompany';
import { CompanyData } from '../types/companyType';

interface UserDataCache {
  [userId: string]: {
    userInfo: UserData | null;
    companyInfo: CompanyData | null;
    error: Error | null;
    isLoading: boolean;
    timestamp: number;
  };
}

interface UserDataContextType {
  getCachedUserData: (userId: string) => {
    userInfo: UserData | null;
    companyInfo: CompanyData | null;
    error: Error | null;
    isLoading: boolean;
  };
  invalidateCache: (userId: string) => void;
  clearAllCache: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<UserDataCache>({});

  const getCachedUserData = useCallback((userId: string) => {
    if (!userId) {
      return {
        userInfo: null,
        companyInfo: null,
        error: new Error('User ID is required'),
        isLoading: false,
      };
    }

    const cachedData = cache[userId];
    const now = Date.now();

    // Return cached data if it exists and is still fresh
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      return {
        userInfo: cachedData.userInfo,
        companyInfo: cachedData.companyInfo,
        error: cachedData.error,
        isLoading: cachedData.isLoading,
      };
    }

    // If we're already loading this user's data, return the loading state
    if (cachedData?.isLoading) {
      return {
        userInfo: cachedData.userInfo,
        companyInfo: cachedData.companyInfo,
        error: cachedData.error,
        isLoading: true,
      };
    }

    // Start loading data
    setCache(prev => ({
      ...prev,
      [userId]: {
        userInfo: null,
        companyInfo: null,
        error: null,
        isLoading: true,
        timestamp: now,
      },
    }));

    // Fetch data
    const fetchData = async () => {
      try {
        console.log('Fetching user data for ID:', userId);
        const userData = await getUserData(userId);
        console.log('User data received:', userData);
        
        const companyData = await getCompanyData(userData.company_id) as CompanyData;

        setCache(prev => ({
          ...prev,
          [userId]: {
            userInfo: userData,
            companyInfo: companyData,
            error: null,
            isLoading: false,
            timestamp: Date.now(),
          },
        }));
      } catch (err) {
        console.error('Error fetching data:', err);
        setCache(prev => ({
          ...prev,
          [userId]: {
            userInfo: null,
            companyInfo: null,
            error: err as Error,
            isLoading: false,
            timestamp: Date.now(),
          },
        }));
      }
    };

    fetchData();

    // Return initial loading state
    return {
      userInfo: null,
      companyInfo: null,
      error: null,
      isLoading: true,
    };
  }, [cache]);

  const invalidateCache = useCallback((userId: string) => {
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[userId];
      return newCache;
    });
  }, []);

  const clearAllCache = useCallback(() => {
    setCache({});
  }, []);

  return (
    <UserDataContext.Provider value={{ getCachedUserData, invalidateCache, clearAllCache }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserDataContext = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserDataContext must be used within a UserDataProvider');
  }
  return context;
};