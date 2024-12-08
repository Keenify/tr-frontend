import React from 'react';
import { FileText, Users, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: 'sop' | 'org' | 'huddle') => void;
}

/**
 * Layout component for the dashboard, including sidebar and main content area.
 */
export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { signOut, session } = useAuth();
  const firstName = session?.user?.user_metadata?.first_name || 'User';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {firstName.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Welcome,</h2>
                <p className="text-sm text-gray-600">{firstName}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 py-6 px-4">
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Main Menu
              </h3>
              
              <button
                onClick={() => onTabChange('sop')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'sop'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FileText className="w-5 h-5 mr-3" />
                SOP
              </button>
              
              <button
                onClick={() => onTabChange('org')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'org'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5 mr-3" />
                Organization
              </button>

              <button
                onClick={() => onTabChange('huddle')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'huddle'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-5 h-5 mr-3" />
                Daily Huddle
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={signOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto h-full">
        <div className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 h-full flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'sop' ? 'Standard Operating Procedures' : 
               activeTab === 'org' ? 'Organization' : 
               'Daily Huddle'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'sop' ? 'Manage and view all standard operating procedures' :
               activeTab === 'org' ? 'Manage organizational structure and members' :
               'Track daily meetings and team updates'}
            </p>
          </div>
          
          {/* Content */}
          <div className="bg-white shadow-sm rounded-lg flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}