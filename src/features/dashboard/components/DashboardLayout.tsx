import React, { useState } from 'react';
import { Calendar, Power, ThumbsUp, ChevronDown, ChevronRight, Shield, Home, Lock } from 'react-feather'; // Import Power, ThumbsUp, and Clock icons from react-feather
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase'; // Import supabase client
import { useNavigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast'; // Import toast directly

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
 * @constant {Object[]}
 */
const navigationConfig = [
  { id: 'home', label: 'Home', shortForm: 'H', icon: Home, isExpandable: false },
  { id: 'admin', label: 'Admin', shortForm: 'A', icon: Shield, isExpandable: false },
  { id: 'resources', label: 'Resources', shortForm: 'R', icon: ThumbsUp, isExpandable: false },
  { id: 'people', label: 'People', shortForm: 'Pe', icon: ThumbsUp, isExpandable: true,
    subTabs: [
      { id: 'directory', label: 'Directory', shortForm: 'Di', icon: ThumbsUp },
      { id: 'orgChart', label: 'Org Chart', shortForm: 'OC', icon: ThumbsUp },
      { id: 'supplier', label: 'Supplier', shortForm: 'Su', icon: ThumbsUp },
      { id: 'client', label: 'Client', shortForm: 'Cl', icon: ThumbsUp },
      { id: 'hiring', label: 'Hiring', shortForm: 'Hi', icon: ThumbsUp },
      { id: 'feedback', label: 'Feedback', shortForm: 'F', icon: ThumbsUp },
      { id: 'calendar', label: 'Calendar', shortForm: 'Ca', icon: Calendar },
      { id: 'accountability', label: 'Accountability', shortForm: 'Ac', icon: ThumbsUp },
    ]
  },
  { id: 'projects', label: 'Projects', shortForm: 'P', icon: ThumbsUp, isExpandable: false },
  { id: 'dailyHuddle', label: 'Daily Huddle', shortForm: 'Dh', icon: Calendar, isExpandable: false },
  { id: 'sales', label: 'Sales', shortForm: 'S', icon: ThumbsUp, isExpandable: false },
  { id: 'finance', label: 'Finance', shortForm: 'Fi', icon: ThumbsUp, isExpandable: false },
  { id: 'quotation', label: 'Quotation', shortForm: 'Qu', icon: ThumbsUp, isExpandable: false },
  { id: 'product', label: 'Product', shortForm: 'P', icon: ThumbsUp, isExpandable: false },
  { id: 'playbook', label: 'Playbook', shortForm: 'Pb', icon: ThumbsUp, isExpandable: false },
  { id: 'idea', label: 'Idea', shortForm: 'I', icon: ThumbsUp, isExpandable: false },
] as const;

/**
 * Type representing the possible tab values.
 * @typedef {string} TabType
 */
type TabType = typeof navigationConfig[number]['id'];

type SubTabType = 'directory' | 'orgChart' | 'supplier' | 'client' | 'hiring' | 'feedback' | 'calendar' | 'accountability';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  session: Session;
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
export function DashboardLayout({ children, activeTab, onTabChange, session, signOut, activeSubTab, onSubTabChange }: LayoutProps) {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const email = session.user.email || 'user@example.com';
  const [activeTabState, setActiveTabState] = React.useState<TabType>(activeTab);
  const [isPeopleSubmenuOpen, setIsPeopleSubmenuOpen] = React.useState(activeTab === 'people');
  const [localActiveSubTab, setLocalActiveSubTab] = useState<SubTabType | undefined>(activeSubTab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update state when props change
  React.useEffect(() => {
    setActiveTabState(activeTab);
    setIsPeopleSubmenuOpen(activeTab === 'people');
  }, [activeTab]);

  React.useEffect(() => {
    setLocalActiveSubTab(activeSubTab);
  }, [activeSubTab]);

  /**
   * Handles the sign out process for the user.
   * - Signs out from Supabase
   * - Calls the parent signOut function
   * - Navigates to login page
   * @async
   * @function handleSignOut
   */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    signOut(); // Call the passed signOut function to update the state
    navigate('/login');
  };

  /**
   * Handles tab changes in the navigation.
   * - Updates the active tab state
   * - Toggles people submenu if applicable
   * - Updates URL based on selected tab
   * @function handleTabChange
   * @param {TabType} tab - The selected tab
   */
  const handleTabChange = (tab: TabType) => {
    setActiveTabState(tab);
    if (tab === 'people') {
      setIsPeopleSubmenuOpen(!isPeopleSubmenuOpen);
      return;
    }
    onTabChange(tab);
    if (tab === 'home') {
      navigate(`/${userId}`);
    } else {
      navigate(`/${userId}/${tab}`);
    }
  };

  /**
   * Handles subtab selection within the People section.
   * - Updates local subtab state
   * - Calls parent subtab change handler
   * - Updates URL based on selected subtab
   * @function handleSubTabClick
   * @param {'directory' | 'orgChart'} subTab - The selected subtab
   */
  const handleSubTabClick = (subTab: SubTabType) => {
    setLocalActiveSubTab(subTab);
    if (onSubTabChange) {
      onSubTabChange(subTab);
    }
    setActiveTabState('people');
    
    if (subTab === 'directory') {
      navigate(`/${userId}/people`);
    } else if (subTab === 'orgChart') {
      navigate(`/${userId}/org_chart`);
    } else if (subTab === 'supplier') {
      navigate(`/${userId}/supplier`);
    } else if (subTab === 'client') {
      navigate(`/${userId}/client`);
    } else if (subTab === 'hiring') {
      navigate(`/${userId}/hiring`);
    } else if (subTab === 'feedback') {
      navigate(`/${userId}/feedback`);
    } else if (subTab === 'calendar') {
      navigate(`/${userId}/calendar`);
    } else if (subTab === 'accountability') {
      navigate(`/${userId}/accountability`);
    }
  };

  // Add this new function to handle password reset
  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setIsResetModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update password');
      console.error('Error updating password:', error);
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
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Top Bar Section */}
      <div className="flex justify-between items-center bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center">
          <span role="img" aria-label="Company Logo" className="text-2xl">🏢</span>
        </div>
        {/* Enhanced User Profile Section */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-lg">
                {email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-900">{email}</p>
              <div className="flex space-x-4 mt-1">
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-sm text-gray-600 hover:text-indigo-600 flex items-center transition-colors duration-150"
                >
                  <Lock className="w-4 h-4 mr-1" />
                  Reset Password
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-indigo-600 flex items-center transition-colors duration-150"
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
                  setNewPassword('');
                  setConfirmPassword('');
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation Section */}
        <div className={`bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } relative`}>
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-4 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
            aria-label="Toggle sidebar"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex flex-col h-full">
            <div className="flex-1 py-6 px-4">
              <div className="space-y-1">
                {navigationConfig.map((tab) => (
                  <React.Fragment key={tab.id}>
                    <button
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTabState === tab.id && !tab.isExpandable
                          ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${tab.isExpandable ? 'cursor-default' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        {isSidebarCollapsed ? tab.shortForm : (
                          <>
                            {tab.label}
                            {tab.isExpandable && (
                              isPeopleSubmenuOpen 
                                ? <ChevronDown size={16} className="text-gray-400" />
                                : <ChevronRight size={16} className="text-gray-400" />
                            )}
                          </>
                        )}
                      </span>
                      {!isSidebarCollapsed && !tab.isExpandable && (
                        <tab.icon size={16} className="text-gray-400" />
                      )}
                    </button>
                    {tab.id === 'people' && isPeopleSubmenuOpen && tab.subTabs && !isSidebarCollapsed && (
                      <div className="pl-4 space-y-1">
                        {tab.subTabs.map((subTab) => (
                          <button
                            key={subTab.id}
                            onClick={() => handleSubTabClick(subTab.id as SubTabType)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              localActiveSubTab === subTab.id
                                ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                          >
                            <span>{isSidebarCollapsed ? subTab.shortForm : subTab.label}</span>
                            {subTab.icon && !isSidebarCollapsed && (
                              <subTab.icon size={16} className="text-gray-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        {/* @section Displays the active component passed as children */}
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