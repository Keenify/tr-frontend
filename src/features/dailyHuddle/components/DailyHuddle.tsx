import React from 'react';
import { Session } from '@supabase/supabase-js';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import '../styles/DailyHuddle.css';
import DailyHuddleForm from './DailyHuddleForm';
import DailyHuddleResponse from './DailyHuddleResponse';
import { useUserAndCompanyData } from '../../../hooks/useUserAndCompanyData';

interface DailyHuddleProps {
  session: Session;
}

const DailyHuddle: React.FC<DailyHuddleProps> = ({ session }) => {
  const { userInfo, companyInfo, error } = useUserAndCompanyData(session.user.id);

  if (error) {
    return <div>Error loading data: {error.message}</div>;
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div className="info-container" style={{ display: 'flex', justifyContent: 'space-between' }}>
        {userInfo && (
          <div className="info-card" style={{ textAlign: 'left', border: '1px solid #ccc', padding: '10px', width: '45%' }}>
            <p><strong>User ID:</strong> {userInfo.id}</p>
            <p><strong>Email:</strong> {userInfo.email}</p>
            <p><strong>Name:</strong> {userInfo.first_name} {userInfo.last_name}</p>
          </div>
        )}
        {companyInfo && (
          <div className="info-card" style={{ textAlign: 'left', border: '1px solid #ccc', padding: '10px', width: '45%' }}>
            <p><strong>Company Name:</strong> {companyInfo.name}</p>
            <p><strong>Company ID:</strong> {companyInfo.id}</p>
          </div>
        )}
      </div>
      <br />
      <Tabs>
        <TabList>
          <Tab>Daily Huddle Form</Tab>
          <Tab>Daily Huddle Response</Tab>
        </TabList>

        <TabPanel>
          <DailyHuddleForm session={session} />
        </TabPanel>
        <TabPanel>
          <DailyHuddleResponse session={session} />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DailyHuddle;