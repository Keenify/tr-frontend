import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from "../../lib/supabase";

/**
 * Custom hook to manage user session using Supabase authentication.
 * 
 * This hook provides the current session and a function to sign out the user.
 * It listens for authentication state changes and updates the session accordingly.
 * 
 * @returns {Object} An object containing the current session, a signOut function, and a loading state.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch the current session from Supabase and set it in state
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Subscribe to authentication state changes and update session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false); // Ensure loading is false when auth state changes
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

  return { session, signOut, loading };
}