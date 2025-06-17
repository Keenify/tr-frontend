import { useState } from 'react';
import { createUserWithBackend } from '../../../../shared/services/userAuthService';

interface AddTeammateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const AddTeammateModal = ({ isOpen, onClose, onSuccess, companyId }: AddTeammateModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      title: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    console.log('🎯 Form submission started with data:', {
      ...formData,
      password: '[REDACTED]',
      confirmPassword: '[REDACTED]'
    });

    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('📞 Calling createUserWithBackend...');
      // Use backend endpoint to create user and employee atomically
      const result = await createUserWithBackend({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        title: formData.title,
        phone: formData.phone,
        company_id: companyId,
      });
      
      console.log('✅ User creation successful:', result);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add teammate';
      
      // Provide more specific error messages for common issues
      if (errorMessage.includes('already exists') || errorMessage.includes('user_id already exists')) {
        setError('A user with this email or account already exists. Please use a different email address or contact support to resolve any orphaned accounts.');
      } else if (errorMessage.includes('duplicate')) {
        setError('This email is already registered. Please use a different email address.');
      } else if (errorMessage.includes('invalid email')) {
        setError('Please enter a valid email address.');
      } else if (errorMessage.includes('password')) {
        setError('Password requirements not met. Please ensure it\'s at least 6 characters long.');
      } else if (errorMessage.includes('Unable to connect')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(errorMessage || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Add New Teammate</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isSubmitting 
                ? 'Creating user account...' 
                : 'This will create a new user account. They may need to verify their email before logging in.'
              }
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Required Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                title="First Name"
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                title="Last Name"
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                title="Work Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                title="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
                disabled={isSubmitting}
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                title="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
                disabled={isSubmitting}
                minLength={6}
                placeholder="Confirm your password"
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Optional Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                title="Job Title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                title="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Teammate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 