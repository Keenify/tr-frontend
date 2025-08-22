import React, { useState, useEffect } from 'react';
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
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const [previousProgress, setPreviousProgress] = useState(progressPercentage);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);

  useEffect(() => {
    if (previousProgress !== progressPercentage) {
      setIsProgressAnimating(true);
      setPreviousProgress(progressPercentage);
      
      setTimeout(() => setIsProgressAnimating(false), 1000);
    }
  }, [progressPercentage, previousProgress]);

  return (
    <div className={`checklist-section ${isProgressAnimating ? 'progress-animating' : ''}`}>
      <div className="section-header">
        <span className="section-number">{habitNumber}.</span>
        <span className="section-title">
          {habitName}
          <span className={`progress-indicator ${isProgressAnimating ? 'progress-changing' : ''}`}>
            {progressText}
            <span className="progress-percentage" style={{
              color: progressPercentage === 100 ? '#10B981' : progressPercentage >= 50 ? '#F59E0B' : '#EF4444'
            }}>
              {Math.round(progressPercentage)}%
            </span>
          </span>
        </span>
      </div>
      <div className="progress-bar-container">
        <div 
          className={`progress-bar ${isProgressAnimating ? 'animating' : ''}`} 
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: progressPercentage === 100 ? '#10B981' : progressPercentage >= 50 ? '#F59E0B' : '#EF4444'
          }}
        />
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