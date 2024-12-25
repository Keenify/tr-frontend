/**
 * App.tsx
 * Main application component that sets up routing and session management.
 * 
 * This component uses React Router for navigation and lazy loads components
 * for better performance. It also manages user session and onboarding status.
 * 
 * Key Features:
 * - Utilizes React Router for client-side routing.
 * - Implements lazy loading for performance optimization.
 * - Manages user session and onboarding status.
 * - Provides protected routes for authenticated users.
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';

import { useSession } from './shared/hooks/useSession';
import { getUserOnboardingStatus } from './services/userService';
import NotFound from './shared/components/NotFound';
import UserRouteWrapper from './routes/UserRouteWrapper';
import ProtectedRoute from './routes/ProtectedRoute';
import EditorProtectedRoute from './routes/EditorProtectedRoute';

// Lazy load components for better performance
const AuthForm = lazy(() => import('./features/auth/components/Auth'));
const Onboarding = lazy(() => import('./features/onboarding/components/Onboarding'));

/**
 * Main App component
 * 
 * @returns {JSX.Element} The main application component with routing and session management.
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

  const routes = [
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
        // session data is passed to the UserRouteWrapper component
        <UserRouteWrapper session={session}>
          <ProtectedRoute session={session} signOut={signOut} isOnboardingComplete={isOnboardingComplete} />
        </UserRouteWrapper>
      )
    },
    {
      // session data and document tab id is passed to the EditorProtectedRoute component
      path: "/:userId/dashboard/:subjectId/editor",
      element: (
        <UserRouteWrapper session={session}>
          <EditorProtectedRoute session={session} />
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
  ];

  return (
    <Router>
      <Suspense fallback={<ClipLoader color="#36d7b7" />}>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;