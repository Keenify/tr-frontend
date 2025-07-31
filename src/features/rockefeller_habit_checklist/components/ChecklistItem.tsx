import React from 'react';
import { ChecklistItemProps } from '../types/rockefellerChecklist';

const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, onToggle, habitId }) => {
  const handleToggle = () => {
    onToggle(item.id);
  };

  // Create unique ID by combining habitId and item.id
  const uniqueId = `item-${habitId}-${item.id}`;

  return (
    <div className="checklist-item">
      <input
        type="checkbox"
        className="item-checkbox"
        checked={item.complete}
        onChange={handleToggle}
        id={uniqueId}
      />
      <label 
        htmlFor={uniqueId}
        className={`item-text ${item.complete ? 'completed' : ''}`}
      >
        {item.text}
      </label>
    </div>
  );
};

export default ChecklistItem;