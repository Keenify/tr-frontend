import { 
  RockefellerRecord, 
  RockefellerHabitLegacy, 
  RockefellerHabitsData, 
  HabitTemplate 
} from '../types/rockefellerChecklist';

/**
 * Utility functions for converting between new JSON structure and legacy format
 * This allows components to continue working while we use the new database structure
 * 
 * NOTE: This is a temporary utility file that can be deleted once all components
 * are updated to work directly with the new JSON structure
 */
export class RockefellerDataConverter {
  
  /**
   * Convert new JSON structure to legacy format for component compatibility
   */
  static convertToLegacyFormat(record: RockefellerRecord): RockefellerHabitLegacy[] {
    const habits: RockefellerHabitLegacy[] = [];
    
    // Convert each habit in the JSON structure
    Object.entries(record.habits_data).forEach(([habitId, habit]) => {
      const completedItems = habit.sub_list.filter(item => item.complete).length;
      const progress = habit.sub_list.length > 0 
        ? (completedItems / habit.sub_list.length) * 100 
        : 0;

      habits.push({
        habit_id: habitId,
        habit_name: habit.habit_name,
        sub_list: habit.sub_list,
        progress: progress
      });
    });

    // Sort by habit_id to maintain consistent order (habit_1, habit_2, etc.)
    return habits.sort((a, b) => {
      const aNum = parseInt(a.habit_id.replace('habit_', ''));
      const bNum = parseInt(b.habit_id.replace('habit_', ''));
      return aNum - bNum;
    });
  }

  /**
   * Convert legacy format back to new JSON structure
   */
  static convertFromLegacyFormat(habits: RockefellerHabitLegacy[]): RockefellerHabitsData {
    const habitsData: RockefellerHabitsData = {};
    
    habits.forEach(habit => {
      habitsData[habit.habit_id] = {
        habit_name: habit.habit_name,
        sub_list: habit.sub_list
      };
    });

    return habitsData;
  }

  /**
   * Initialize habits data from templates (for new companies)
   */
  static initializeHabitsData(templates: HabitTemplate[]): RockefellerHabitsData {
    const habitsData: RockefellerHabitsData = {};
    
    templates.forEach(template => {
      const habitId = `habit_${template.id}`;
      habitsData[habitId] = {
        habit_name: template.habit_name,
        sub_list: template.sub_items.map((text, index) => ({
          id: index, // Use 0-3 index pattern as specified
          text: text,
          complete: false
        }))
      };
    });

    return habitsData;
  }

  /**
   * Update a specific habit's sub-item in the JSON structure
   */
  static updateSubItem(
    habitsData: RockefellerHabitsData, 
    habitId: string, 
    subItemId: number, 
    complete: boolean
  ): RockefellerHabitsData {
    const updatedData = { ...habitsData };
    
    if (updatedData[habitId]) {
      updatedData[habitId] = {
        ...updatedData[habitId],
        sub_list: updatedData[habitId].sub_list.map(item => 
          item.id === subItemId ? { ...item, complete } : item
        )
      };
    }

    return updatedData;
  }

  /**
   * Calculate progress for a specific habit
   */
  static calculateHabitProgress(habit: { sub_list: { complete: boolean }[] }): number {
    const completedItems = habit.sub_list.filter(item => item.complete).length;
    return habit.sub_list.length > 0 ? (completedItems / habit.sub_list.length) * 100 : 0;
  }

  /**
   * Calculate overall progress across all habits
   */
  static calculateOverallProgress(habitsData: RockefellerHabitsData): number {
    const habits = Object.values(habitsData);
    if (habits.length === 0) return 0;
    
    const totalProgress = habits.reduce((sum, habit) => 
      sum + this.calculateHabitProgress(habit), 0
    );
    
    return totalProgress / habits.length;
  }
}