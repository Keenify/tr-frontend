import React from 'react';
import { Session } from '@supabase/supabase-js';
import '../styles/Home.css';

// image
import VividVision from '../../../../src/assets/home/vivid_vision.jpg';

interface VisionProps {
  session: Session;
}

const Vision: React.FC<VisionProps> = ({ session }) => {
  console.log(session);

  return (
    <div style={{ 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff'
    }}>
      <img 
        src={VividVision}
        alt="Vivid Vision" 
        style={{ 
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }} 
      />
    </div>
  );
};

export default Vision; 