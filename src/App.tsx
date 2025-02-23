import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Hooks for session
import { useSession } from './shared/hooks/useSession';

// Not Found
const NotFound = lazy(() => import('./shared/components/NotFound'));

// Dashboard Layout
import { DashboardLayout } from './features/dashboard/components/DashboardLayout';
import OrgChartPage from './features/directory/components/OrgChart/OrgChartPage';

// Import all components
import AuthForm from './features/auth/components/Auth';
import Home from './features/home/components/Home';
import Editor from './features/content/components/Editor';
import DirectoryPage from './features/directory/routes/DirectoryPage';
import ProtectedRoute from './routes/ProtectedRoute';
import DailyHuddle from './features/dailyHuddle/components/DailyHuddle';
import Sales from './features/sales/components/Sales';
import Quotation from './features/quotation/components/Quotation';
import Product from './features/product/components/Product';
import Resources from './features/resources/components/Resources';
import Projects from './features/projects/components/Projects';
import Supplier from './features/people/supplier/components/Supplier';
import Client from './features/people/client/components/Client';
import Admin from './features/admin/components/Admin';
import Hiring from './features/people/hiring/components/Hiring';
import Idea from './features/idea/components/Idea';
import Feedback from './features/people/feedback/components/Feedback';
import AnonymousFeedbackPage from './features/people/feedback/components/AnonymousFeedbackPage';
import Finance from './features/finance/components/Finance';
import Playbook from './features/playbook/components/Playbook';
import Calendar from './features/people/calendar/components/Calendar';
import AccountabilityMatrix from './features/people/accountability_matrix/components/AccountabilityMatrix';
import Leaves from './features/people/leaves/components/Leaves';

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  const { session, signOut } = useSession();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Router future={{ 
        v7_startTransition: true,
        v7_relativeSplatPath: true 
      }}>
        <Suspense fallback={<ClipLoader color="#36d7b7" />}>
          <Routes>
            {/* Default Redirect to User-Specific Route */}
            <Route path="/" element={<Navigate to={session ? `/${session.user.id}/home` : "/login"} replace />} />

            {/* Public Routes */}
            <Route path="/login" element={<AuthForm />} />
            <Route path="/anonymous_feedback" element={<AnonymousFeedbackPage />} />

            {/* Protected Routes */}
            {session && (
              <>
                <Route path="/:userId" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="home" onTabChange={() => {}}><Home session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/people" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="directory" onTabChange={() => {}}><DirectoryPage session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/org_chart" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="orgChart" onTabChange={() => {}}><OrgChartPage session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/supplier" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="supplier" onTabChange={() => {}}><Supplier session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/client" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="client" onTabChange={() => {}}><Client session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/steps/:tabId/editor" element={<Editor />} />
                <Route path="/:userId/dailyhuddle" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="dailyHuddle" onTabChange={() => { }}><DailyHuddle session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/sales" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="sales" onTabChange={() => { }}><Sales session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/quotation" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="quotation" onTabChange={() => { }}><Quotation session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/product" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="product" onTabChange={() => { }}><Product session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/resources" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="resources" onTabChange={() => { }}><Resources session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/projects" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="projects" onTabChange={() => { }}><Projects session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/admin" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="admin" onTabChange={() => { }}><Admin session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/hiring" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="hiring" onTabChange={() => { }}><Hiring session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/accountability" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="accountability" onTabChange={() => { }}><AccountabilityMatrix session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/leaves" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="leaves" onTabChange={() => { }}><Leaves session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/sandbox/new" element={
                  <ProtectedRoute session={session} element={
                    <DashboardLayout session={session} signOut={signOut} activeTab="sandbox" onTabChange={() => {}}>
                      <Idea session={session} key="new" />
                    </DashboardLayout>
                  } />
                } />
                <Route path="/:userId/sandbox/:mindmapId" element={
                  <ProtectedRoute session={session} element={
                    <DashboardLayout session={session} signOut={signOut} activeTab="sandbox" onTabChange={() => {}}>
                      <Idea session={session} />
                    </DashboardLayout>
                  } />
                } />
                <Route path="/:userId/sandbox" element={
                  <ProtectedRoute session={session} element={
                    <DashboardLayout session={session} signOut={signOut} activeTab="sandbox" onTabChange={() => {}}>
                      <Idea session={session} />
                    </DashboardLayout>
                  } />
                } />
                <Route path="/:userId/feedback" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="feedback" onTabChange={() => { }}><Feedback session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/finance" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="finance" onTabChange={() => { }}><Finance session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/playbook" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="playbook" onTabChange={() => { }}><Playbook session={session} /></DashboardLayout>} />} />
                <Route path="/:userId/calendar" element={<ProtectedRoute session={session} element={<DashboardLayout session={session} signOut={signOut} activeTab="people" activeSubTab="calendar" onTabChange={() => {}}><Calendar session={session} /></DashboardLayout>} />} />
              </>
            )}

            {/* Catch-all for anything else */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
};

export default App;