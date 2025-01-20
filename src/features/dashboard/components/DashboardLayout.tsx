import React, { useState } from 'react';
import { Calendar, Power, ThumbsUp } from 'react-feather'; // Import Power, ThumbsUp, and Clock icons from react-feather
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase'; // Import supabase client
import { useNavigate, useParams } from 'react-router-dom';

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
  { id: 'home', label: 'Home', icon: null },
  { id: 'content', label: 'Content', icon: ThumbsUp },
  { id: 'people', label: 'People', icon: ThumbsUp, 
    subTabs: [
      { id: 'directory', label: 'Directory', icon: ThumbsUp },
      { id: 'orgChart', label: 'Org Chart', icon: ThumbsUp }
    ]
  },
  { id: 'dailyHuddle', label: 'Daily Huddle', icon: Calendar }
] as const;

/**
 * Type representing the possible tab values.
 * @typedef {string} TabType
 */
type TabType = typeof navigationConfig[number]['id'];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  session: Session;
  signOut: () => void;
  activeSubTab?: 'directory' | 'orgChart';
  onSubTabChange?: (subTab: 'directory' | 'orgChart') => void;
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
  const [localActiveSubTab, setLocalActiveSubTab] = useState<'directory' | 'orgChart' | undefined>(activeSubTab);

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
  const handleSubTabClick = (subTab: 'directory' | 'orgChart') => {
    setLocalActiveSubTab(subTab);
    if (onSubTabChange) {
      onSubTabChange(subTab);
    }
    setActiveTabState('people');
    
    if (subTab === 'directory') {
      navigate(`/${userId}/people`);
    } else {
      navigate(`/${userId}/org_chart`);
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
      {/* Top Bar Section */}
      {/* @section Contains company logo, user profile, and sign out button */}
      <div className="flex justify-between items-center bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center">
          <span role="img" aria-label="Company Logo" className="text-2xl">🏢</span>
        </div>
        {/* User Profile Section */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">{email}</p>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
            >
              <Power className="w-5 h-5 mr-1" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation Section */}
        {/* @section Contains main navigation tabs and people subtabs */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="flex flex-col h-full">
            {/* Navigation */}
            <div className="flex-1 py-6 px-4">
              <div className="space-y-1">
                {navigationConfig.map((tab) => (
                  <React.Fragment key={tab.id}>
                    <button
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTabState === tab.id
                          ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.icon && <tab.icon size={16} className="text-gray-400" />}
                    </button>
                    {tab.id === 'people' && isPeopleSubmenuOpen && tab.subTabs && (
                      <div className="pl-4 space-y-1">
                        {tab.subTabs.map((subTab) => (
                          <button
                            key={subTab.id}
                            onClick={() => handleSubTabClick(subTab.id as 'directory' | 'orgChart')}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              localActiveSubTab === subTab.id
                                ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                          >
                            <span>{subTab.label}</span>
                            {subTab.icon && <subTab.icon size={16} className="text-gray-400" />}
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