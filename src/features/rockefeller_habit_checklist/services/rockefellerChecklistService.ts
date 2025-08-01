import { RockefellerHabit, SubListItem } from '../types/rockefellerChecklist';
import { supabase } from '../../../lib/supabase';

// Supabase service for Rockefeller Habit Checklist
class RockefellerChecklistService {
  // Get all habits for a user/company
  async getHabits(userId: string, companyId: string): Promise<RockefellerHabit[]> {
    try {
      const { data, error } = await supabase
        .from('rockefeller_habit_checklist')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
  }

  // Update a specific habit
  async updateHabit(
    userId: string, 
    companyId: string, 
    habitId: string, 
    subList: SubListItem[]
  ): Promise<RockefellerHabit | null> {
    try {
      const { data, error } = await supabase
        .from('rockefeller_habit_checklist')
        .update({ 
          sub_list: subList
        })
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .eq('habit_id', habitId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating habit:', error);
      return null;
    }
  }

  // Create/Initialize habits for a user/company
  async initializeHabits(
    userId: string, 
    companyId: string, 
    habits: RockefellerHabit[]
  ): Promise<RockefellerHabit[]> {
    try {
      console.log(`Initializing ${habits.length} habits for user ${userId}, company ${companyId}`);
      
      const { data, error } = await supabase
        .from('rockefeller_habit_checklist')
        .insert(habits)
        .select();
      
      if (error) {
        console.error('Database error during habit initialization:', error);
        throw error;
      }
      
      const result = data || [];
      console.log(`Successfully created ${result.length} habits in database`);
      return result;
    } catch (error) {
      console.error('Error initializing habits:', error);
      // Don't return empty array, let the error bubble up
      throw error;
    }
  }

  // Toggle a specific sub-item
  async toggleSubItem(
    userId: string,
    companyId: string,
    habitId: string,
    subItemId: number
  ): Promise<boolean> {
    try {
      const habits = await this.getHabits(userId, companyId);
      const habit = habits.find(h => h.habit_id === habitId);
      
      if (habit) {
        const subItem = habit.sub_list.find(item => item.id === subItemId);
        
        if (subItem) {
          subItem.complete = !subItem.complete;
          await this.updateHabit(userId, companyId, habitId, habit.sub_list);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error toggling sub-item:', error);
      return false;
    }
  }
}

// Singleton instance
export const rockefellerChecklistService = new RockefellerChecklistService();