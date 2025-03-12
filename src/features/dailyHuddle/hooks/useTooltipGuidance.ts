import { useState, RefObject, MutableRefObject } from 'react';
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
  setShowGuidance: (show: boolean) => void;
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
    
    const rect = element.getBoundingClientRect();
    const position = calculateTooltipPosition(rect);
    
    setTooltipPosition({
      top: position.top,
      left: position.left
    });
    setPosition(position.position);
    setActiveId(id);
    setActiveTooltipId(tooltipId);

    if (onShowGuidance) {
      onShowGuidance(id);
    }
  };
  
  const handleInputBlur = () => {
    // Small delay to allow clicking on the guidance without it disappearing
    guidanceTimeoutRef.current = setTimeout(() => {
      setActiveTooltipId(null);
    }, 200);
  };

  return {
    showGuidance: activeTooltipId === tooltipId,
    activeId,
    tooltipPosition,
    position,
    handleInputFocus,
    handleInputBlur,
    setShowGuidance: (show: boolean) => setActiveTooltipId(show ? tooltipId : null),
  };
} 