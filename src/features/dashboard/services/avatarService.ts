const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;
import { updateUserData, getUserData } from "../../../services/useUser";
import { uploadFileToR2, getPublicUrl } from "../../../services/storageService";

/**
 * Upload a user avatar to R2 and update user profile.
 */
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  try {
    const fileKey = await uploadFileToR2(file, 'content-image', 'profile_pic');
    const publicUrl = getPublicUrl('content-image', fileKey);

    try {
      const userData = await getUserData(userId);
      const updatedData = { ...userData, profile_pic_url: publicUrl };
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
 */
export async function getUserAvatar(userId: string): Promise<string | null> {
  try {
    const userData = await getUserData(userId);
    return userData.profile_pic_url || null;
  } catch (error) {
    return null;
  }
}

/**
 * Update the user's avatar URL in the database.
 */
export async function updateUserAvatarUrl(employeeId: string, avatarUrl: string): Promise<void> {
  try {
    const response = await fetch(`${API_DOMAIN}/employees/${employeeId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch employee data: ${response.statusText}`);
    }

    const userData = await response.json();
    const updatedData = { ...userData, profile_pic_url: avatarUrl };
    await updateUserData(employeeId, updatedData);
  } catch (error) {
    throw new Error('Failed to update avatar URL');
  }
}
