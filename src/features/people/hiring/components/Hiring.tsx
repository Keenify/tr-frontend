import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Tabs, Tab, Box } from '@mui/material';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Import the PDF file
import InterviewPDF from '../../../../assets/people/hiring/Day 8 - Designing Interview Sheets Complete.pdf';

interface HiringProps {
  session: Session;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Hiring: React.FC<HiringProps> = ({ session }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  console.log(session);
  return (
    <div className="hiring-container">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Interview Guide" />
          {/* Add more tabs here as needed */}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <div style={{ height: '750px' }}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={InterviewPDF}
              plugins={[defaultLayoutPluginInstance]}
            />
          </Worker>
        </div>
      </TabPanel>
      {/* Add more TabPanels here as needed */}
    </div>
  );
};

export default Hiring;
