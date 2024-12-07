import { Toaster } from 'react-hot-toast'; // Importing a component for displaying toast notifications
import { AuthForm } from './components/auth/AuthForm'; // Importing the authentication form component
import { Dashboard } from './components/dashboard/Dashboard'; // Importing the dashboard component
import { useAuth } from './hooks/useAuth'; // Importing a custom hook for authentication

/**
 * The main application component that determines what to render based on the user's authentication status.
 */
function App() {
  // Destructuring the session object from the useAuth hook
  const { session } = useAuth();

  return (
    <>
      {/* Displaying toast notifications at the top-right corner of the screen */}
      <Toaster position="top-right" />
      
      {/* Conditionally rendering the Dashboard if the user is authenticated, otherwise rendering the AuthForm */}
      {session ? <Dashboard /> : <AuthForm />}
    </>
  );
}

export default App; // Exporting the App component as the default export