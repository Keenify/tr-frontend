import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ChecklistItemProps } from '../types/rockefellerChecklist';

const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, onToggle, habitId }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousCompleted, setPreviousCompleted] = useState(item.complete);

  useEffect(() => {
    if (previousCompleted !== item.complete) {
      setPreviousCompleted(item.complete);
    }
  }, [item.complete, previousCompleted]);

  const handleToggle = async () => {
    const expectedNewState = !item.complete;
    setIsAnimating(true);
    
    try {
      const result = await onToggle(item.id);
      
      if (result?.success) {
        const actualNewState = result.newState ?? expectedNewState;
        
        if (actualNewState) {
          toast.success('Great job! Habit completed! 🎉', {
            duration: 3000,
            position: 'top-right',
            style: {
              background: '#10B981',
              color: '#fff',
              fontWeight: '500',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            },
          });
        } else {
          toast.error('Habit unchecked - stay motivated! 💪', {
            duration: 3000,
            position: 'top-right',
            style: {
              background: '#EF4444',
              color: '#fff',
              fontWeight: '500',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
            },
          });
        }
      } else {
        toast.error('Failed to update habit. Please try again.', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '8px',
          },
        });
      }
    } catch (error) {
      toast.error('Failed to update habit. Please try again.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '8px',
        },
      });
    }
    
    setTimeout(() => setIsAnimating(false), 600);
  };

  // Create unique ID by combining habitId and item.id
  const uniqueId = `item-${habitId}-${item.id}`;

  return (
    <div className={`checklist-item ${isAnimating ? 'animating' : ''} ${item.complete ? 'completed-item' : 'pending-item'}`}>
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
      {isAnimating && (
        <div className="animation-overlay">
          {item.complete ? (
            <div className="success-animation">✨</div>
          ) : (
            <div className="warning-animation">⚡</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChecklistItem;