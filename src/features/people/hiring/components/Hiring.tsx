import React, { useState, useCallback } from 'react';
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
import RejectedTab from './RejectedTab';
import JobsOpening from './JobsOpening';

// Import services
import useJobApplications from '../services/useJobApplications';

// Custom CSS for react-tabs
import '../styles/Tabs.css';

// Import context from separate file
import { ApplicationCountContext } from '../context/ApplicationCountContext';

interface HiringProps {
  session: Session;
}

const Hiring: React.FC<HiringProps> = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [counts, setCounts] = useState({
    preHire: 0,
    interview: 0,
    postInterview: 0,
    rejected: 0
  });
  
  const { getJobApplicationsByStatus } = useJobApplications();

  // Function to update a specific count
  const updateCount = (key: 'preHire' | 'interview' | 'postInterview' | 'rejected', count: number) => {
    setCounts(prev => ({
      ...prev,
      [key]: count
    }));
  };
  
  // Refresh all application counts
  const refreshAllCounts = useCallback(async () => {
    try {
      // Fetch counts for each status
      const preHireData = await getJobApplicationsByStatus('pre-hire');
      const interviewData = await getJobApplicationsByStatus('interview');
      const postHiredData = await getJobApplicationsByStatus('post-hired');
      const rejectedData = await getJobApplicationsByStatus('rejected');
      
      // Update all counts at once
      setCounts({
        preHire: preHireData.length,
        interview: interviewData.length,
        postInterview: postHiredData.length,
        rejected: rejectedData.length
      });
      
    } catch (err) {
      console.error('Failed to refresh application counts:', err);
    }
  }, [getJobApplicationsByStatus]);

  return (
    <div className="hiring-container p-4">
      <h1 className="text-2xl font-bold mb-4">Hiring Pipeline</h1>
      
      <ApplicationCountContext.Provider value={{ counts, updateCount, refreshAllCounts }}>
        <Tabs 
          selectedIndex={tabIndex} 
          onSelect={index => setTabIndex(index)}
          className="hiring-tabs"
          selectedTabClassName="selected-tab"
        >
          <TabList className="react-tabs__tab-list">
            <Tab className="tab-item">Jobs Opening</Tab>
            <Tab className="tab-item">Finding Talent</Tab>
            <Tab className="tab-item">Interview Guide</Tab>
            <Tab className="tab-item">
              Pre-Hire
              {counts.preHire > 0 && <span className="count-badge">{counts.preHire}</span>}
            </Tab>
            <Tab className="tab-item">
              Interview
              {counts.interview > 0 && <span className="count-badge">{counts.interview}</span>}
            </Tab>
            <Tab className="tab-item">
              Post-Interview
              {counts.postInterview > 0 && <span className="count-badge">{counts.postInterview}</span>}
            </Tab>
            <Tab className="tab-item">
              Rejected
              {counts.rejected > 0 && <span className="count-badge">{counts.rejected}</span>}
            </Tab>
          </TabList>

          <TabPanel>
            <div className="tab-content">
              <JobsOpening />
            </div>
          </TabPanel>
          
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
          
          <TabPanel>
            <div className="tab-content">
              <RejectedTab />
            </div>
          </TabPanel>
        </Tabs>
      </ApplicationCountContext.Provider>
    </div>
  );
};

export default Hiring;
