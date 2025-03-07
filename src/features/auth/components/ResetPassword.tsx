import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useSession } from '../../../shared/hooks/useSession';
import toast from 'react-hot-toast';

/**
 * ResetPassword Component
 * 
 * This component is responsible for handling the password reset flow.
 * It allows users to set a new password after clicking the reset password link from their email.
 * 
 * @component
 * @returns {JSX.Element} A JSX element representing the password reset form.
 */
const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have a hash in the URL (from the password reset link)
  useEffect(() => {
    // Parse the URL hash and search parameters to detect recovery flow
    const hash = location.hash;
    const searchParams = new URLSearchParams(location.search);
    
    // Check if this is a recovery flow from either hash or search params
    const isResetPasswordFlow = 
      hash.includes('type=recovery') || 
      searchParams.get('type') === 'recovery' ||
      hash.includes('access_token');

    // If user is already authenticated via the reset link but not on the reset page,
    // redirect them to the reset page
    if (session && !isResetPasswordFlow && location.pathname !== '/reset-password') {
      navigate('/reset-password');
    }
    
    // If we have an access token in the URL but we're not on the reset password page,
    // redirect to the reset password page
    if (hash.includes('access_token') && location.pathname !== '/reset-password') {
      navigate('/reset-password');
    }
  }, [session, navigate, location]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully');
      
      // Redirect to the dashboard
      if (session) {
        navigate(`/${session.user.id}`);
      } else {
        navigate('/login');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Reset Your Password</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleResetPassword}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter your new password"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Confirm your new password"
              required
            />
          </div>
          
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;