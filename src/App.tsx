import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Dashboard } from './features/dashboard/components/Dashboard';
import AuthForm from './features/auth/components/AuthComponent';

function App() {
  /**
   * State to hold the current user session.
   * Initially set to null, indicating no active session.
   */
  const [session, setSession] = useState<Session | null>(null);

  /**
   * useEffect hook to manage session state and listen for authentication state changes.
   * 
   * This effect runs once on component mount and sets up a listener for authentication state changes.
   * It fetches the current session and updates the session state accordingly.
   * 
   * The listener updates the session state whenever the authentication state changes (e.g., user logs in or out).
   * The cleanup function unsubscribes from the authentication state changes when the component unmounts.
   */
  useEffect(() => {
    // Function to fetch the current session from Supabase
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    // Fetch the current session
    fetchSession();

    // Set up a listener for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup function to unsubscribe from the authentication state changes
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Function to sign out the user.
   * 
   * This function calls the Supabase signOut method to log the user out and then
   * sets the session state to null, indicating no active session.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    /**
     * This JSX fragment conditionally renders either the AuthForm or the Dashboard component
     * based on the presence of a user session.
     * 
     * If there is no active session (i.e., the user is not logged in), the AuthForm component
     * is rendered, allowing the user to log in.
     * 
     * If there is an active session (i.e., the user is logged in), the Dashboard component
     * is rendered, providing the user with access to the application's main features.
     */
    <>
      {!session ? (
        // Render the authentication form when there is no active session
        <AuthForm />
      ) : (
        // Render the dashboard when there is an active session
        <Dashboard session={session} signOut={signOut} />
      )}
    </>
  );
}

export default App;