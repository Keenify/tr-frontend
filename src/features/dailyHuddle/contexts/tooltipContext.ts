import { createContext } from 'react';

export interface TooltipContextType {
  activeTooltipId: string | null;
  setActiveTooltipId: (id: string | null) => void;
}

export const TooltipContext = createContext<TooltipContextType>({
  activeTooltipId: null,
  setActiveTooltipId: () => {},
}); 