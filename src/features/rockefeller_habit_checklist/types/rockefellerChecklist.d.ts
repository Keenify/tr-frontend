export interface SubListItem {
    id: number;
    text: string;
    complete: boolean;
  }
  
  export interface RockefellerHabit {
    user_id: string;
    company_id: string;
    habit_id: string;
    habit_name: string;
    sub_list: SubListItem[];
    last_edited_at?: string;
  }
  
  export interface HabitTemplate {
    id: number;
    habit_name: string;
    sub_items: string[];
  }
  
  export interface ChecklistProps {
    userId: string;
    companyId: string;
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