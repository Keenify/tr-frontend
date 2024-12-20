/**
 * App.tsx
 * Main application component that sets up routing and session management.
 * 
 * This component uses React Router for navigation and lazy loads components
 * for better performance. It also manages user session and onboarding status.
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, createBrowserRouter } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';

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

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Navigate to="/login" replace />
    },
    {
      path: "/login",
      element: <AuthForm />
    },
    {
      path: "/:userId/dashboard",
      element: (
        <UserRouteWrapper session={session}>
          <ProtectedRoute session={session} signOut={signOut} isOnboardingComplete={isOnboardingComplete} />
        </UserRouteWrapper>
      )
    },
    {
      path: "/:userId/onboarding",
      element: (
        <UserRouteWrapper session={session}>
          <Onboarding />
        </UserRouteWrapper>
      )
    },
    {
      path: "*",
      element: <NotFound />
    }
  ], {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  });

  return (
    <Router>
      <Suspense fallback={<ClipLoader color="#36d7b7" />}>
        <Routes>
          {router.routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;