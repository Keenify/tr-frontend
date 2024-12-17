import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSession } from './shared/hooks/useSession';
import { getUserOnboardingStatus, doesUserExist } from './services/userService';
import NotFound from './shared/components/NotFound';

// Lazy load components
const Dashboard = lazy(() => import('./features/dashboard/components/Dashboard').then(module => ({ default: module.Dashboard })));
const AuthForm = lazy(() => import('./features/auth/components/Auth'));
const Onboarding = lazy(() => import('./features/onboarding/components/Onboarding'));

/**
 * App Component
 * 
 * This component sets up the main application routing using React Router.
 * It includes both public and protected routes, ensuring that users are
 * redirected to the login page if they attempt to access protected content
 * without being authenticated.
 * 
 * @returns {JSX.Element} The main application component with routing.
 */
const App: React.FC = () => {
  const { session, signOut } = useSession();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session) {
        try {
          const isOnboardingComplete = await getUserOnboardingStatus(session.user.id);
          setIsOnboardingComplete(isOnboardingComplete);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    checkOnboardingStatus();
  }, [session]);

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Redirect root path to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public Route for Login */}
          <Route path="/login" element={<AuthForm />} />

          {/* Protected Route for User's Unique Dashboard */}
          <Route
            path="/:userId/dashboard"
            element={
              <ProtectedRoute session={session} signOut={signOut} isOnboardingComplete={isOnboardingComplete} />
            }
          />

          {/* Onboarding Route */}
          <Route path="/:userId/onboarding" element={<Onboarding />} />

          {/* 404 Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

const ProtectedRoute: React.FC<{ session: any, signOut: () => void, isOnboardingComplete: boolean | null }> = ({ session, signOut, isOnboardingComplete }) => {
  const navigate = useNavigate();
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const { userId } = useParams<{ userId: string }>();

  useEffect(() => {
    const checkUserExists = async () => {
      if (session) {
        try {
          const exists = await doesUserExist(session.user.id);
          setUserExists(exists);
        } catch (error) {
          console.error('Error checking user existence:', error);
          setUserExists(false);
        }
      }
    };

    checkUserExists();
  }, [session]);

  useEffect(() => {
    if (userExists === false || (session && userId !== session.user.id)) {
      navigate('/404', { replace: true });
    } else if (isOnboardingComplete !== null && session) {
      const userId = session.user.id;
      if (isOnboardingComplete) {
        navigate(`/${userId}/dashboard`, { replace: true });
      } else {
        navigate(`/${userId}/onboarding`, { replace: true });
      }
    }
  }, [isOnboardingComplete, navigate, session, userExists, userId]);

  return userExists === false ? <NotFound /> : session ? <Dashboard session={session} signOut={signOut} /> : <Navigate to="/login" replace />;
};

export default App;