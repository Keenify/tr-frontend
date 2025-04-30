import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Tabs, Tab, Box, Modal } from '@mui/material';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Import existing images
import interviewQuestion1Image from '../../../../assets/people/hiring/interview-question-1.jpg';
import interviewQuestion2Image from '../../../../assets/people/hiring/interview-question-2.jpg';
import interviewQuestion3Image from '../../../../assets/people/hiring/interview-question-3.jpg';

// Import the new tab components
import PreHireTab from './PreHireTab';
import InterviewTab from './InterviewTab';
import PostInterviewTab from './PostInterviewTab';

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
  const [tabValue, setTabValue] = useState(0); // Default to the first tab (Pre-Hire)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleImageClick = (src: string) => {
    setSelectedImage(src);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    const style = `
      <style>
        body { margin: 0; padding: 20px; }
        img { 
          width: 100%;
          max-width: 100%;
          height: auto;
          margin-bottom: 20px;
          page-break-after: always;
        }
        img:last-child {
          page-break-after: auto;
        }
        @media print {
          @page { margin: 0; }
          body { margin: 1.6cm; }
        }
      </style>
    `;

    printFrame.contentDocument?.write(`
      <html>
        <head>
          <title>Interview Guide</title>
          ${style}
        </head>
        <body>
          ${images.map(image => `<img src="${image.src}" alt="${image.alt}">`).join('')}
        </body>
      </html>
    `);
    printFrame.contentDocument?.close();

    printFrame.onload = () => {
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 500);
    };
  };

  const images = [
    { src: interviewQuestion1Image, alt: "Interview Guide Part 1" },
    { src: interviewQuestion2Image, alt: "Interview Guide Part 2" },
    { src: interviewQuestion3Image, alt: "Interview Guide Part 3" },
  ];

  console.log(session);
  return (
    <div className="hiring-container">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {/* Add new tabs first */}
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Pre-Hire" />        {/* Index 0 */}
          <Tab label="Interview" />       {/* Index 1 */}
          <Tab label="Post-Interview" />  {/* Index 2 */}
          <Tab label="Interview Guide" /> {/* Index 3 */}
          <Tab label="Finding Talent" />  {/* Index 4 */}
        </Tabs>
      </Box>

      {/* New Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <PreHireTab />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <InterviewTab />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <PostInterviewTab />
      </TabPanel>

      {/* Existing Tab Panels - Adjust indices */}
      <TabPanel value={tabValue} index={3}> {/* Was index 0 */} 
        {/* Interview Guide Content */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save as PDF
          </button>
        </div>
        <div style={{ 
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
          alignItems: 'flex-start',
          maxWidth: '100%',
          overflowX: 'auto'
        }}>
          {images.map((image, index) => (
            <div 
              key={index}
              style={{
                flex: '1 1 600px',
                maxWidth: '800px',
                cursor: 'pointer'
              }}
              onClick={() => handleImageClick(image.src)}
            >
              <img 
                src={image.src} 
                alt={image.alt}
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  objectFit: 'contain',
                }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </TabPanel>

      <TabPanel value={tabValue} index={4}> {/* Was index 1 */} 
        {/* Finding Talent Content */}
        <div style={{ 
          padding: '20px 40px',
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: 'white',
          border: '1px solid #f0f0f0',
          borderRadius: '4px',
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '20px', 
            textAlign: 'left',
            color: '#000',
            paddingBottom: '10px',
            borderBottom: '1px solid #e0e0e0'
          }}>
            FINDING TALENT
          </h1>
          <ul style={{ 
            listStyleType: 'none', 
            fontSize: '1.25rem', 
            textAlign: 'left',
            lineHeight: '1.5',
            padding: '0',
            margin: '0'
          }}>
            {[
              "Referral Campaigns",
              "Professional recruiters",
              "Digital media",
              "Creative marketing",
              "University",
              "Outsourcing"
            ].map((item, index) => (
              <li 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '18px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <span style={{ 
                  marginRight: '15px', 
                  fontSize: '1rem', 
                  color: '#0288d1'
                }}>-</span>
                <span style={{
                  fontWeight: 400,
                  color: '#333'
                }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </TabPanel>

      {/* Keep Modal */}
      <Modal
        open={!!selectedImage}
        onClose={handleCloseModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          outline: 'none',
          width: '90vw',
          height: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
            wheel={{ wheelDisabled: false }}
            pinch={{ disabled: false }}
            doubleClick={{ disabled: false }}
          >
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
                overflow: 'visible'
              }}
            >
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Zoomed view"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxHeight: '90vh',
                    maxWidth: '90vw',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              )}
            </TransformComponent>
          </TransformWrapper>
        </div>
      </Modal>
    </div>
  );
};

export default Hiring;
