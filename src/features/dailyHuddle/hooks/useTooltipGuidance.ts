import { useState, RefObject, MutableRefObject, useEffect, useCallback } from 'react';
import { useTooltipContext } from './useTooltip';

interface TooltipPosition {
  top: number;
  left: number;
}

interface UseTooltipGuidanceProps<T> {
  tooltipRef: RefObject<HTMLDivElement>;
  guidanceTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  tooltipId: string;
  onShowGuidance?: (id: T) => void;
  initialPosition?: 'left' | 'right'; // New prop for initial positioning
}

interface UseTooltipGuidanceReturn<T> {
  showGuidance: boolean;
  activeId: T | null;
  tooltipPosition: TooltipPosition;
  position: 'above' | 'below';
  handleInputFocus: (element: HTMLElement, id: T, overridePosition?: 'left' | 'right') => void;
  handleInputBlur: () => void;
  closeGuidance: () => void; // New function to close the guidance
  isDragging: boolean; // New state to track dragging
  handleDragStart: (e: React.MouseEvent) => void; // New function to start dragging
}

export function useTooltipGuidance<T>({
  tooltipRef,
  guidanceTimeoutRef,
  tooltipId,
  onShowGuidance,
  initialPosition = 'right', // Default to right
}: UseTooltipGuidanceProps<T>): UseTooltipGuidanceReturn<T> {
  const { activeTooltipId, setActiveTooltipId } = useTooltipContext();
  const [activeId, setActiveId] = useState<T | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const [position, setPosition] = useState<'above' | 'below'>('below');
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const calculateTooltipPosition = (inputRect: DOMRect, overridePosition?: 'left' | 'right'): { top: number; left: number; position: 'above' | 'below' } => {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 200; // Estimate if not available
    const tooltipWidth = tooltipRef.current?.offsetWidth || 320; // Estimate if not available
    
    // Space below the input in the viewport
    const spaceBelow = windowHeight - inputRect.bottom;
    
    // Determine vertical position
    let top: number;
    let position: 'above' | 'below' = 'below';
    
    if (spaceBelow < tooltipHeight + 10) {
      top = inputRect.top - tooltipHeight - 10;
      position = 'above';
    } else {
      top = inputRect.bottom + 5;
      position = 'below';
    }
    
    // Determine horizontal position based on initialPosition or overridePosition
    let left: number;
    const positionToUse = overridePosition || initialPosition;
    
    if (positionToUse === 'left') {
      // Position to the left of the input
      left = Math.max(10, inputRect.left - tooltipWidth - 20);
    } else {
      // Position to the right of the input
      left = inputRect.right + 20;
      
      // If it would go off-screen, position it to the left instead
      if (left + tooltipWidth > windowWidth - 10) {
        left = Math.max(10, inputRect.left - tooltipWidth - 20);
      }
    }
    
    // Ensure the tooltip stays within the viewport
    if (left < 10) left = 10;
    if (left + tooltipWidth > windowWidth - 10) left = windowWidth - tooltipWidth - 10;
    if (top < 10) top = 10;
    if (top + tooltipHeight > windowHeight - 10) top = windowHeight - tooltipHeight - 10;
    
    return { top, left, position };
  };

  const handleInputFocus = (element: HTMLElement, id: T, overridePosition?: 'left' | 'right') => {
    // Clear any existing timeout to prevent premature hiding
    if (guidanceTimeoutRef.current) {
      clearTimeout(guidanceTimeoutRef.current);
      guidanceTimeoutRef.current = null;
    }
    
    // Small delay to ensure DOM is updated before calculating position
    setTimeout(() => {
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Calculate position with the override if provided
        const position = calculateTooltipPosition(rect, overridePosition);
        
        setTooltipPosition({
          top: position.top,
          left: position.left
        });
        setPosition(position.position);
        setActiveId(id);
        setActiveElement(element);
        setActiveTooltipId(tooltipId);

        if (onShowGuidance) {
          onShowGuidance(id);
        }
      }
    }, 10);
  };
  
  const handleInputBlur = () => {
    // Don't hide the guidance window when focus leaves if we're dragging
    if (!isDragging) {
      // Use a small timeout to allow click events on the close button to be processed first
      // This prevents the need to click twice (once to focus, once to close)
      setTimeout(() => {
        // Only hide if we're not dragging and the tooltip is still active
        if (!isDragging && activeTooltipId === tooltipId) {
          setActiveTooltipId(null);
          setActiveElement(null);
        }
      }, 100);
    }
  };

  const closeGuidance = useCallback(() => {
    // Immediately hide the tooltip without any conditions
    setActiveTooltipId(null);
    setActiveElement(null);
    setIsDragging(false);
  }, [setActiveTooltipId]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (tooltipRef.current) {
      setIsDragging(true);
      const rect = tooltipRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (isDragging && tooltipRef.current) {
      e.preventDefault();
      
      // Calculate new position
      const newLeft = e.clientX - dragOffset.x;
      const newTop = e.clientY - dragOffset.y;
      
      // Update position
      setTooltipPosition({
        left: newLeft,
        top: newTop
      });
    }
  }, [isDragging, dragOffset]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Add a global focus/blur event listener to ensure tooltips are hidden when focus moves elsewhere
  useEffect(() => {
    const handleDocumentFocusChange = () => {
      // If the active element is not the one we're tracking and we're not dragging, hide the tooltip
      if (activeElement && document.activeElement !== activeElement && !isDragging) {
        // Use a small timeout to allow click events to be processed first
        setTimeout(() => {
          if (!isDragging && activeTooltipId === tooltipId) {
            setActiveTooltipId(null);
          }
        }, 100);
      }
    };

    document.addEventListener('focusin', handleDocumentFocusChange);
    
    return () => {
      document.removeEventListener('focusin', handleDocumentFocusChange);
    };
  }, [activeElement, setActiveTooltipId, isDragging, activeTooltipId, tooltipId]);

  return {
    showGuidance: activeTooltipId === tooltipId && (!!activeElement || isDragging),
    activeId,
    tooltipPosition,
    position,
    handleInputFocus,
    handleInputBlur,
    closeGuidance,
    isDragging,
    handleDragStart,
  };
} 