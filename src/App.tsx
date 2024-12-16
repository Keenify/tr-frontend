import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from "@vercel/analytics/react"

import { useSession } from './shared/hooks/useSession';

import { Dashboard } from './features/dashboard/components/Dashboard';
import AuthForm from './features/auth/components/AuthComponent';

function App() {
  const { session, signOut } = useSession();

  return (
    <>
      <div>
        {!session ? (
          <AuthForm />
        ) : (
          <Dashboard session={session} signOut={signOut} />
        )}
        <SpeedInsights />
        <Analytics />
      </div>
    </>
  );
}

export default App;