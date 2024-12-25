import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { doesUserExist } from '../services/userService';
import NotFound from '../shared/components/NotFound';
import { Dashboard } from '../features/dashboard/components/Dashboard';

/**
 * Props for the ProtectedRoute component.
 * 
 * @interface ProtectedRouteProps
 * @property {any} session - The current user session.
 * @property {() => void} signOut - Function to sign out the user.
 * @property {boolean | null} isOnboardingComplete - Indicates if the onboarding process is complete.
 */
interface ProtectedRouteProps {
  session: any;
  signOut: () => void;
  isOnboardingComplete: boolean | null;
}

/**
 * ProtectedRoute component ensures that only authenticated users with valid sessions
 * and completed onboarding can access certain routes. It redirects users to the appropriate
 * page based on their session status and onboarding completion.
 * 
 * @param {ProtectedRouteProps} props - The component props.
 * @returns {JSX.Element} - The rendered component.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, signOut, isOnboardingComplete }) => {
  const navigate = useNavigate();
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const { userId } = useParams<{ userId: string }>();

  /**
   * Validates the user by checking if the session is valid and if the user exists.
   * Updates the userExists state based on the validation result.
   */
  useEffect(() => {
    const validateUser = async () => {
      if (session) {
        try {
          const exists = await doesUserExist(session.user.id);
          setUserExists(exists);

          if (userId !== session.user.id || !exists) {
            setUserExists(false);
          }
        } catch (error) {
          console.error('Error validating user:', error);
          setUserExists(false);
        }
      }
    };

    validateUser();
  }, [session, userId]);

  /**
   * Redirects the user based on their onboarding completion status.
   * Navigates to the dashboard if onboarding is complete, otherwise to the onboarding page.
   */
  useEffect(() => {
    if (userExists && isOnboardingComplete !== null && session) {
      if (isOnboardingComplete) {
        console.log('Navigating to dashboard');
        navigate(`/${session.user.id}/dashboard`, { replace: true });
      } else {
        console.log('Navigating to onboarding');
        navigate(`/${session.user.id}/onboarding`, { replace: true });
      }
    }
  }, [isOnboardingComplete, navigate, session, userExists]);

  if (userExists === false) {
    console.log('Remarks: User does not exist or session is invalid, showing NotFound');
    return <NotFound />;
  }

  return session ? (
    <Dashboard session={session} signOut={() => {
      console.log('Signing out');
      signOut();
      navigate('/login', { replace: true });
    }} />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;