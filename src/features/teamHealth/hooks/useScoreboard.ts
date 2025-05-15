import { useState, useCallback, useEffect } from 'react';
import { 
  createScoreboard, 
  updateScoreboard, 
  deleteScoreboard, 
  getScoreboard, 
  getEmployeeScoreboards, 
  getCompanyScoreboards 
} from '../services/useScoreboard';
import { 
  ScoreboardData, 
  CreateScoreboardPayload, 
  UpdateScoreboardPayload 
} from '../types/scoreboard';

interface UseScoreboardOptions {
  /** Automatically fetch scoreboards on mount */
  autoFetch?: boolean;
  /** Default company ID to use for API calls */
  companyId?: string;
  /** Default employee ID to use for fetching */
  employeeId?: string;
}

interface UseScoreboardResult {
  /** List of scoreboard entries */
  scoreboards: ScoreboardData[];
  /** Currently selected scoreboard entry */
  selectedScoreboard: ScoreboardData | null;
  /** Whether any API call is in progress */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Function to fetch all scoreboards for a company */
  fetchCompanyScoreboards: (companyId: string) => Promise<ScoreboardData[]>;
  /** Function to fetch all scoreboards for an employee */
  fetchEmployeeScoreboards: (employeeId: string) => Promise<ScoreboardData[]>;
  /** Function to fetch a specific scoreboard by ID */
  fetchScoreboard: (scoreboardId: string, companyId: string) => Promise<ScoreboardData | null>;
  /** Function to create a new scoreboard entry */
  addScoreboard: (payload: CreateScoreboardPayload, companyId: string) => Promise<ScoreboardData | null>;
  /** Function to update an existing scoreboard entry */
  editScoreboard: (scoreboardId: string, companyId: string, payload: UpdateScoreboardPayload) => Promise<ScoreboardData | null>;
  /** Function to delete a scoreboard entry */
  removeScoreboard: (scoreboardId: string, companyId: string) => Promise<boolean>;
  /** Function to clear any errors */
  clearError: () => void;
  /** Function to set the selected scoreboard */
  setSelectedScoreboard: (scoreboard: ScoreboardData | null) => void;
}

/**
 * Hook to interact with the scoreboard API
 * @param options - Configuration options
 * @returns Functions and state for interacting with scoreboards
 */
export function useScoreboard(options: UseScoreboardOptions = {}): UseScoreboardResult {
  const { autoFetch = false, companyId = '', employeeId = '' } = options;
  
  const [scoreboards, setScoreboards] = useState<ScoreboardData[]>([]);
  const [selectedScoreboard, setSelectedScoreboard] = useState<ScoreboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Fetch company scoreboards
  const fetchCompanyScoreboards = useCallback(async (companyId: string): Promise<ScoreboardData[]> => {
    try {
      setIsLoading(true);
      clearError();
      
      const data = await getCompanyScoreboards(companyId);
      setScoreboards(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch company scoreboards';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Fetch employee scoreboards
  const fetchEmployeeScoreboards = useCallback(async (employeeId: string): Promise<ScoreboardData[]> => {
    try {
      setIsLoading(true);
      clearError();
      
      const data = await getEmployeeScoreboards(employeeId);
      setScoreboards(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee scoreboards';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Fetch a specific scoreboard
  const fetchScoreboard = useCallback(async (
    scoreboardId: string, 
    companyId: string
  ): Promise<ScoreboardData | null> => {
    try {
      setIsLoading(true);
      clearError();
      
      const data = await getScoreboard(scoreboardId, companyId);
      setSelectedScoreboard(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scoreboard';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Create a new scoreboard
  const addScoreboard = useCallback(async (
    payload: CreateScoreboardPayload,
    companyId: string
  ): Promise<ScoreboardData | null> => {
    try {
      setIsLoading(true);
      clearError();
      
      const data = await createScoreboard(payload, companyId);
      setScoreboards(prev => [...prev, data]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create scoreboard';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Update an existing scoreboard
  const editScoreboard = useCallback(async (
    scoreboardId: string,
    companyId: string,
    payload: UpdateScoreboardPayload
  ): Promise<ScoreboardData | null> => {
    try {
      setIsLoading(true);
      clearError();
      
      const data = await updateScoreboard(scoreboardId, companyId, payload);
      
      // Update the scoreboards list with the updated scoreboard
      setScoreboards(prev => 
        prev.map(sb => sb.id === scoreboardId ? data : sb)
      );
      
      // Update selected scoreboard if it's the one being edited
      if (selectedScoreboard?.id === scoreboardId) {
        setSelectedScoreboard(data);
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update scoreboard';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, selectedScoreboard]);

  // Delete a scoreboard
  const removeScoreboard = useCallback(async (
    scoreboardId: string,
    companyId: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      
      await deleteScoreboard(scoreboardId, companyId);
      
      // Remove the deleted scoreboard from the list
      setScoreboards(prev => 
        prev.filter(sb => sb.id !== scoreboardId)
      );
      
      // Clear selected scoreboard if it was the one deleted
      if (selectedScoreboard?.id === scoreboardId) {
        setSelectedScoreboard(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete scoreboard';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, selectedScoreboard]);

  // Auto-fetch data if configured
  useEffect(() => {
    if (autoFetch) {
      if (companyId) {
        fetchCompanyScoreboards(companyId);
      } else if (employeeId) {
        fetchEmployeeScoreboards(employeeId);
      }
    }
  }, [autoFetch, companyId, employeeId, fetchCompanyScoreboards, fetchEmployeeScoreboards]);

  return {
    scoreboards,
    selectedScoreboard,
    isLoading,
    error,
    fetchCompanyScoreboards,
    fetchEmployeeScoreboards,
    fetchScoreboard,
    addScoreboard,
    editScoreboard,
    removeScoreboard,
    clearError,
    setSelectedScoreboard
  };
} 