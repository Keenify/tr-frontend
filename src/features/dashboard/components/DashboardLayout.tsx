import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Power,
  ThumbsUp,
  ChevronDown,
  Lock,
  Search,
} from "react-feather"; // Import Power, ThumbsUp, and Clock icons from react-feather
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase"; // Import supabase client
import { useNavigate, useParams } from "react-router-dom"; // Removed NavLink as NavLinkWithContextMenu is used
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast"; // Import toast directly
import { useUserAndCompanyData } from "../../../shared/hooks/useUserAndCompanyData";
import { IconUsers, IconTargetArrow, IconDeviceComputerCamera, IconChartArrowsVertical, IconProgressCheck, IconSitemap, IconUserHeart, IconFlagStar, IconClipboardList } from '@tabler/icons-react'; // Changed from Users to IconUsers and added IconChartArrowsVertical and IconProgressCheck
import NavLinkWithContextMenu from '../../../shared/components/NavLinkWithContextMenu';
import { UserProfileEditModal } from '../../../shared/components/UserProfileEditModal';
import { UserData } from '../../../services/useUser';
// Import react-contexify styles
import 'react-contexify/dist/ReactContexify.css';
// Our components handle context menu functionality with proper styling
// and will work with or without the react-contexify library

/**
 * Props for the Layout component.
 * @typedef {Object} LayoutProps
 * @property {React.ReactNode} children - The content to be displayed within the layout.
 * @property {string} activeTab - The currently active tab identifier.
 * @property {function} onTabChange - Callback function to change the active tab.
 * @property {Session} session - The current user session.
 * @property {function} signOut - Function to sign out the user.
 * @property {string} activeSubTab - The currently active subtab identifier.
 * @property {function} onSubTabChange - Callback function to change the active subtab.
 */

/**
 * Defines the available navigation tabs in the dashboard.
 */
const navigationConfig = [
  {
    id: "people",
    label: "People",
    shortForm: "Pe",
    icon: IconUsers,
    isExpandable: true,
    subTabs: [
      { id: "directory", label: "Directory", shortForm: "Di", icon: ThumbsUp },
      { id: "orgChart", label: "Org Chart", shortForm: "OC", icon: ThumbsUp },
      { id: "supplier", label: "Supplier", shortForm: "Su", icon: ThumbsUp },
      { id: "client", label: "Client", shortForm: "Cl", icon: ThumbsUp },
      { id: "hiring", label: "Hiring", shortForm: "Hi", icon: ThumbsUp },
      { id: "calendar", label: "Calendar", shortForm: "Ca", icon: Calendar },
      {
        id: "accountability",
        label: "Accountability",
        shortForm: "Ac",
        icon: ThumbsUp,
      },
      { id: "leaves", label: "Leaves", shortForm: "Le", icon: Calendar },
      { id: "paceForm", label: "PACe Form", shortForm: "PF", icon: ThumbsUp },
      { id: "faceForm", label: "FACe Form", shortForm: "FF", icon: ThumbsUp },
    ],
  },
  {
    id: "sales",
    label: "Sales & Marketing",
    shortForm: "SM",
    icon: IconTargetArrow,
    isExpandable: true,
    subTabs: [
      { id: "salesTab", label: "Sales", shortForm: "Sa", icon: ThumbsUp },
      { id: "product", label: "Product", shortForm: "Pr", icon: ThumbsUp },
      { id: "quotation", label: "Quotation", shortForm: "Qu", icon: ThumbsUp },
      { id: "b2b_order", label: "Order Budget Tracker", shortForm: "OBT", icon: ThumbsUp },
    ],
  },
  {
    id: "meeting",
    label: "Meeting",
    shortForm: "Me",
    icon: IconDeviceComputerCamera,
    isExpandable: true,
    subTabs: [
      {
        id: "dailyHuddle",
        label: "Daily Huddle",
        shortForm: "Dh",
        icon: Calendar,
      },
      {
        id: "weeklyMeeting",
        label: "Weekly Meeting",
        shortForm: "Wm",
        icon: Calendar,
      },
    ],
  },
  {
    id: "financeData",
    label: "Finance & Data",
    shortForm: "FD",
    icon: IconChartArrowsVertical,
    isExpandable: true,
    subTabs: [
      {
        id: "onlineSales",
        label: "Online Sales",
        shortForm: "OS",
        icon: ThumbsUp,
      },
      { id: "financeTab", label: "Finance", shortForm: "Fi", icon: ThumbsUp },
      { id: "power-of-one", label: "Power of One", shortForm: "PO", icon: ThumbsUp },
      { id: "ccc", label: "Cash Conversion Cycle", shortForm: "CC", icon: ThumbsUp }
    ],
  },
  {
    id: "projects",
    label: "Projects",
    shortForm: "Pj",
    icon: IconClipboardList,
    isExpandable: true, // Assuming projects might become expandable
    subTabs: [
      { id: "projects", label: "Projects", shortForm: "Pj", icon: ThumbsUp },
      { id: "creative-management", label: "Creative Management", shortForm: "CM", icon: ThumbsUp },
    ],
  },
  {
    id: "process",
    label: "Process",
    shortForm: "Pr",
    icon: IconProgressCheck,
    isExpandable: true,
    subTabs: [
      { id: "playbook", label: "Playbook", shortForm: "Pb", icon: ThumbsUp },
      { id: "todo", label: "Todo", shortForm: "Td", icon: ThumbsUp },
      { id: "rockefeller-habit-checklist", label: "Rockefeller Habit Checklist", shortForm: "RH", icon: ThumbsUp },
    ],
  },
  {
    id: "technology",
    label: "Technology",
    shortForm: "Te",
    icon: IconSitemap,
    isExpandable: true,
    subTabs: [
      {
        id: "password",
        label: "Password Management",
        shortForm: "Pw",
        icon: ThumbsUp,
      },
      { id: "resources", label: "Resources", shortForm: "Rs", icon: ThumbsUp },
      { id: "sandbox", label: "Sandbox", shortForm: "Sb", icon: ThumbsUp },
      { id: "integration", label: "Integration", shortForm: "In", icon: ThumbsUp },
    ],
  },
  {
    id: "teamHealth",
    label: "Team Health",
    shortForm: "TH",
    icon: IconUserHeart,
    isExpandable: true,
    subTabs: [
      { id: "admin", label: "Admin", shortForm: "Ad", icon: ThumbsUp },
      { id: "award", label: "Award", shortForm: "Aw", icon: ThumbsUp },
      {
        id: "leaderboard",
        label: "Leaderboard",
        shortForm: "Lb",
        icon: ThumbsUp,
      },
      { id: "milestone", label: "Milestone", shortForm: "Mi", icon: ThumbsUp },
      { id: "feedback", label: "Feedback", shortForm: "Fe", icon: ThumbsUp },
      { id: "issue_statement", label: "Parking Lots", shortForm: "Pl", icon: ThumbsUp }
    ],
  },
  {
    id: "thePlan",
    label: "The Plan",
    shortForm: "TP",
    icon: IconFlagStar,
    isExpandable: true,
    subTabs: [
      { id: "theRocks", label: "The Rocks", shortForm: "TR", icon: ThumbsUp },
      { id: "peak", label: "Peak", shortForm: "Pe", icon: ThumbsUp },
      { id: "vivid_vision", label: "Vivid Vision", shortForm: "Vv", icon: ThumbsUp },
      { id: "businessQuadrant", label: "Business Quadrant", shortForm: "Bq", icon: ThumbsUp },
      { id: "strata", label: "7 Strata", shortForm: "7S", icon: ThumbsUp }
    ],
  },
]

/**
 * Type representing the possible tab values.
 */
type TabType = (typeof navigationConfig)[number]["id"];

/**
 * Type representing all possible subtab values.
 */
type ExtractSubTabIds<T extends typeof navigationConfig> = T[number] extends infer Item ? 
    Item extends { subTabs: Array<{ id: infer SubId }> } ? SubId : never 
    : never;
type SubTabType = ExtractSubTabIds<typeof navigationConfig>;

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  session: Session | null;
  signOut: () => void;
  activeSubTab?: SubTabType;
  onSubTabChange?: (subTab: SubTabType) => void;
}

/**
 * Layout component for the dashboard, including sidebar and main content area.
 *
 * This component provides a structured layout for the dashboard, featuring a sidebar
 * with navigation options and a main content area. It utilizes the `useAuth` hook to
 * manage user authentication state and display the user's first name in the profile section.
 *
 * @param {LayoutProps} props - The properties for the Layout component.
 * @returns {JSX.Element} The rendered layout component.
 */
export function DashboardLayout({
  children,
  activeTab,
  session,
  signOut,
  activeSubTab,
  onSubTabChange,
}: LayoutProps) {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const email = session?.user?.email || "user@example.com";

  // State management
  const [activeTabState, setActiveTabState] = useState<TabType>(activeTab);
  const [localActiveSubTab, setLocalActiveSubTab] = useState<
    SubTabType | undefined
  >(activeSubTab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Submenu states
  const [isPeopleSubmenuOpen, setIsPeopleSubmenuOpen] = useState(
    activeTab === "people"
  );
  const [isSalesSubmenuOpen, setIsSalesSubmenuOpen] = useState(
    activeTab === "sales"
  );
  const [isMeetingSubmenuOpen, setIsMeetingSubmenuOpen] = useState(
    activeTab === "meeting"
  );
  const [isFinanceDataSubmenuOpen, setIsFinanceDataSubmenuOpen] = useState(
    activeTab === "financeData"
  );
  const [isProjectsSubmenuOpen, setIsProjectsSubmenuOpen] = useState(
    activeTab === "projects"
  );
  const [isProcessSubmenuOpen, setIsProcessSubmenuOpen] = useState(
    activeTab === "process"
  );
  const [isTechnologySubmenuOpen, setIsTechnologySubmenuOpen] = useState(
    activeTab === "technology"
  );
  const [isTeamHealthSubmenuOpen, setIsTeamHealthSubmenuOpen] = useState(
    activeTab === "teamHealth"
  );
  const [isThePlanSubmenuOpen, setIsThePlanSubmenuOpen] = useState(
    activeTab === "thePlan"
  );

  // Password reset modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // User avatar states
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // User profile edit states
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);

  // Company data
  console.log('🏢 [DashboardLayout] About to call useUserAndCompanyData with ID:', session?.user?.id);
  const { companyInfo, userInfo, error: companyError } = useUserAndCompanyData(
    session?.user?.id || ''
  );
  console.log('📊 [DashboardLayout] useUserAndCompanyData result:', { 
    hasCompanyInfo: !!companyInfo, 
    companyId: companyInfo?.id, 
    hasUserInfo: !!userInfo,
    userRole: userInfo?.role,
    error: !!companyError 
  });
  if (companyError) {
    console.error("Error fetching company data:", companyError);
  }

  // Add new state for search
  const [searchTerm, setSearchTerm] = useState('');

  // Filter navigation items based on search and user role
  const filteredNavigation = useMemo(() => {
    // Log user role for debugging
    console.log("User role:", userInfo?.role);
    
    if (!searchTerm.trim()) {
      // When not searching, filter based on user role
      return navigationConfig.map(tab => {
        // Only show hiring tab for managers
        if (tab.id === 'people') {
          const filteredSubTabs = tab.subTabs.filter(subTab => 
            subTab.id !== 'hiring' || (userInfo?.role && userInfo.role.toLowerCase().includes('manager'))
          );
          return { ...tab, subTabs: filteredSubTabs };
        }
        return tab;
      });
    }

    // When searching, maintain role-based filtering
    const term = searchTerm.toLowerCase();
    return navigationConfig
      .map(tab => {
        // Filter hiring tab based on role first
        const filteredTab = { ...tab };
        if (tab.id === 'people') {
          const filteredSubTabs = tab.subTabs.filter(subTab => 
            subTab.id !== 'hiring' || (userInfo?.role && userInfo.role.toLowerCase().includes('manager'))
          );
          filteredTab.subTabs = filteredSubTabs;
        }
        return filteredTab;
      })
      .filter(tab => {
        // Then apply search filter
        const matchesTab = tab.label.toLowerCase().includes(term);
        const matchesSubTabs = tab.subTabs.some(
          subTab => subTab.label.toLowerCase().includes(term)
        );
        return matchesTab || matchesSubTabs;
      });
  }, [searchTerm, userInfo?.role]);

  // Update states when props change
  useEffect(() => {
    setActiveTabState(activeTab);
    setIsPeopleSubmenuOpen(activeTab === "people");
    setIsSalesSubmenuOpen(activeTab === "sales");
    setIsMeetingSubmenuOpen(activeTab === "meeting");
    setIsFinanceDataSubmenuOpen(activeTab === "financeData");
    setIsProjectsSubmenuOpen(activeTab === "projects");
    setIsProcessSubmenuOpen(activeTab === "process");
    setIsTechnologySubmenuOpen(activeTab === "technology");
    setIsTeamHealthSubmenuOpen(activeTab === "teamHealth");
    setIsThePlanSubmenuOpen(activeTab === "thePlan");
  }, [activeTab]);

  useEffect(() => {
    setLocalActiveSubTab(activeSubTab);
  }, [activeSubTab]);

  // Load user avatar and data
  useEffect(() => {
    // Placeholder for loading user avatar
    // This will be replaced with actual API call later
    if (userInfo?.profile_pic_url) {
      setUserAvatar(userInfo.profile_pic_url);
    }
    
    // Set current user data for profile editing
    if (userInfo) {
      setCurrentUserData(userInfo);
    }
  }, [userInfo]);

  /**
   * Handles tab changes in the navigation.
   */
  const handleTabToggle = (tabId: TabType) => {
    // If this tab is already the active one, just toggle its submenu
    if (activeTabState === tabId) {
      if (navigationConfig.find(t => t.id === tabId)?.isExpandable) {
        switch (tabId) {
          case "people": setIsPeopleSubmenuOpen(prev => !prev); break;
          case "sales": setIsSalesSubmenuOpen(prev => !prev); break;
          case "meeting": setIsMeetingSubmenuOpen(prev => !prev); break;
          case "financeData": setIsFinanceDataSubmenuOpen(prev => !prev); break;
          case "projects": setIsProjectsSubmenuOpen(prev => !prev); break;
          case "process": setIsProcessSubmenuOpen(prev => !prev); break;
          case "technology": setIsTechnologySubmenuOpen(prev => !prev); break;
          case "teamHealth": setIsTeamHealthSubmenuOpen(prev => !prev); break;
          case "thePlan": setIsThePlanSubmenuOpen(prev => !prev); break;
        }
      }
    } else {
      // If a new tab is clicked, set it as active. The useEffect for activeTab will handle opening it.
      // Also, close all other submenus for a cleaner UI when switching main tabs.
      setActiveTabState(tabId);
      setIsPeopleSubmenuOpen(tabId === "people");
      setIsSalesSubmenuOpen(tabId === "sales");
      setIsMeetingSubmenuOpen(tabId === "meeting");
      setIsFinanceDataSubmenuOpen(tabId === "financeData");
      setIsProjectsSubmenuOpen(tabId === "projects");
      setIsProcessSubmenuOpen(tabId === "process");
      setIsTechnologySubmenuOpen(tabId === "technology");
      setIsTeamHealthSubmenuOpen(tabId === "teamHealth");
      setIsThePlanSubmenuOpen(tabId === "thePlan");
      // Note: We don't navigate here. Navigation is handled by sub-tab clicks.
    }
  };

  /**
   * Handles subtab selection and navigation
   */
  const handleSubTabClick = (subTabId: SubTabType, parentTabId: TabType) => {
    setLocalActiveSubTab(subTabId);
    // setActiveTabState(parentTabId); // Not strictly needed if activeTab prop handles it

    // Ensure parent submenu is open
    switch (parentTabId) {
        case "people": setIsPeopleSubmenuOpen(true); break;
        case "sales": setIsSalesSubmenuOpen(true); break;
        case "meeting": setIsMeetingSubmenuOpen(true); break;
        case "financeData": setIsFinanceDataSubmenuOpen(true); break;
        case "projects": setIsProjectsSubmenuOpen(true); break;
        case "process": setIsProcessSubmenuOpen(true); break;
        case "technology": setIsTechnologySubmenuOpen(true); break;
        case "teamHealth": setIsTeamHealthSubmenuOpen(true); break;
        case "thePlan": setIsThePlanSubmenuOpen(true); break;
    }

    if (onSubTabChange) {
      onSubTabChange(subTabId);
    }
    navigate(`/${userId}/${subTabId}`);
  };

  /**
   * Handles user sign out
   */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    signOut();
    navigate("/login");
  };

  // Add this new function to handle password reset
  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setIsResetModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Failed to update password");
      console.error("Error updating password:", error);
    }
  };

  // Handle avatar updates from the profile edit modal
  const handleAvatarUpdated = (avatarUrl: string) => {
    setUserAvatar(avatarUrl);
  };

  // Handle profile data updates
  const handleUserDataUpdated = (updatedData: UserData) => {
    setCurrentUserData(updatedData);
    // Update the userInfo in the hook if possible, or trigger a refresh
    // This will ensure the UI reflects the changes immediately
  };

  const getSubmenuOpenState = (tabId: TabType): boolean => {
    const navItem = filteredNavigation.find(item => item.id === tabId);
    if (searchTerm.trim() && navItem && (navItem as typeof navigationConfig[number] & { _forceOpenDuringSearch?: boolean })._forceOpenDuringSearch) {
        return true;
    }
    switch (tabId) {
      case "people": return isPeopleSubmenuOpen;
      case "sales": return isSalesSubmenuOpen;
      case "meeting": return isMeetingSubmenuOpen;
      case "financeData": return isFinanceDataSubmenuOpen;
      case "projects": return isProjectsSubmenuOpen;
      case "process": return isProcessSubmenuOpen;
      case "technology": return isTechnologySubmenuOpen;
      case "teamHealth": return isTeamHealthSubmenuOpen;
      case "thePlan": return isThePlanSubmenuOpen;
      default: return false;
    }
  };

  /**
   * Main layout structure:
   * 1. Top Bar - Contains company logo and user profile
   * 2. Sidebar - Navigation menu with tabs and subtabs
   * 3. Main Content - Displays the active component
   */
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      {/* Top Bar - Modern gradient background */}
      <div className="flex justify-between items-center bg-gradient-to-r from-rose-400 to-orange-400 text-white border-b border-rose-300 px-6 py-3">
        <div className="flex items-center gap-3">
          {companyInfo?.logo_url ? (
            <img
              src={companyInfo.logo_url}
              alt="Company Logo"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : (
            <span role="img" aria-label="Company Logo" className="text-2xl">
              🏢
            </span>
          )}
          <span className="text-lg font-semibold text-white">
            {companyInfo?.name || "Company Name"}
          </span>
        </div>

        {/* User Profile Section - Updated colors */}
        <div className="flex items-center space-x-4">
          {/* Todo Shortcut Button */}
          <NavLinkWithContextMenu
            to={`/${userId}/todo`}
            onClick={() => {
              setActiveTabState("process");
              setIsProcessSubmenuOpen(true);
              handleSubTabClick("todo" as SubTabType, "process" as TabType);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border border-indigo-500 mr-2 animate-pulse-subtle cursor-pointer"
          >
            <span className="text-sm font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="tracking-wide">Todo</span>
            </span>
          </NavLinkWithContextMenu>

          {/* Daily Huddle Shortcut Button */}
          <NavLinkWithContextMenu
            to={`/${userId}/dailyHuddle`}
            onClick={() => {
              setActiveTabState("meeting");
              setIsMeetingSubmenuOpen(true);
              handleSubTabClick("dailyHuddle" as SubTabType, "meeting" as TabType);
            }}
            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border border-emerald-500 mr-2 cursor-pointer"
          >
            <span className="text-sm font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="tracking-wide">Daily Huddle</span>
            </span>
          </NavLinkWithContextMenu>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-2 border-white/30 hover:border-white/70 transition-all duration-200"
                onClick={() => setIsProfileEditModalOpen(true)}
              >
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="User avatar" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : (
                  <span className="text-white font-semibold text-lg bg-white/10 flex items-center justify-center w-full h-full">
                    {currentUserData?.first_name?.charAt(0)?.toUpperCase() || email.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Edit Profile Button */}
              <button
                onClick={() => setIsProfileEditModalOpen(true)}
                className="absolute -bottom-1 -right-1 h-6 w-6 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center border-2 border-white transition-all duration-200"
                title="Edit Profile"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-white">
                {currentUserData ? `${currentUserData.first_name} ${currentUserData.last_name}` : email}
              </p>
              <div className="flex space-x-4 mt-1">
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-sm text-white/80 hover:text-white flex items-center transition-colors duration-150"
                >
                  <Lock className="w-4 h-4 mr-1" />
                  Reset Password
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-white/80 hover:text-white flex items-center transition-colors duration-150"
                >
                  <Power className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded mb-3"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}


      {/* User Profile Edit Modal */}
      <UserProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        userId={session?.user?.id || ''}
        currentUserData={currentUserData}
        onUserDataUpdated={handleUserDataUpdated}
        userAvatar={userAvatar}
        onAvatarUpdated={handleAvatarUpdated}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Modern styling */}
        <div
          className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white flex-shrink-0 transition-all duration-300 ${
            isSidebarCollapsed ? "w-16" : "w-64"
          } relative`}
        >
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-4 bg-gray-800 border border-gray-700 rounded-full p-1 shadow-lg hover:bg-gray-700 z-50"
            aria-label="Toggle sidebar"
          >
            <svg
              className={`w-4 h-4 text-white transform transition-transform ${
                isSidebarCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex flex-col h-full">
            {/* Search Bar */}
            {!isSidebarCollapsed && (
              <div className="px-4 py-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Menu - Updated scrollbar styling */}
            <nav className="flex-1 space-y-1 px-3 overflow-y-auto 
              scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {filteredNavigation.map((item) => (
                <div key={item.id} className="py-1">
                  <div className="relative">
                    {item.isExpandable ? (
                      <div // Use a simple div for expandable headers
                        onClick={() => handleTabToggle(item.id as TabType)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                          activeTabState === item.id && getSubmenuOpenState(item.id as TabType)
                            ? "bg-indigo-700 text-white shadow-md" // Slightly different style for active and open parent
                            : activeTabState === item.id 
                            ? "bg-indigo-600 text-white shadow-lg" 
                            : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon size={18} className={activeTabState === item.id ? "text-white" : "text-gray-400"} />
                          {!isSidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </span>
                        {!isSidebarCollapsed && (
                          <ChevronDown size={16} className={`transition-transform duration-200 ${
                            getSubmenuOpenState(item.id as TabType) ? "rotate-180" : ""
                          }`} />
                        )}
                      </div>
                    ) : (
                      // For non-expandable items that are direct links (if any in your future config)
                      <NavLinkWithContextMenu
                        to={`/${userId}/${item.id}`}
                        onClick={() => {
                          setActiveTabState(item.id as TabType); 
                          // Close all submenus when a non-expandable main tab is clicked
                          setIsPeopleSubmenuOpen(false);setIsSalesSubmenuOpen(false);setIsMeetingSubmenuOpen(false);setIsFinanceDataSubmenuOpen(false);setIsProjectsSubmenuOpen(false);setIsProcessSubmenuOpen(false);setIsTechnologySubmenuOpen(false);setIsTeamHealthSubmenuOpen(false);setIsThePlanSubmenuOpen(false);
                        }}
                        isActive={activeTabState === item.id}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                          activeTabState === item.id
                            ? "bg-indigo-600 text-white shadow-lg"
                            : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                        }`}
                      >
                         <span className="flex items-center gap-3">
                          <item.icon size={18} className={activeTabState === item.id ? "text-white" : "text-gray-400"} />
                          {!isSidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </span>
                      </NavLinkWithContextMenu>
                    )}

                    {item.isExpandable && !isSidebarCollapsed && (
                       <div className={`mt-1 ml-4 space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${
                        getSubmenuOpenState(item.id as TabType) || (searchTerm.trim() && item.subTabs.some(sub => sub.label.toLowerCase().includes(searchTerm.toLowerCase())))
                          ? "max-h-screen opacity-100 visible"
                          : "max-h-0 opacity-0 invisible"
                      }`}>
                        {item.subTabs.map((subTab) => (
                            <NavLinkWithContextMenu
                              key={subTab.id}
                              to={`/${userId}/${subTab.id}`}
                              onClick={() => handleSubTabClick(subTab.id as SubTabType, item.id as TabType)}
                              isActive={localActiveSubTab === subTab.id}
                              className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                                localActiveSubTab === subTab.id
                                  ? "bg-indigo-500/30 text-white"
                                  : "text-gray-400 hover:bg-gray-700/30 hover:text-white"
                              }`}
                            >
                              <subTab.icon size={16} className={localActiveSubTab === subTab.id ? "text-indigo-400" : "text-gray-500"} />
                              <span className="truncate">{subTab.label}</span>
                            </NavLinkWithContextMenu>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full flex flex-col">
            {/* Content */}
            <div className="bg-white shadow-sm rounded-lg flex-1 p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
