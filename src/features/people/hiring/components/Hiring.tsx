import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Import the tab components
import FindingTalent from './FindingTalent';
import InterviewGuide from './InterviewGuide';
import PreHireTab from './PreHireTab';
import InterviewTab from './InterviewTab';
import PostInterviewTab from './PostInterviewTab';

// Custom CSS for react-tabs
import '../styles/Tabs.css';

interface HiringProps {
  session: Session;
}

const Hiring: React.FC<HiringProps> = ({ session }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [counts, setCounts] = useState({
    preHire: 3,
    interview: 5,
    postInterview: 2
  });

  // Mock data for demonstration - in a real app this would come from API
  useEffect(() => {
    // Simulate fetching counts from API
    const timer = setTimeout(() => {
      setCounts({
        preHire: 3,
        interview: 5,
        postInterview: 2
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  console.log(session);
  return (
    <div className="hiring-container p-4">
      <h1 className="text-2xl font-bold mb-4">Hiring Pipeline</h1>
      
      <Tabs 
        selectedIndex={tabIndex} 
        onSelect={index => setTabIndex(index)}
        className="hiring-tabs"
        selectedTabClassName="selected-tab"
      >
        <TabList className="react-tabs__tab-list">
          <Tab className="tab-item">Finding Talent</Tab>
          <Tab className="tab-item">Interview Guide</Tab>
          <Tab className="tab-item">
            Pre-Hire
            <span className="count-badge">{counts.preHire}</span>
          </Tab>
          <Tab className="tab-item">
            Interview
            <span className="count-badge">{counts.interview}</span>
          </Tab>
          <Tab className="tab-item">
            Post-Interview
            <span className="count-badge">{counts.postInterview}</span>
          </Tab>
        </TabList>

        <TabPanel>
          <div className="tab-content">
            <FindingTalent />
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="tab-content">
            <InterviewGuide />
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="tab-content">
            <PreHireTab />
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="tab-content">
            <InterviewTab />
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="tab-content">
            <PostInterviewTab />
          </div>
        </TabPanel>
      </Tabs>

      {/* Note: You'll need to install react-tabs: npm install react-tabs */}
    </div>
  );
};

export default Hiring;
