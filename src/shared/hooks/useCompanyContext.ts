import { useUserAndCompanyData } from './useUserAndCompanyData';
import { useSession } from './useSession';
import { Session } from '@supabase/supabase-js';

/**
 * Custom hook to get the current user's company context
 * Integrates with existing authentication and user data systems
 * Can be used by Projects, Resources, Sales, and other features requiring company-aware operations
 */
export function useCompanyContext(sessionOverride?: Session | null) {
  const sessionFromHook = useSession();
  const session = sessionOverride ?? sessionFromHook.session;
  const userId = session?.user?.id;
  
  // Only fetch user data when userId is actually available to avoid "User ID is required" error
  const shouldFetchData = !!userId;
  const { companyInfo, userInfo, isLoading, error } = shouldFetchData 
    ? useUserAndCompanyData(userId) 
    : { companyInfo: null, userInfo: null, isLoading: true, error: null };
  
  // Debug logging (disabled for performance)
  // console.log('🔍 [useCompanyContext] State:', {
  //   userId,
  //   shouldFetchData,
  //   isLoading,
  //   companyInfo: companyInfo?.id,
  //   error: error?.message,
  //   sessionExists: !!session,
  //   sessionUser: session?.user,
  //   sessionUserId: session?.user?.id
  // });
  
  return {
    companyId: companyInfo?.id || null,
    companyInfo,
    userInfo,
    isLoading: shouldFetchData ? isLoading : true, // Show loading when session is not ready
    error,
    isAuthenticated: !!session?.user?.id,
  };
}

/**
 * Hook to get company ID with error handling for Trello operations
 * Throws an error if no company ID is available, ensuring secure operations
 * Use this when you need to ensure a company ID is available for API calls
 */
export function useRequiredCompanyId(): string {
  const { companyId, isLoading, error, isAuthenticated } = useCompanyContext();
  
  if (!isAuthenticated) {
    throw new Error('User must be authenticated to access Trello features');
  }
  
  if (isLoading) {
    throw new Error('Company data is still loading');
  }
  
  if (error) {
    throw new Error(`Failed to load company data: ${error.message}`);
  }
  
  if (!companyId) {
    throw new Error('No company ID found for current user');
  }
  
  return companyId;
}

/**
 * Hook to safely get company ID with loading state management
 * Returns null if not available, allowing components to handle loading states gracefully
 * Use this when you want to conditionally make API calls based on company availability
 */
export function useSafeCompanyId(sessionOverride?: Session | null): {
  companyId: string | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
} {
  const { companyId, isLoading, error, isAuthenticated } = useCompanyContext(sessionOverride);
  
  return {
    companyId: isAuthenticated && !isLoading && !error ? companyId : null,
    isLoading: isLoading, // This will be true when session is loading or user data is loading
    error,
    isReady: isAuthenticated && !isLoading && !error && !!companyId,
  };
}