import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeMinimal } from '@supabase/auth-ui-shared';
import { Session } from '@supabase/supabase-js';

import { supabase } from './lib/supabase';
import { Dashboard } from './components/dashboard/Dashboard';

/**
 * The main application component that handles user authentication and displays
 * the appropriate content based on the user's session state.
 *
 * @returns {JSX.Element} The rendered application component.
 */
function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Fetch the current session and set it in the state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Subscribe to authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Signs out the current user and clears the session state.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <>
      <Toaster position="top-right" />
      {!session ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="max-w-md w-full p-4 sm:p-6 bg-white rounded-lg shadow-md">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeMinimal,
                variables: {
                  default: {
                    colors: {
                      brand: '#6366F1',
                      brandAccent: '#4F46E5',
                    },
                  },
                },
              }}
              providers={[]} // Disable all third-party providers
            />
          </div>
        </div>
      ) : (
        <Dashboard session={session} signOut={signOut} />
      )}
    </>
  );
}

export default App;