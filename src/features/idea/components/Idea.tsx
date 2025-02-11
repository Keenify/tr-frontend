import { Session } from '@supabase/supabase-js';
import { ReactFlowProvider } from 'reactflow';
// import MindMap from './mindmap/Mindmap.tsx';

export function Idea({ session }: { session: Session }) {
  console.log('Current session:', session);
  return (
    <ReactFlowProvider>
      <div style={{ 
        height: '80vh', 
        width: '100%'
      }}>
        {/* <MindMap /> */}
        Will be here
    </div>
    </ReactFlowProvider>
  );
}

export default Idea;
