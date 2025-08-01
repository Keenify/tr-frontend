import { useUserDataContext } from '../contexts/UserDataContext';

export function useUserAndCompanyData(userId: string) {
  const { getCachedUserData } = useUserDataContext();
  return getCachedUserData(userId);
} 