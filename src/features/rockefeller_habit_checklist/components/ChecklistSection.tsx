import React from 'react';
import ChecklistItem from './ChecklistItem';
import { ChecklistSectionProps } from '../types/rockefellerChecklist';

const ChecklistSection: React.FC<ChecklistSectionProps> = ({ 
  habitNumber, 
  habitName, 
  subItems, 
  onItemToggle,
  habitId 
}) => {
  const completedCount = subItems.filter(item => item.complete).length;
  const totalCount = subItems.length;
  const progressText = `(${completedCount}/${totalCount})`;

  return (
    <div className="checklist-section">
      <div className="section-header">
        <span className="section-number">{habitNumber}.</span>
        <span className="section-title">
          {habitName}
          <span className="progress-indicator">{progressText}</span>
        </span>
      </div>
      <div className="checklist-items">
        {subItems.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={onItemToggle}
            habitId={habitId}
          />
        ))}
      </div>
    </div>
  );
};

export default ChecklistSection;