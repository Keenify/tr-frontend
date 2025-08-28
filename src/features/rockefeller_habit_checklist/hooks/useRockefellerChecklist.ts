import { useState, useEffect, useCallback } from 'react';
import { RockefellerHabitLegacy, SubListItem } from '../types/rockefellerChecklist';
import { rockefellerChecklistService } from '../services/rockefellerChecklistService';
import { ROCKEFELLER_HABITS } from '../constants';

export const useRockefellerChecklist = (userId: string, companyId: string) => {
  const [habits, setHabits] = useState<RockefellerHabitLegacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastEditorInfo, setLastEditorInfo] = useState<{ userId: string; timestamp: string } | null>(null);

  // Initialize habits from template if they don't exist
  const initializeHabitsFromTemplate = useCallback(async () => {
    if (!userId || !companyId) {
      throw new Error('User ID and Company ID are required for initialization');
    }

    const initialized = await rockefellerChecklistService.initializeHabits(
      userId, 
      companyId, 
      ROCKEFELLER_HABITS
    );
    
    return initialized;
  }, [userId, companyId]);

  // Load last editor info
  const loadLastEditorInfo = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const editorInfo = await rockefellerChecklistService.getLastEditorInfo(companyId);
      setLastEditorInfo(editorInfo);
    } catch (error) {
      console.error('Failed to load last editor info:', error);
    }
  }, [companyId]);

  // Load habits on mount
  useEffect(() => {
    const loadHabits = async () => {
      // Don't load if we don't have valid user and company data
      if (!userId || !companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Load existing habits for the company
        let existingHabits = await rockefellerChecklistService.getHabits(userId, companyId);
        
        // If no habits exist, initialize from template
        if (existingHabits.length === 0) {
          console.log('No existing habits found, initializing from template for company');
          existingHabits = await initializeHabitsFromTemplate();
          
          // Verify initialization was successful
          if (existingHabits.length === 0) {
            throw new Error('Failed to initialize habits from template - no habits were created');
          }
          
          console.log(`Successfully initialized ${existingHabits.length} habits for company ${companyId}`);
        }
        
        setHabits(existingHabits);
        
        // Load collaboration info
        await loadLastEditorInfo();
        
      } catch (err) {
        console.error('Error loading habits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load habits');
      } finally {
        setLoading(false);
      }
    };

    loadHabits();
  }, [userId, companyId, initializeHabitsFromTemplate, loadLastEditorInfo]);

  // Toggle a sub-item
  const toggleSubItem = useCallback(async (habitId: string, subItemId: number): Promise<{ success: boolean; newState?: boolean }> => {
    if (!userId || !companyId) {
      setError('User ID and Company ID are required');
      return { success: false };
    }

    try {
      setError(null);
      
      // Get current state before toggling
      const currentHabit = habits.find(h => h.habit_id === habitId);
      const currentItem = currentHabit?.sub_list.find(item => item.id === subItemId);
      const newState = !currentItem?.complete;
      
      const success = await rockefellerChecklistService.toggleSubItem(
        userId, 
        companyId, 
        habitId, 
        subItemId
      );
      
      if (success) {
        // Update local state optimistically
        setHabits(prevHabits => 
          prevHabits.map(habit => {
            if (habit.habit_id === habitId) {
              return {
                ...habit,
                sub_list: habit.sub_list.map(item => 
                  item.id === subItemId 
                    ? { ...item, complete: newState }
                    : item
                )
              };
            }
            return habit;
          })
        );

        // Update last editor info to reflect current user made this change
        setLastEditorInfo({
          userId: userId,
          timestamp: new Date().toISOString()
        });

        return { success: true, newState };
      }
      
      return { success: false };
    } catch (err) {
      console.error('Error toggling sub-item:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle item');
      return { success: false };
    }
  }, [userId, companyId, habits]);

  // Calculate progress for a habit
  const getHabitProgress = useCallback((habit: RockefellerHabitLegacy): number => {
    const completedItems = habit.sub_list.filter(item => item.complete).length;
    return habit.sub_list.length > 0 ? (completedItems / habit.sub_list.length) * 100 : 0;
  }, []);

  // Calculate overall progress
  const getOverallProgress = useCallback((): number => {
    if (habits.length === 0) return 0;
    
    const totalProgress = habits.reduce((sum, habit) => sum + getHabitProgress(habit), 0);
    return totalProgress / habits.length;
  }, [habits, getHabitProgress]);

  // Refresh habits (for manual refresh when needed)
  const refreshHabits = useCallback(async () => {
    if (!userId || !companyId) return;
    
    try {
      setError(null);
      const refreshedHabits = await rockefellerChecklistService.getHabits(userId, companyId);
      setHabits(refreshedHabits);
      await loadLastEditorInfo();
    } catch (err) {
      console.error('Error refreshing habits:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh habits');
    }
  }, [userId, companyId, loadLastEditorInfo]);

  // Get habits with progress
  const habitsWithProgress = habits.map(habit => ({
    ...habit,
    progress: getHabitProgress(habit)
  }));

  return {
    habits: habitsWithProgress,
    loading,
    error,
    toggleSubItem,
    overallProgress: getOverallProgress(),
    lastEditorInfo, // New: collaboration info
    refreshHabits
  };
};