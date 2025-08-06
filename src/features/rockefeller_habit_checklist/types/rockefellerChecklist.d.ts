export interface SubListItem {
    id: number;
    text: string;
    complete: boolean;
  }
  
  // Individual habit structure (used in JSON)
  export interface RockefellerHabit {
    habit_name: string;
    sub_list: SubListItem[];
  }

  // JSON structure for habits_data column
  export interface RockefellerHabitsData {
    [key: string]: RockefellerHabit; // habit_1, habit_2, etc.
  }

  // Database record structure
  export interface RockefellerRecord {
    id: string;
    company_id: string;
    habits_data: RockefellerHabitsData;
    last_edited_by?: string;
    created_at?: string;
    last_edited_at?: string;
  }

  // Legacy interface for backward compatibility with components
  export interface RockefellerHabitLegacy {
    habit_id: string;
    habit_name: string;
    sub_list: SubListItem[];
    progress?: number;
  }
  
  export interface HabitTemplate {
    id: number;
    habit_name: string;
    sub_items: string[];
  }
  
  export interface ChecklistProps {
    companyId: string;
    userId?: string; // Optional for legacy compatibility
    onUpdate?: (habitId: string, progress: number) => void;
  }
  
  export interface ChecklistSectionProps {
    habitNumber: number;
    habitName: string;
    subItems: SubListItem[];
    onItemToggle: (itemId: number) => void;
    habitId: string;
  }
  
  export interface ChecklistItemProps {
    item: SubListItem;
    onToggle: (itemId: number) => void;
    habitId: string;
  }

  // Utility functions for data conversion
  export interface RockefellerUtils {
    convertToLegacyFormat: (record: RockefellerRecord) => RockefellerHabitLegacy[];
    convertFromLegacyFormat: (habits: RockefellerHabitLegacy[]) => RockefellerHabitsData;
    initializeHabitsData: (templates: HabitTemplate[]) => RockefellerHabitsData;
  }