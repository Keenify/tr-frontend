import { Session } from '@supabase/supabase-js';
import { memo } from 'react';
import FlowWrapper from './FlowWrapper';


export const Idea = memo(({ session }: { session: Session }) => {
  console.log('Current session:', session);
  return (
    <div className="w-full h-[80vh]">
      <FlowWrapper />
    </div>
  );
});

export default Idea;
