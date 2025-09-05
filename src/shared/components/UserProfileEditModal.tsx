import React, { useState, useEffect } from 'react';
import { X, Save, User, Upload } from 'react-feather';
import { updateUserData, getUserData, UserData } from '../../services/useUser';
import { uploadUserAvatar } from '../../features/dashboard/services/avatarService';
import toast from 'react-hot-toast';

interface UserProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentUserData: UserData | null;
  onUserDataUpdated: (updatedData: UserData) => void;
  userAvatar?: string | null;
  onAvatarUpdated?: (avatarUrl: string) => void;
}

export const UserProfileEditModal: React.FC<UserProfileEditModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentUserData,
  onUserDataUpdated,
  userAvatar,
  onAvatarUpdated,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Avatar upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUserData) {
      setFirstName(currentUserData.first_name || '');
      setLastName(currentUserData.last_name || '');
    }
  }, [currentUserData]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && currentUserData) {
      setFirstName(currentUserData.first_name || '');
      setLastName(currentUserData.last_name || '');
    }
    // Reset avatar states when modal opens
    if (isOpen) {
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [isOpen, currentUserData]);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!lastName.trim()) {
      toast.error('Last name is required');
      return;
    }

    if (!currentUserData) {
      toast.error('User data not available');
      return;
    }

    try {
      setIsSaving(true);
      const loadingToast = toast.loading('Updating profile...');

      let updatedAvatarUrl = userAvatar;

      // Upload avatar if a new file is selected
      if (avatarFile) {
        try {
          setIsUploading(true);
          updatedAvatarUrl = await uploadUserAvatar(userId, avatarFile);
          if (onAvatarUpdated) {
            onAvatarUpdated(updatedAvatarUrl);
          }
        } catch (avatarError) {
          toast.dismiss(loadingToast);
          toast.error('Failed to upload profile picture. Please try again.');
          console.error('Avatar upload error:', avatarError);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Prepare updated data
      const updatedData = {
        ...currentUserData,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };

      // Update user data via API
      const result = await updateUserData(currentUserData.id, updatedData);
      
      toast.dismiss(loadingToast);
      toast.success('Profile updated successfully!');
      
      // Notify parent component of the update
      onUserDataUpdated(result);
      
      // Close modal
      onClose();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to update profile. Please try again.');
      console.error('Error updating user profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (currentUserData) {
      setFirstName(currentUserData.first_name || '');
      setLastName(currentUserData.last_name || '');
    }
    // Reset avatar states
    setAvatarFile(null);
    setAvatarPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Picture Section */}
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt="Current avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-4xl">
                  {currentUserData?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              <span>Choose Image</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isSaving || isUploading}
              />
            </label>
            <p className="text-sm text-gray-500 mt-2 text-center">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your first name"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your last name"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isSaving || isUploading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading || !firstName.trim() || !lastName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving || isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isUploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
