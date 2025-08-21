import React, { useCallback } from 'react';
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
  const { userInfo, companyInfo, isLoading: userDataLoading } = useUserAndCompanyData(session.user.id);
  
  // Use company context directly
  const userId = userInfo?.user_id;
  const companyId = companyInfo?.id; // Use company context instead of userInfo.company_id
  
  // Only call the checklist hook when we have valid user and company data
  const shouldLoadHabits = userId && companyId;
  const { 
    habits, 
    loading, 
    error, 
    toggleSubItem, 
    overallProgress, 
    lastEditorInfo, 
    refreshHabits 
  } = useRockefellerChecklist(
    shouldLoadHabits ? userId : '',
    shouldLoadHabits ? companyId : ''
  );

  const handleItemToggle = useCallback((habitId: string) => async (itemId: number) => {
    const result = await toggleSubItem(habitId, itemId);
    
    // Call onUpdate callback if provided and toggle was successful
    if (onUpdate && result.success) {
      const habit = habits.find(h => h.habit_id === habitId);
      if (habit) {
        onUpdate(habitId, habit.progress || 0);
      }
    }
    
    return result;
  }, [toggleSubItem, onUpdate, habits]);

  if (userDataLoading || loading || !shouldLoadHabits) {
    return (
      <div className="rockefeller-checklist">
        <div className="checklist-header">
          <h1 className="checklist-title">
            {userDataLoading ? 'Loading user data...' : 'Loading habits...'}
          </h1>
          {companyInfo && (
            <p className="checklist-subtitle">
              Company: {companyInfo.name}
            </p>
          )}
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

  // Helper function to format last edited info
  const formatLastEdited = () => {
    if (!lastEditorInfo) return '';
    
    const date = new Date(lastEditorInfo.timestamp);
    const isToday = date.toDateString() === new Date().toDateString();
    const timeFormat = isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const isCurrentUser = lastEditorInfo.userId === userId;
    const editorName = isCurrentUser ? 'You' : 'Another user';
    
    return `Last edited by ${editorName} ${isToday ? 'at' : 'on'} ${timeFormat}`;
  };

  return (
    <div className="rockefeller-checklist">
      <div className="checklist-header">
        <h1 className="checklist-title">Execution: Rockefeller Habits Checklist</h1>
        <div className="checklist-info">
          <p className="checklist-subtitle">
            Company: <strong>{companyInfo?.name}</strong>
          </p>
          <p className="checklist-subtitle">
            Progress: <strong>{Math.round(overallProgress)}% Complete</strong>
          </p>
          {lastEditorInfo && (
            <p className="checklist-collaboration-info">
              {formatLastEdited()}
              <button 
                onClick={refreshHabits} 
                className="refresh-button"
                title="Refresh to see latest changes"
              >
                ↻
              </button>
            </p>
          )}
        </div>
      </div>
      
      <div className="checklist-sections">
        {habits.map((habit, index) => (
          <ChecklistSection
            key={habit.habit_id}
            habitNumber={index + 1}
            habitName={habit.habit_name}
            subItems={habit.sub_list}
            onItemToggle={handleItemToggle(habit.habit_id)}
            habitId={habit.habit_id}
          />
        ))}
      </div>
    </div>
  );
};

export default RockefellerHabitChecklist;