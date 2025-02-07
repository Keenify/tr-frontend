import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Tabs, Tab, Box, Modal } from '@mui/material';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Remove PDF-related imports and add image imports
import interviewQuestion1Image from '../../../../assets/people/hiring/interview-question-1.jpg';
import interviewQuestion2Image from '../../../../assets/people/hiring/interview-question-2.jpg';
import interviewQuestion3Image from '../../../../assets/people/hiring/interview-question-3.jpg';

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
  const [tabValue, setTabValue] = useState(0);
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

  const images = [
    { src: interviewQuestion1Image, alt: "Interview Guide Part 1" },
    { src: interviewQuestion2Image, alt: "Interview Guide Part 2" },
    { src: interviewQuestion3Image, alt: "Interview Guide Part 3" },
  ];

  console.log(session);
  return (
    <div className="hiring-container">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Interview Guide" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
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
