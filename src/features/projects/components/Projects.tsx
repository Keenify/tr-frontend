import React, { useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';

interface ProjectProps {
  title?: string;
  session: Session;
}

const Project: React.FC<ProjectProps> = ({ title = 'Hello World', session }) => {
  const [plankaToken, setPlankaToken] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to log in to Planka using the shared binding account
  const loginToPlanka = async () => {
    const plankaBaseUrl = 'https://caddy-proxy-production-423e.up.railway.app';
    const plankaApiUrl = `${plankaBaseUrl}/api/access-tokens`;

    console.log('Attempting to login to Planka...');
    try {
      const response = await fetch(plankaApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: "tanengkeen@gmail.com",
          password: "admin"
        }),
      });

      const data = await response.json();
      console.log('Planka login response:', data);

      if (data.item) {
        console.log('Token received, length:', data.item.length);
        localStorage.setItem('plankaToken', data.item);
        setPlankaToken(data.item);
      } else {
        console.error('No token received in response');
      }
    } catch (error) {
      console.error('Planka login failed:', error);
    }
  };

  // Check for a stored token or authenticate when the component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('plankaToken');
    console.log('Stored token exists:', !!storedToken);
    if (storedToken) {
      console.log('Using stored token, length:', storedToken.length);
      setPlankaToken(storedToken);
    } else {
      console.log('No stored token found, logging in...');
      loginToPlanka();
    }
  }, []);

  // Add a useEffect to log when plankaToken changes
  useEffect(() => {
    console.log('plankaToken state updated:', !!plankaToken);
    console.log('plankaToken value:', plankaToken);
  }, [plankaToken]);

  // Add function to verify Planka access
  const verifyPlankaAccess = async (token: string) => {
    const plankaBaseUrl = 'https://caddy-proxy-production-423e.up.railway.app';
    const plankaApiUrl = `${plankaBaseUrl}/api/projects`;
    
    try {
      const response = await fetch(plankaApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const data = await response.json();
      console.log('Planka API response:', data);
      return response.ok;
    } catch (error) {
      console.error('Planka API verification failed:', error);
      return false;
    }
  };

  // Add useEffect to verify access when token is available
  useEffect(() => {
    if (plankaToken) {
      verifyPlankaAccess(plankaToken);
    }
  }, [plankaToken]);

  // Add useEffect to send token to iframe
  useEffect(() => {
    if (plankaToken && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { token: plankaToken },
        'https://planka.autolabkit.com'
      );
    }
  }, [plankaToken]);

  return (
    <div className="project-container">
      <h1>{title}</h1>
      <p>Welcome, {session.user.email} to my project page!</p>
      {plankaToken ? (
        <iframe
          ref={iframeRef}
          src="https://caddy-proxy-production-423e.up.railway.app/boards/1434060322221589509"
          title="Planka Project Management"
          referrerPolicy="origin"
          style={{
            width: '100%',
            height: '800px',
            border: 'none',
            borderRadius: '8px',
            marginTop: '20px'
          }}
        />
      ) : (
        <p>Loading Planka...</p>
      )}
      <div id="token-debug" style={{ display: 'none' }}>
        Token: {plankaToken}
      </div>
    </div>
  );
};

export default Project;
