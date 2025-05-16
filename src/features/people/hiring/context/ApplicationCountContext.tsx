import { createContext } from 'react';

// Application count context
export const ApplicationCountContext = createContext<{
  counts: { preHire: number; interview: number; postInterview: number; rejected: number };
  updateCount: (key: 'preHire' | 'interview' | 'postInterview' | 'rejected', count: number) => void;
  refreshAllCounts: () => Promise<void>;
}>({
  counts: { preHire: 0, interview: 0, postInterview: 0, rejected: 0 },
  updateCount: () => {},
  refreshAllCounts: async () => {}
}); 