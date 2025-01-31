import React from 'react';
import { Session } from '@supabase/supabase-js';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import '../styles/DailyHuddle.css';
import alignmentQuote from '../assets/percent_alignment.png';
import DailyHuddleForm from './DailyHuddleForm';
import DailyHuddleResponse from './DailyHuddleResponse';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';

/**
 * Props for the DailyHuddle component.
 */
interface DailyHuddleProps {
  session: Session;
}

/**
 * DailyHuddle Component
 * 
 * This component renders the daily huddle interface, including user and company information,
 * and tabs for the Daily Huddle Form and Daily Huddle Response.
 * 
 * @component
 * @param {DailyHuddleProps} props - Component props
 * @param {Session} props.session - User session object containing authentication details
 * @returns {JSX.Element} Rendered Daily Huddle component
 */
const DailyHuddle: React.FC<DailyHuddleProps> = ({ session }) => {
  const { userInfo, companyInfo, error } = useUserAndCompanyData(session.user.id);

  if (error) {
    return <div>Error loading data: {error.message}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* Quote Section - Left Side */}
        <div style={{ flex: '2' }}>
          <img 
            src={alignmentQuote} 
            alt="Vision and Alignment Quote"
            style={{
              width: "100%",
              maxWidth: "400px",
              display: "block",
              margin: "20px auto",
            }}
          />
        </div>

        {/* Combined Info Section - Right Side */}
        {(userInfo || companyInfo) && (
          <div style={{ 
            flex: '3',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '30px',
            backgroundColor: '#f9f9f9',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {userInfo && (
              <div style={{ marginBottom: '20px' }}>
                <p><strong>User ID:</strong> {userInfo.id}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p style={{ marginBottom: 0 }}><strong>Name:</strong> {userInfo.first_name} {userInfo.last_name}</p>
              </div>
            )}
            {companyInfo && (
              <div>
                <p><strong>Company Name:</strong> {companyInfo.name}</p>
                <p style={{ marginBottom: 0 }}><strong>Company ID:</strong> {companyInfo.id}</p>
              </div>
            )}
          </div>
        )}
      </div>

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