import React from 'react';
import { Session } from '@supabase/supabase-js';

interface HomeProps {
  session: Session;
}

const Home: React.FC<HomeProps> = ({ session }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to the Home Page</h1>
      <p>User ID: {session.user.id}</p>
      <p>Email: {session.user.email}</p>
      {/* Add more personalized content or components here */}
    </div>
  );
};

export default Home;