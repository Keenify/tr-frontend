import { 
  RockefellerHabit, 
  RockefellerHabitLegacy, 
  RockefellerRecord, 
  RockefellerHabitsData, 
  SubListItem 
} from '../types/rockefellerChecklist';
import { supabase } from '../../../lib/supabase';
import { RockefellerDataConverter } from '../utils/dataConverter';

// Supabase service for Rockefeller Habit Checklist - Updated for company-level collaboration
class RockefellerChecklistService {
  
  /**
   * Validate if user has access to the company (simplified approach - no employees table needed)
   * Access control is handled by the component using proper company context from useUserAndCompanyData
   */
  private async validateCompanyAccess(userId: string, companyId: string): Promise<boolean> {
    // Simplified validation: Trust that the component provides the correct company context
    // This matches the approach used by Strata service
    return true;
  }

  /**
   * Get company's Rockefeller habits record (new method - company-based)
   */
  async getCompanyRecord(companyId: string): Promise<RockefellerRecord | null> {
    try {
      const { data, error } = await supabase
        .from('rockefeller_habit_checklist')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching company record:', error);
      return null;
    }
  }

  /**
   * Get all habits for a company (legacy compatible format)
   */
  async getHabits(userId: string, companyId: string): Promise<RockefellerHabitLegacy[]> {
    try {
      // Validate user has access to this company
      const hasAccess = await this.validateCompanyAccess(userId, companyId);
      if (!hasAccess) {
        throw new Error(`Access denied: User ${userId} is not authorized to view habits for company ${companyId}`);
      }

      // Get the company record
      const record = await this.getCompanyRecord(companyId);
      if (!record) {
        return []; // No record exists yet
      }

      // Convert to legacy format for backward compatibility
      return RockefellerDataConverter.convertToLegacyFormat(record);
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  }

  /**
   * Update a specific habit within the company's JSON record
   */
  async updateHabit(
    userId: string, 
    companyId: string, 
    habitId: string, 
    subList: SubListItem[]
  ): Promise<RockefellerHabitLegacy | null> {
    try {
      // Validate user has access to this company
      const hasAccess = await this.validateCompanyAccess(userId, companyId);
      if (!hasAccess) {
        throw new Error(`Access denied: User ${userId} is not authorized to edit habits for company ${companyId}`);
      }

      // Get current record
      const currentRecord = await this.getCompanyRecord(companyId);
      if (!currentRecord) {
        throw new Error(`No habits record found for company ${companyId}`);
      }

      // Update the specific habit in the JSON structure
      const updatedHabitsData = { ...currentRecord.habits_data };
      if (updatedHabitsData[habitId]) {
        updatedHabitsData[habitId] = {
          ...updatedHabitsData[habitId],
          sub_list: subList
        };
      }

      // Save back to database
      const { data, error } = await supabase
        .from('rockefeller_habit_checklist')
        .update({ 
          habits_data: updatedHabitsData,
          last_edited_by: userId,
          last_edited_at: new Date().toISOString()
        })
        .eq('company_id', companyId)
        .select()
        .single();
      
      if (error) throw error;

      // Return the specific habit in legacy format
      const habits = RockefellerDataConverter.convertToLegacyFormat(data);
      return habits.find(h => h.habit_id === habitId) || null;
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  /**
   * Initialize/Create habits for a company using templates
   */
  async initializeHabits(
    userId: string, 
    companyId: string, 
    templates: any[] // HabitTemplate[] from constants
  ): Promise<RockefellerHabitLegacy[]> {
    try {
      // Validate user has access to this company
      const hasAccess = await this.validateCompanyAccess(userId, companyId);
      if (!hasAccess) {
        throw new Error(`Access denied: User ${userId} is not authorized to initialize habits for company ${companyId}`);
      }

      console.log(`Initializing habits for company ${companyId} by user ${userId}`);
      
      // Check if record already exists
      const existingRecord = await this.getCompanyRecord(companyId);
      if (existingRecord) {
        console.log('Record already exists for company, checking habits_data...');
        
        // If habits_data has content, return it
        if (existingRecord.habits_data && Object.keys(existingRecord.habits_data).length > 0) {
          console.log('Habits already exist, returning existing data');
          return RockefellerDataConverter.convertToLegacyFormat(existingRecord);
        }
        
        // Record exists but habits_data is empty - UPDATE instead of INSERT
        console.log('Record exists but habits_data is empty, updating with template data');
        const habitsData = RockefellerDataConverter.initializeHabitsData(templates);
        
        const { data, error } = await supabase
          .from('rockefeller_habit_checklist')
          .update({
            habits_data: habitsData,
            last_edited_by: userId,
            last_edited_at: new Date().toISOString()
          })
          .eq('company_id', companyId)
          .select()
          .single();
        
        if (error) {
          console.error('Database error during habit update:', error);
          throw error;
        }
        
        const result = RockefellerDataConverter.convertToLegacyFormat(data);
        console.log(`Successfully updated ${result.length} habits for company ${companyId}`);
        return result;
      }

      // Initialize habits data from templates
      const habitsData = RockefellerDataConverter.initializeHabitsData(templates);

      // Upsert the company record
      const { data, error } = await supabase
        .from('rockefeller_habit_checklist')
        .upsert({
          company_id: companyId,
          habits_data: habitsData,
          last_edited_by: userId,
          last_edited_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Database error during habit initialization:', error);
        throw error;
      }
      
      const result = RockefellerDataConverter.convertToLegacyFormat(data);
      console.log(`Successfully initialized ${result.length} habits for company ${companyId}`);
      return result;
    } catch (error) {
      console.error('Error initializing habits:', error);
      throw error;
    }
  }

  /**
   * Toggle a specific sub-item within a habit (optimized for company-level collaboration)
   */
  async toggleSubItem(
    userId: string,
    companyId: string,
    habitId: string,
    subItemId: number
  ): Promise<boolean> {
    try {
      // Validate user has access to this company
      const hasAccess = await this.validateCompanyAccess(userId, companyId);
      if (!hasAccess) {
        throw new Error(`Access denied: User ${userId} is not authorized to edit habits for company ${companyId}`);
      }

      // Get current record
      const currentRecord = await this.getCompanyRecord(companyId);
      if (!currentRecord) {
        throw new Error(`No habits record found for company ${companyId}`);
      }

      // Find and toggle the sub-item
      const updatedHabitsData = { ...currentRecord.habits_data };
      if (updatedHabitsData[habitId]) {
        const habit = updatedHabitsData[habitId];
        const subItem = habit.sub_list.find(item => item.id === subItemId);
        
        if (subItem) {
          // Toggle the completion status
          const updatedSubList = habit.sub_list.map(item => 
            item.id === subItemId 
              ? { ...item, complete: !item.complete }
              : item
          );

          updatedHabitsData[habitId] = {
            ...habit,
            sub_list: updatedSubList
          };

          // Save back to database with collaboration tracking
          const { error } = await supabase
            .from('rockefeller_habit_checklist')
            .update({ 
              habits_data: updatedHabitsData,
              last_edited_by: userId,
              last_edited_at: new Date().toISOString()
            })
            .eq('company_id', companyId);
          
          if (error) throw error;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error toggling sub-item:', error);
      throw error;
    }
  }

  /**
   * Get last editor information for a company's habits
   */
  async getLastEditorInfo(companyId: string): Promise<{ userId: string; timestamp: string } | null> {
    try {
      const { data, error } = await supabase
        .from('rockefeller_habit_checklist')
        .select('last_edited_by, last_edited_at')
        .eq('company_id', companyId)
        .single();
      
      if (error || !data) return null;
      
      return {
        userId: data.last_edited_by,
        timestamp: data.last_edited_at
      };
    } catch (error) {
      console.error('Error getting last editor info:', error);
      return null;
    }
  }
}

// Singleton instance
export const rockefellerChecklistService = new RockefellerChecklistService();