import React from 'react';
import { Session } from '@supabase/supabase-js';
import { Layout } from './Layout';
import { SOP } from './tabs/SOP';
import { Org } from './tabs/Org';
import { Huddle } from './tabs/Huddle';

interface DashboardProps {
  session: Session;
  signOut: () => void;
}

export function Dashboard({ session, signOut }: DashboardProps) {
  const [activeTab, setActiveTab] = React.useState<'sop' | 'org' | 'huddle'>('sop');

  const renderContent = () => {
    switch (activeTab) {
      case 'sop':
        return <SOP />;
      case 'org':
        return <Org />;
      case 'huddle':
        return <Huddle />;
      default:
        return <SOP />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} session={session} signOut={signOut}>
      {renderContent()}
    </Layout>
  );
}