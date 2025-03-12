import React, { useState, ReactNode } from 'react';
import { TooltipContext } from './tooltipContext';

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  return (
    <TooltipContext.Provider value={{ activeTooltipId, setActiveTooltipId }}>
      {children}
    </TooltipContext.Provider>
  );
} 