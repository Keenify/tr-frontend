import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Session } from '@supabase/supabase-js';

import { supabase } from './lib/supabase';
import { Dashboard } from './components/dashboard/Dashboard';

/**
 * The main application component that manages user authentication and renders
 * the appropriate content based on the user's session state.
 *
 * @component
 * @returns {JSX.Element} The rendered application component.
 */
function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    /**
     * Fetches the current session and updates the session state.
     */
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();

    /**
     * Subscribes to authentication state changes and updates the session state.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      {!session ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="max-w-md w-full p-4 sm:p-6 bg-white rounded-lg shadow-md">
            <Auth
              supabaseClient={supabase}
              showLinks={true}
              appearance={{
                theme: ThemeSupa,
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
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                  },
                },
              }}
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