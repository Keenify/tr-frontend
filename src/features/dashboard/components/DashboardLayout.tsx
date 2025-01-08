import React, { useState } from 'react';
import { Power, ThumbsUp, Clock, Calendar } from 'react-feather'; // Import Power, ThumbsUp, and Clock icons from react-feather
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

// Define the possible tabs, including the new "Daily Huddle" tab
const tabs = ['home', 'content', 'people', 'groups', 'marketplaces', 'reports', 'account', 'dailyHuddle'] as const;
type TabType = typeof tabs[number];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  session: Session;
  signOut: () => void;
  activeSubTab?: 'directory' | 'orgChart';
  onSubTabChange?: (subTab: 'directory' | 'orgChart') => void;
}

// Add this CSS to your global styles or add it inline with a style tag
const blinkingThumbStyle = `
  @keyframes blink {
    0% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0.4; transform: scale(1); }
  }
  .blinking-thumb {
    animation: blink 2s infinite;
    color: #10B981; /* Emerald-500 color */
  }
`;

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
  const email = session.user.email || 'user@example.com';
  const [isPeopleSubmenuOpen, setIsPeopleSubmenuOpen] = React.useState(activeTab === 'people');
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [activeTabState, setActiveTabState] = React.useState<TabType>(activeTab);
  const [localActiveSubTab, setLocalActiveSubTab] = useState<'directory' | 'orgChart' | undefined>(activeSubTab);

  // Update state when props change
  React.useEffect(() => {
    setActiveTabState(activeTab);
    setIsPeopleSubmenuOpen(activeTab === 'people');
  }, [activeTab]);

  React.useEffect(() => {
    setLocalActiveSubTab(activeSubTab);
  }, [activeSubTab]);

  // Function to handle sign out using Supabase
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    signOut(); // Call the passed signOut function to update the state
    navigate('/login');
  };

  // Function to handle tab change
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

  // Function to handle subtab click
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <style>{blinkingThumbStyle}</style>
      {/* Top Bar */}
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
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="flex flex-col h-full">
            {/* Navigation */}
            <div className="flex-1 py-6 px-4">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <React.Fragment key={tab}>
                    <button
                      onClick={() => handleTabChange(tab)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTabState === tab
                          ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                      {tab === 'content' && <ThumbsUp size={16} className="text-gray-400" />}
                      {tab === 'people' && <ThumbsUp size={16} className="text-gray-400" />}
                      {['groups', 'marketplaces', 'reports', 'account'].includes(tab) && <Clock size={16} className="text-gray-400" />}
                      {tab === 'dailyHuddle' && <Calendar size={16} className="text-gray-400" />}
                    </button>
                    {tab === 'people' && isPeopleSubmenuOpen && (
                      <div className="pl-4 space-y-1">
                        {['directory', 'orgChart'].map((subTab) => (
                          <button
                            key={subTab}
                            onClick={() => handleSubTabClick(subTab as 'directory' | 'orgChart')}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              localActiveSubTab === subTab
                                ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                          >
                            <span>{subTab === 'orgChart' ? 'Org Chart' : 'Directory'}</span>
                            <ThumbsUp size={16} className="text-gray-400" />
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

        {/* Main Content */}
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