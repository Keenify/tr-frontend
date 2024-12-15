import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';

/**
 * AuthForm Component
 * 
 * This component renders an authentication form using Supabase's Auth UI.
 * It is styled to be centered on the screen with a responsive design.
 * 
 * The form uses the `Auth` component from `@supabase/auth-ui-react` to handle
 * user authentication, including sign-in and sign-up processes.
 * 
 * @returns {JSX.Element} The rendered authentication form component.
 */
const AuthForm = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="max-w-md w-full p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <Auth
        supabaseClient={supabase} // Supabase client instance for authentication
        showLinks={true} // Show additional links like "Forgot password?"
        appearance={{
          theme: ThemeSupa, // Use the ThemeSupa for consistent styling
          variables: {
            default: {
              colors: {
                brand: '#6366F1', // Primary brand color
                brandAccent: '#4F46E5', // Accent color for branding
              },
            },
          },
        }}
        providers={[]} // Disable all third-party authentication providers
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email', // Label for the email input field
              password_label: 'Password', // Label for the password input field
            },
          },
        }}
      />
    </div>
  </div>
);

export default AuthForm; 