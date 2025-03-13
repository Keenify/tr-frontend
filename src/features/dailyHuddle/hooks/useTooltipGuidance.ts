import { useState, RefObject, MutableRefObject, useEffect } from 'react';
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
}

interface UseTooltipGuidanceReturn<T> {
  showGuidance: boolean;
  activeId: T | null;
  tooltipPosition: TooltipPosition;
  position: 'above' | 'below';
  handleInputFocus: (element: HTMLElement, id: T) => void;
  handleInputBlur: () => void;
}

export function useTooltipGuidance<T>({
  tooltipRef,
  guidanceTimeoutRef,
  tooltipId,
  onShowGuidance,
}: UseTooltipGuidanceProps<T>): UseTooltipGuidanceReturn<T> {
  const { activeTooltipId, setActiveTooltipId } = useTooltipContext();
  const [activeId, setActiveId] = useState<T | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const [position, setPosition] = useState<'above' | 'below'>('below');
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);

  const calculateTooltipPosition = (inputRect: DOMRect): { top: number; left: number; position: 'above' | 'below' } => {
    const windowHeight = window.innerHeight;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 200; // Estimate if not available
    
    // Space below the input in the viewport
    const spaceBelow = windowHeight - inputRect.bottom;
    
    // If there's not enough space below, position above
    if (spaceBelow < tooltipHeight + 10) {
      return {
        top: inputRect.top - tooltipHeight - 10,
        left: inputRect.left,
        position: 'above'
      };
    }
    
    // Default: position below
    return {
      top: inputRect.bottom + 5,
      left: inputRect.left,
      position: 'below'
    };
  };

  const handleInputFocus = (element: HTMLElement, id: T) => {
    // Clear any existing timeout to prevent premature hiding
    if (guidanceTimeoutRef.current) {
      clearTimeout(guidanceTimeoutRef.current);
      guidanceTimeoutRef.current = null;
    }
    
    // Small delay to ensure DOM is updated before calculating position
    setTimeout(() => {
      if (element) {
        const rect = element.getBoundingClientRect();
        const position = calculateTooltipPosition(rect);
        
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
    // Immediately hide the guidance window when focus leaves
    setActiveTooltipId(null);
    setActiveElement(null);
  };

  // Add a global focus/blur event listener to ensure tooltips are hidden when focus moves elsewhere
  useEffect(() => {
    const handleDocumentFocusChange = () => {
      // If the active element is not the one we're tracking, hide the tooltip
      if (activeElement && document.activeElement !== activeElement) {
        setActiveTooltipId(null);
      }
    };

    document.addEventListener('focusin', handleDocumentFocusChange);
    
    return () => {
      document.removeEventListener('focusin', handleDocumentFocusChange);
    };
  }, [activeElement, setActiveTooltipId]);

  return {
    showGuidance: activeTooltipId === tooltipId && !!activeElement && document.activeElement === activeElement,
    activeId,
    tooltipPosition,
    position,
    handleInputFocus,
    handleInputBlur,
  };
} 