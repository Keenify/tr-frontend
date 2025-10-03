import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Hooks for session
import { useSession } from "./shared/hooks/useSession";
import FloatingMusicPlayer from "./shared/components/FloatingMusicPlayer";
import { UserDataProvider } from "./shared/contexts/UserDataContext";

// Not Found
const NotFound = lazy(() => import("./shared/components/NotFound")); 

// Dashboard Layout
import { DashboardLayout } from "./features/dashboard/components/DashboardLayout";
import OrgChartPage from "./features/directory/components/OrgChart/OrgChartPage";

// Import all components
import AuthForm from "./features/auth/components/Auth";
import Home from "./features/home/components/Home";
import Vision from "./features/home/components/Vision";
import Editor from "./features/content/components/Editor";
import DirectoryPage from "./features/directory/routes/DirectoryPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import DailyHuddle from "./features/dailyHuddle/components/DailyHuddle";
import Sales from "./features/sales/components/Sales";
import Quotation from "./features/quotation/components/Quotation";
import Product from "./features/product/components/Product";
import Resources from "./features/resources/components/Resources";
import Projects from "./features/projects/components/Projects";
import CreativeManagement from "./features/projects/components/CreativeManagement";
import Supplier from "./features/people/supplier/components/Supplier";
import Client from "./features/people/client/components/Client";
import Hiring from "./features/people/hiring/components/Hiring";
import PublicJobDetails from "./features/people/hiring/components/PublicJobDetails";
import JobPreview from "./features/people/hiring/components/JobPreview";
import PublicJDPage from "./shared/components/PublicJDPage";
import Idea from "./features/idea/components/Idea";
import Feedback from "./features/people/feedback/components/Feedback";
import AnonymousFeedbackPage from "./features/people/feedback/components/AnonymousFeedbackPage";
import Finance from "./features/finance/components/dashboard/Finance";
import PowerOfOne from "./features/power_of_one/components/PowerOfOne";
import { useUserAndCompanyData } from "./shared/hooks/useUserAndCompanyData";
import Playbook from "./features/playbook/components/Playbook";
import Calendar from "./features/people/calendar/components/Calendar";
import Accountability from "./features/people/accountability_matrix/components/Accountability";
import Leaves from "./features/people/leaves/components/Leaves";
import OnlineSales from "./features/finance/components/dashboard/OnlineSales";
import Password from "./features/admin/components/Password";
import Todo from "./features/todos/components/Todos";
import Admin from "./features/admin/components/Admin";
import RockefellerHabitChecklist from "./features/rockefeller_habit_checklist/components/RockefellerHabitChecklist";
import Milestone from "./features/teamHealth/components/Milestone";
import Award from "./features/teamHealth/components/Award";
import Leaderboard from "./features/teamHealth/components/Leaderboard";
import { IssueStatementPage } from './features/teamHealth/pages/IssueStatementPage';
import Integration from "./features/integration/components/Integration";
import GoogleOAuthCallback from "./features/integration/components/GoogleOAuthCallback";
import BusinessQuadrant from "./features/company/components/BusinessQuadrant";
import CashAccelerationStrategies from "./features/cash/components/CashAccelerationStrategies";
import TheRocksMain from "./features/theRocks/components/main";
import PaceForm from "./features/form/components/PaceForm";
import FaceForm from "./features/form/components/FaceForm";
import StrataPage from "./features/strata/page";
import WeeklyMeeting from "./features/weeklyMeeting/components/WeeklyMeeting";


// Import the public daily huddle component
import PublicDailyHuddle from "./features/dailyHuddle/components/PublicDailyHuddle";
import ResetPassword from "./features/auth/components/ResetPassword";
// Create a client
const queryClient = new QueryClient();

// PowerOfOne wrapper component that provides companyId
const PowerOfOneWithCompany: React.FC<{ userId: string }> = ({ userId }) => {
  const { companyInfo } = useUserAndCompanyData(userId);
  
  if (!companyInfo?.id) {
    return <div>Loading company information...</div>;
  }
  
  return <PowerOfOne userId={userId} companyId={companyInfo.id} />;
};

const App: React.FC = () => {
  const { session, signOut, loading } = useSession();

  return (
    <UserDataProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<ClipLoader color="#36d7b7" />}>
          {session && <FloatingMusicPlayer />}
          
          {/* Show loading spinner while session is being determined */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <ClipLoader color="#36d7b7" />
            </div>
          ) : (
          <Routes>
            {/* Default Redirect to User-Specific Route */}
            <Route
              path="/"
              element={
                <Navigate
                  to={session ? `/${session.user.id}/vivid_vision` : "/login"}
                  replace
                />
              }
            />


            {/* Public Routes */}
            <Route path="/login" element={<AuthForm />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/anonymous_feedback"
              element={<AnonymousFeedbackPage />}
            />
            {/* Public Daily Huddle routes */}
            <Route path="/daily_huddle/:userid" element={<PublicDailyHuddle />} />
            
            {/* Public Job Details route */}
            <Route path="/jobs/:jobId" element={<PublicJobDetails />} />
            {/* Job Preview route */}
            <Route path="/job-preview" element={<JobPreview />} />
            {/* Public JD Page route */}
            <Route path="/jd/:companyId" element={<PublicJDPage />} />

            {/* Protected Routes */}
            <>
                <Route
                  path="/:userId/directory"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="directory"
                          onSubTabChange={() => {}}
                        >
                          <DirectoryPage session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/orgChart"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="orgChart"
                          onSubTabChange={() => {}}
                        >
                          {session && <OrgChartPage session={session} />}
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/supplier"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="supplier"
                          onSubTabChange={() => {}}
                        >
                          <Supplier session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/client"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="client"
                          onSubTabChange={() => {}}
                        >
                          <Client session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/steps/:tabId/editor"
                  element={<Editor />}
                />
                <Route
                  path="/:userId/dailyhuddle"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="meeting"
                          activeSubTab="dailyHuddle"
                          onSubTabChange={() => {}}
                        >
                          <DailyHuddle session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/weeklyMeeting"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="meeting"
                          activeSubTab="weeklyMeeting"
                          onSubTabChange={() => {}}
                        >
                          <WeeklyMeeting session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/salesTab"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="sales"
                          activeSubTab="salesTab"
                          onSubTabChange={() => {}}
                        >
                          <Sales session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/quotation"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="sales"
                          activeSubTab="quotation"
                          onSubTabChange={() => {}}
                        >
                          <Quotation session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/product"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="sales"
                          activeSubTab="product"
                          onSubTabChange={() => {}}
                        >
                          <Product session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/resources"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="technology"
                          activeSubTab="resources"
                          onSubTabChange={() => {}}
                        >
                          <Resources session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/projects"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="projects"
                          activeSubTab="projects"
                          onSubTabChange={() => {}}
                        >
                          <Projects session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/creative-management"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="projects"
                          activeSubTab="creative-management"
                          onSubTabChange={() => {}}
                        >
                          <CreativeManagement session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/hiring"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="hiring"
                          onSubTabChange={() => {}}
                        >
                          <Hiring session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/accountability"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="accountability"
                          onSubTabChange={() => {}}
                        >
                          <Accountability session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/leaves"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="leaves"
                          onSubTabChange={() => {}}
                        >
                          <Leaves session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/password"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="technology"
                          activeSubTab="password"
                          onSubTabChange={() => {}}
                        >
                          <Password session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/todo"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="process"
                          activeSubTab="todo"
                          onSubTabChange={() => {}}
                        >
                          <Todo session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/sandbox"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="technology"
                          activeSubTab="sandbox"
                          onSubTabChange={() => {}}
                        >
                          <Idea session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/feedback"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="teamHealth"
                          activeSubTab="feedback"
                          onSubTabChange={() => {}}
                        >
                          <Feedback session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/financeTab"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="financeData"
                          activeSubTab="financeTab"
                          onSubTabChange={() => {}}
                        >
                          <Finance session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/power-of-one"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="financeData"
                          activeSubTab="power-of-one"
                          onSubTabChange={() => {}}
                        >
                          <PowerOfOneWithCompany userId={session?.user.id || ''} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/playbook"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="process"
                          activeSubTab="playbook"
                          onSubTabChange={() => {}}
                        >
                          <Playbook session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/rockefeller-habit-checklist"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="process"
                          activeSubTab="rockefeller-habit-checklist"
                          onSubTabChange={() => {}}
                        >
                          <RockefellerHabitChecklist session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/calendar"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="calendar"
                          onSubTabChange={() => {}}
                        >
                          <Calendar session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/onlineSales"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="financeData"
                          activeSubTab="onlineSales"
                          onSubTabChange={() => {}}
                        >
                          <OnlineSales session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/sandbox/new"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="technology"
                          activeSubTab="sandbox"
                          onSubTabChange={() => {}}
                        >
                          <Idea session={session} key="new" />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/sandbox/:mindmapId"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="technology"
                          activeSubTab="sandbox"
                          onSubTabChange={() => {}}
                        >
                          <Idea session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/admin"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="teamHealth"
                          activeSubTab="admin"
                          onSubTabChange={() => {}}
                        >
                          <Admin session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/award"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="teamHealth"
                          activeSubTab="award"
                          onSubTabChange={() => {}}
                        >
                          <Award session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/leaderboard"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="teamHealth"
                          activeSubTab="leaderboard"
                          onSubTabChange={() => {}}
                        >
                          <Leaderboard session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/milestone"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="teamHealth"
                          activeSubTab="milestone"
                          onSubTabChange={() => {}}
                        >
                          <Milestone session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/issue_statement"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="teamHealth"
                          activeSubTab="issue_statement"
                          onSubTabChange={() => {}}
                        >
                          <IssueStatementPage session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/peak"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="thePlan"
                          activeSubTab="peak"
                          onSubTabChange={() => {}}
                        >
                          <Home session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/vivid_vision"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="thePlan"
                          activeSubTab="vivid_vision"
                          onSubTabChange={() => {}}
                        >
                          <Vision session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/integration"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="technology"
                          activeSubTab="integration"
                          onSubTabChange={() => {}}
                        >
                          <Integration session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/businessQuadrant"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="thePlan"
                          activeSubTab="businessQuadrant"
                          onSubTabChange={() => {}}
                        >
                          <BusinessQuadrant session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/strata"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="thePlan"
                          activeSubTab="strata"
                          onSubTabChange={() => {}}
                        >
                          <StrataPage session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/ccc"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="financeData"
                          activeSubTab="ccc"
                          onSubTabChange={() => {}}
                        >
                          <CashAccelerationStrategies session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/theRocks"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="thePlan"
                          activeSubTab="theRocks"
                          onSubTabChange={() => {}}
                        >
                          <TheRocksMain session={session} />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/google/oauth/callback"
                  element={<GoogleOAuthCallback session={session} />}
                />
                <Route
                  path="/:userId/paceForm"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="paceForm"
                          onSubTabChange={() => {}}
                        >
                          <PaceForm />
                        </DashboardLayout>
                      }
                    />
                  }
                />
                <Route
                  path="/:userId/faceForm"
                  element={
                    <ProtectedRoute
                      session={session}
                      element={
                        <DashboardLayout
                          session={session}
                          signOut={signOut}
                          activeTab="people"
                          activeSubTab="faceForm"
                          onSubTabChange={() => {}}
                        >
                          <FaceForm />
                        </DashboardLayout>
                      }
                    />
                  }
                />
              </>

            {/* Redirect base user ID route to vivid_vision - MUST be after all specific routes */}
            <Route
              path="/:userId"
              element={
                session ? (
                  <Navigate to={`/${session.user.id}/vivid_vision`} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Catch-all for anything else */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          )}
        </Suspense>
      </Router>
      </QueryClientProvider>
    </UserDataProvider>
  );
};

export default App;
