import React, { useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';

interface TrelloCardProps {
  id: string;
  index: number;
  title: string;
  description?: string;
  colorCode?: string;
  thumbnailUrl?: string;
  onClick?: () => void;
}

/**
 * TrelloCard Component
 * 
 * Responsibility:
 * - Represents a draggable card in the Trello-like board
 * - Manages drag state and interactions
 * - Provides visual feedback during drag operations
 * 
 * Features:
 * - Draggable functionality
 * - Visual feedback during drag (rotation, shadow, highlight)
 * - Handles click vs drag detection
 * - Displays card content (title, description, thumbnail)
 * - Custom color support
 * - Prevents text selection during drag
 * 
 * Props:
 * @param {string} id - Unique identifier for the card
 * @param {number} index - Position in the list
 * @param {string} title - Card title
 * @param {string} description - Optional card description
 * @param {string} colorCode - Optional background color
 * @param {string} thumbnailUrl - Optional thumbnail image URL
 * @param {Function} onClick - Handler for card click
 */
export const TrelloCard: React.FC<TrelloCardProps> = ({
  id,
  index,
  title,
  description,
  colorCode,
  thumbnailUrl,
  onClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });

  // Prevent page scroll when dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      const deltaX = Math.abs(e.clientX - dragStartPosition.x);
      const deltaY = Math.abs(e.clientY - dragStartPosition.y);
      
      // If moved more than 5px in any direction, consider it a drag
      if (deltaX > 5 || deltaY > 5) {
        setIsDragging(true);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Draggable draggableId={`card-${id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`
            bg-white rounded p-3 mb-2
            cursor-pointer hover:bg-gray-50 
            transition-all duration-200 ease-in-out
            ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-3 z-50 ring-2 ring-blue-500 bg-blue-50' : ''}
            ${isDragging ? 'rotate-2 shadow-lg ring-1 ring-blue-400 bg-blue-50/50' : 'shadow-sm'}
            select-none
          `}
          style={{
            backgroundColor: colorCode || 'white',
            ...provided.draggableProps.style,
            transformOrigin: 'center',
            touchAction: 'none', // Prevent touch scrolling
          }}
          onClick={!isDragging ? onClick : undefined}
        >
          <div
            {...provided.dragHandleProps}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full"
          >
            {thumbnailUrl && (
              <img 
                src={thumbnailUrl} 
                alt="Card thumbnail" 
                className="w-full h-32 object-cover mb-2 rounded select-none"
                draggable={false}
              />
            )}
            <h3 className="font-medium text-gray-900 select-none">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1 select-none">{description}</p>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}; 