import React from 'react';
import { Session } from '@supabase/supabase-js';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import '../styles/DailyHuddle.css';
import DailyHuddleForm from './DailyHuddleForm';
import DailyHuddleResponse from './DailyHuddleResponse';

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


  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ 
        textAlign: 'center', 
        fontSize: '2.5rem',
        marginBottom: '20px',
        fontFamily: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif'
      }}>
        The Daily Huddle
      </h1>

      <div style={{ 
        textAlign: 'center',
        marginBottom: '40px',
        fontFamily: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif'
      }}>
        <p style={{ 
          fontSize: '1.8rem',
          lineHeight: '1.4',
          margin: '0'
        }}>
          Becoming the Nestle of Asia through 1% Vision and 99% {' '}
          <span style={{ 
            fontWeight: 'bold',
            fontStyle: 'italic'
          }}>
            Alignment
          </span>
        </p>
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