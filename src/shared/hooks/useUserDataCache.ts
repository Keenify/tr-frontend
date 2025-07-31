import { useUserDataContext } from '../contexts/UserDataContext';

/**
 * Hook to access user data cache management functions
 * 
 * @returns Object with cache management functions
 */
export const useUserDataCache = () => {
  const { invalidateCache, clearAllCache } = useUserDataContext();

  return {
    /**
     * Invalidate cache for a specific user
     * @param userId - The user ID to invalidate cache for
     */
    invalidateUserCache: invalidateCache,
    
    /**
     * Clear all cached user data
     * Useful for logout or when switching contexts
     */
    clearAllCache,
  };
};