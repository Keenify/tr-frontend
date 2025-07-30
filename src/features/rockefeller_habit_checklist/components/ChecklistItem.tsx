import React from 'react';
import { ChecklistItemProps } from '../types/rockefellerChecklist';

const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, onToggle }) => {
  const handleToggle = () => {
    onToggle(item.id);
  };

  const handleTextClick = () => {
    onToggle(item.id);
  };

  return (
    <div className="checklist-item">
      <input
        type="checkbox"
        className="item-checkbox"
        checked={item.complete}
        onChange={handleToggle}
        id={`item-${item.id}`}
      />
      <label 
        htmlFor={`item-${item.id}`}
        className={`item-text ${item.complete ? 'completed' : ''}`}
        onClick={handleTextClick}
      >
        {item.text}
      </label>
    </div>
  );
};

export default ChecklistItem;