import { Session } from '@supabase/supabase-js';

export function Idea({ session }: { session: Session }) {
  console.log('Current session:', session);
  
  return (
    <div style={{ 
      height: '80vh', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h1>Mind Mapping Feature</h1>
      <p>This feature is currently under development.</p>
      <p>Coming soon! 🚀</p>
    </div>
  );
}

export default Idea;
