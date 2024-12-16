import React from 'react';
import { Session } from '@supabase/supabase-js';
import { Layout } from './Layout';

/**
 * Dashboard component props interface.
 * @interface DashboardProps
 * @property {Session} session - The current user session.
 * @property {() => void} signOut - Function to sign out the user.
 */
interface DashboardProps {
  session: Session;
  signOut: () => void;
}

/**
 * Dashboard component that renders different content based on the active tab and sub-tab.
 * @param {DashboardProps} props - The props for the Dashboard component.
 * @returns {JSX.Element} The rendered Dashboard component.
 */
export function Dashboard({ session, signOut }: DashboardProps): JSX.Element {
  const [activeTab, setActiveTab] = React.useState<'home' | 'content' | 'people' | 'groups' | 'marketplaces' | 'reports' | 'account'>('home');
  const [activeSubTab, setActiveSubTab] = React.useState<'directory' | 'orgChart'>('directory');

  /**
   * Renders the content based on the active tab and sub-tab.
   * @returns {JSX.Element} The content to be displayed.
   */
  const renderContent = (): JSX.Element => {
    if (activeTab === 'people') {
      switch (activeSubTab) {
        case 'directory':
          return <div>Directory</div>;
        case 'orgChart':
          return <div>Org Chart</div>;
        default:
          return <div>Directory</div>;
      }
    }

    switch (activeTab) {
      case 'home':
        return <div>Home Content</div>;
      case 'content':
        return <div>Content</div>;
      case 'groups':
        return <div>Groups</div>;
      case 'marketplaces':
        return <div>Marketplaces</div>;
      case 'reports':
        return <div>Reports</div>;
      case 'account':
        return <div>Account</div>;
      default:
        return <div>Home Content</div>;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab)}
      session={session}
      signOut={signOut}
      activeSubTab={activeSubTab}
      onSubTabChange={(subTab) => setActiveSubTab(subTab)}
    >
      {renderContent()}
    </Layout>
  );
}