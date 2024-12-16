import { SpeedInsights } from '@vercel/speed-insights/react';

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
      </div>
    </>
  );
}

export default App;