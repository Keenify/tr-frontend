import React from 'react';
import ChecklistSection from './ChecklistSection';
import { useRockefellerChecklist } from '../hooks/useRockefellerChecklist';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { Session } from '@supabase/supabase-js';
import '../styles/rockefellerChecklist.css';

interface Props {
  session: Session;
  onUpdate?: (habitId: string, progress: number) => void;
}

const RockefellerHabitChecklist: React.FC<Props> = ({ session, onUpdate }) => {
  const { userInfo, companyInfo } = useUserAndCompanyData(session.user.id);
  
  // Get the actual user_id and company_id from the userInfo
  const userId = userInfo?.user_id;
  const companyId = userInfo?.company_id;
  const { habits, loading, error, toggleSubItem, overallProgress } = useRockefellerChecklist(
    userId, 
    companyId
  );

  const handleItemToggle = (habitId: string) => (itemId: number) => {
    toggleSubItem(habitId, itemId);
    
    // Call onUpdate callback if provided
    if (onUpdate) {
      const habit = habits.find(h => h.habit_id === habitId);
      if (habit) {
        onUpdate(habitId, habit.progress || 0);
      }
    }
  };

  if (loading || !userId || !companyId) {
    return (
      <div className="rockefeller-checklist">
        <div className="checklist-header">
          <h1 className="checklist-title">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rockefeller-checklist">
        <div className="checklist-header">
          <h1 className="checklist-title">Error</h1>
          <p className="checklist-subtitle">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rockefeller-checklist">
      <div className="checklist-header">
        <h1 className="checklist-title">Execution: Rockefeller Habits Checklist</h1>
        <p className="checklist-subtitle">
          Progress: {Math.round(overallProgress)}% Complete
        </p>
      </div>
      
      <div className="checklist-sections">
        {habits.map((habit, index) => (
          <ChecklistSection
            key={habit.habit_id}
            habitNumber={index + 1}
            habitName={habit.habit_name}
            subItems={habit.sub_list}
            onItemToggle={handleItemToggle(habit.habit_id)}
          />
        ))}
      </div>
    </div>
  );
};

export default RockefellerHabitChecklist;