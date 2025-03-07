import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

import { supabase } from '../../../lib/supabase';
import { useSession } from '../../../shared/hooks/useSession';

/**
 * AuthForm Component
 * 
 * This component is responsible for rendering the authentication form using Supabase's Auth UI.
 * It leverages the `Auth` component from `@supabase/auth-ui-react` to facilitate user authentication,
 * including sign-in and sign-up functionalities.
 * 
 * The component is designed to be responsive and centers the form on the screen, providing a user-friendly
 * interface. It automatically navigates to the dashboard if a user session is detected.
 * 
 * @component
 * @returns {JSX.Element} A JSX element representing the authentication form.
 */
const AuthForm: React.FC = () => {
  const { session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session) {
      navigate(`/${session.user.id}`);
    }
  }, [session, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-4 sm:p-6 bg-white rounded-lg shadow-md">
        {location.hash.includes('auth-forgot-password') && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md">
            <p className="text-sm">
              Enter your email address below and we'll send you a link to reset your password.
              After clicking the link in your email, you'll be redirected to set a new password.
            </p>
          </div>
        )}
        <Auth
          supabaseClient={supabase}
          showLinks={true}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#6366F1',
                  brandAccent: '#4F46E5',
                },
              },
            },
          }}
          providers={[]} // Add any third-party providers if needed
          redirectTo={window.location.origin + '/reset-password'}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default AuthForm;