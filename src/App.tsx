import { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

import { Dashboard } from './features/dashboard/components/Dashboard';
import AuthForm from './features/auth/components/AuthComponent';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div>
      <head>
        <title>My App</title>
      </head>
      <body>
        {!session ? (
          <AuthForm />
        ) : (
          <Dashboard session={session} signOut={signOut} />
        )}
        <SpeedInsights />
      </body>
    </div>
  );
}

export default App;