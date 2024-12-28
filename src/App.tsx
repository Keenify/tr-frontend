import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';

// Hooks for session
import { useSession } from './shared/hooks/useSession';

// Not Found
import NotFound from './shared/components/NotFound';

// Routes
import ProtectedRoute from './routes/ProtectedRoute';
import UserRouteWrapper from './routes/UserRouteWrapper';

// Dashboard Layout
import { DashboardLayout } from './features/dashboard/components/DashboardLayout';

// Lazy load all components
const AuthForm = lazy(() => import('./features/auth/components/Auth'));
const Home = lazy(() => import('./features/home/components/Home'));
const Content = lazy(() => import('./features/content/components/Content'));
const SubjectDetail = lazy(() => import('./features/content/components/SubjectDetail'));

const App: React.FC = () => {
  const { session, signOut } = useSession();

  return (
    <Router>
      <Suspense fallback={<ClipLoader color="#36d7b7" />}>
        <Routes>
          {/* Default Redirect to User-Specific Route */}
          <Route path="/" element={<Navigate to={session ? `/${session.user.id}` : "/login"} replace />} />

          {/* Public Routes */}
          <Route path="/login" element={<AuthForm />} />

          {/* Protected Area */}
          <Route element={session ? <ProtectedRoute session={session} /> : <Navigate to="/login" replace />}>
            <Route path=":userId/*" element={session ? <UserRouteWrapper session={session} /> : <Navigate to="/login" replace />}>
              <Route
                path="*"
                element={
                  session ? (
                    <DashboardLayout session={session} signOut={signOut} activeTab="home" onTabChange={() => {}}>
                      <Routes>
                        <Route index element={<Home session={session} />} />
                        <Route path="content" element={<Content session={session} />} />
                        <Route path="content/:subjectId" element={<SubjectDetail />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </DashboardLayout>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Route>
          </Route>

          {/* Catch-all for anything else */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;