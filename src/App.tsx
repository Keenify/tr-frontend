import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { session } = useAuth();

  return (
    <>
      <Toaster position="top-right" />
      {session ? <Dashboard /> : <AuthForm />}
    </>
  );
}

export default App;