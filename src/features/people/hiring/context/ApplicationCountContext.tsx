import { createContext } from 'react';

// Application count context
export const ApplicationCountContext = createContext<{
  counts: { preHire: number; interview: number; postInterview: number };
  updateCount: (key: 'preHire' | 'interview' | 'postInterview', count: number) => void;
}>({
  counts: { preHire: 0, interview: 0, postInterview: 0 },
  updateCount: () => {}
}); 