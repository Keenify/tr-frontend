import { useState } from 'react';
import { Layout } from './Layout';
import { SOP } from './tabs/SOP';
import { Org } from './tabs/Org';
import { Huddle } from './tabs/Huddle';

type Tab = 'sop' | 'org' | 'huddle';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('sop');

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
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}