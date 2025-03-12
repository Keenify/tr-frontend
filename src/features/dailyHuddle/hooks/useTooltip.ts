import { useContext } from 'react';
import { TooltipContext, TooltipContextType } from '../contexts/tooltipContext';

export function useTooltipContext(): TooltipContextType {
  const context = useContext(TooltipContext);

  if (!context) {
    throw new Error('useTooltipContext must be used within a TooltipProvider');
  }
  return context;
} 