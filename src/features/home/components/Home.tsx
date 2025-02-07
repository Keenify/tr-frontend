import React from 'react';
import { Session } from '@supabase/supabase-js';
import '../styles/Home.css';

interface HomeProps {
  session: Session;
}

const Home: React.FC<HomeProps> = ({ session }) => {
  console.log(session);

  return (
    <div style={{ 
      padding: '20px', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{ 
        border: '2px solid #ccc', 
        padding: '10px', 
        position: 'relative', 
        height: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '50px'
      }}>
        <img 
          src="/public/images/home/mount-everest.png"
          alt="Mount Everest" 
          style={{ 
            maxWidth: '70%',
            maxHeight: '100%',
            objectFit: 'contain',
            border: '2px solid #000',
            padding: '5px'
          }} 
        />
      </div>
    </div>
  );
};

export default Home;