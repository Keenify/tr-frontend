import { useState, useEffect, useCallback } from 'react';
import { RockefellerHabit, SubListItem } from '../types/rockefellerChecklist';
import { rockefellerChecklistService } from '../services/rockefellerChecklistService';
import { ROCKEFELLER_HABITS } from '../constants';

export const useRockefellerChecklist = (userId: string, companyId: string) => {
  const [habits, setHabits] = useState<RockefellerHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize habits from template if they don't exist
  const initializeHabitsFromTemplate = useCallback(async () => {
    const initialHabits: RockefellerHabit[] = ROCKEFELLER_HABITS.map(template => ({
      user_id: userId,
      company_id: companyId,
      habit_id: `habit_${template.id}`,
      habit_name: template.habit_name,
      sub_list: template.sub_items.map((text, index) => ({
        id: index,
        text,
        complete: false
      })),
      last_edited_user: userId,
      last_edited_at: new Date().toISOString()
    }));

    const initialized = await rockefellerChecklistService.initializeHabits(
      userId, 
      companyId, 
      initialHabits
    );
    
    return initialized;
  }, [userId, companyId]);

  // Load habits on mount
  useEffect(() => {
    const loadHabits = async () => {
      try {
        setLoading(true);
        let existingHabits = await rockefellerChecklistService.getHabits(userId, companyId);
        
        // If no habits exist, initialize from template
        if (existingHabits.length === 0) {
          existingHabits = await initializeHabitsFromTemplate();
        }
        
        setHabits(existingHabits);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load habits');
      } finally {
        setLoading(false);
      }
    };

    loadHabits();
  }, [userId, companyId, initializeHabitsFromTemplate]);

  // Toggle a sub-item
  const toggleSubItem = useCallback(async (habitId: string, subItemId: number) => {
    try {
      const success = await rockefellerChecklistService.toggleSubItem(
        userId, 
        companyId, 
        habitId, 
        subItemId
      );
      
      if (success) {
        // Update local state
        setHabits(prevHabits => 
          prevHabits.map(habit => {
            if (habit.habit_id === habitId) {
              return {
                ...habit,
                sub_list: habit.sub_list.map(item => 
                  item.id === subItemId 
                    ? { ...item, complete: !item.complete }
                    : item
                )
              };
            }
            return habit;
          })
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle item');
    }
  }, [userId, companyId]);

  // Calculate progress for a habit
  const getHabitProgress = useCallback((habit: RockefellerHabit): number => {
    const completedItems = habit.sub_list.filter(item => item.complete).length;
    return habit.sub_list.length > 0 ? (completedItems / habit.sub_list.length) * 100 : 0;
  }, []);

  // Calculate overall progress
  const getOverallProgress = useCallback((): number => {
    if (habits.length === 0) return 0;
    
    const totalProgress = habits.reduce((sum, habit) => sum + getHabitProgress(habit), 0);
    return totalProgress / habits.length;
  }, [habits, getHabitProgress]);

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
    refreshHabits: () => {
      // Trigger re-fetch if needed
    }
  };
};