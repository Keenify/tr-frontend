import React, { useState } from 'react';
import { Modal } from '@mui/material';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Import the interview guide images
import interviewQuestion1Image from '../../../../assets/people/hiring/interview-question-1.jpg';
import interviewQuestion2Image from '../../../../assets/people/hiring/interview-question-2.jpg';
import interviewQuestion3Image from '../../../../assets/people/hiring/interview-question-3.jpg';

const InterviewGuide: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  return (
    <>
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

      {/* Image Modal */}
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
    </>
  );
};

export default InterviewGuide; 