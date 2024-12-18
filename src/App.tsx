/**
 * App.tsx
 * Main application component that sets up routing and session management.
 * 
 * This component uses React Router for navigation and lazy loads components
 * for better performance. It also manages user session and onboarding status.
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { useSession } from './shared/hooks/useSession';
import { getUserOnboardingStatus } from './services/userService';
import NotFound from './shared/components/NotFound';
import UserRouteWrapper from './routes/UserRouteWrapper';
import ProtectedRoute from './routes/ProtectedRoute';

// Lazy load components
const AuthForm = lazy(() => import('./features/auth/components/Auth'));
const Onboarding = lazy(() => import('./features/onboarding/components/Onboarding'));

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
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthForm />} />
          <Route
            path="/:userId/dashboard"
            element={
              <UserRouteWrapper session={session}>
                <ProtectedRoute session={session} signOut={signOut} isOnboardingComplete={isOnboardingComplete} />
              </UserRouteWrapper>
            }
          />
          <Route
            path="/:userId/onboarding"
            element={
              <UserRouteWrapper session={session}>
                <Onboarding />
              </UserRouteWrapper>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;