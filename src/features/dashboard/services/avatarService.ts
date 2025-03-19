// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;
import { supabase } from "../../../lib/supabase";
import { updateUserData, getUserData } from "../../../services/useUser";

/**
 * Upload a user avatar to S3 bucket and update user profile.
 * 
 * This function uploads an image to S3 bucket under profile_pic folder, 
 * then updates the user's profile with the public URL.
 * 
 * @param userId - The ID of the user from the session.
 * @param file - The avatar image file to upload.
 * @returns A Promise that resolves to the URL of the uploaded avatar.
 */
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  try {
    // Create a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile_pic/${fileName}`;
    
    // Upload file to Supabase Storage (S3)
    const { error } = await supabase.storage
      .from('content-image')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('content-image')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData.publicUrl;
    
    // Get current user data first to get the employee ID
    try {
      const userData = await getUserData(userId);
      
      // Update only the profile_pic_url field
      const updatedData = {
        ...userData,
        profile_pic_url: publicUrl
      };
      
      await updateUserData(userData.id, updatedData);
    } catch (error) {
      // Return the URL anyway since the upload was successful
    }
    
    return publicUrl;
  } catch (error) {
    throw new Error('Failed to upload avatar');
  }
}

/**
 * Get the current avatar URL for a user.
 * 
 * This function gets the user's current profile_pic_url from their profile.
 * 
 * @param userId - The ID of the user from the session.
 * @returns A Promise that resolves to the URL of the user's avatar, or null if they don't have one.
 */
export async function getUserAvatar(userId: string): Promise<string | null> {
  try {
    // Fetch user data to get profile pic URL
    const userData = await getUserData(userId);
    return userData.profile_pic_url || null;
  } catch (error) {
    return null;
  }
}

/**
 * Update the user's avatar URL in the database.
 * 
 * This function calls the API to update the user's profile with the new avatar URL.
 * 
 * @param employeeId - The employee ID to update (not the auth user ID).
 * @param avatarUrl - The URL of the uploaded avatar.
 * @returns A Promise that resolves when the update is complete.
 */
export async function updateUserAvatarUrl(employeeId: string, avatarUrl: string): Promise<void> {
  try {
    // Get current user data first
    const response = await fetch(`${API_DOMAIN}/employees/${employeeId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch employee data: ${response.statusText}`);
    }
    
    const userData = await response.json();
    
    // Update only the profile_pic_url field
    const updatedData = {
      ...userData,
      profile_pic_url: avatarUrl
    };
    
    await updateUserData(employeeId, updatedData);
  } catch (error) {
    throw new Error('Failed to update avatar URL');
  }
} 