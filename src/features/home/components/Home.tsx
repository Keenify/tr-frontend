import React from 'react';
import { Session } from '@supabase/supabase-js';
import '../styles/Home.css';

// image
import MountEverest from '../../../../src/assets/home/mount-everest-completed.png';

interface HomeProps {
  session: Session;
}

const Home: React.FC<HomeProps> = ({ session }) => {
  console.log(session);

  return (
    <div style={{ 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff' // Changed from #000 to #fff for white background
    }}>
      <img 
        src={MountEverest}
        alt="Mount Everest" 
        style={{ 
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }} 
      />
    </div>
  );
};

export default Home;