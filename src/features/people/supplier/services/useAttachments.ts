import { supabase } from '../../../../lib/supabase';

/**
 * Uploads a file to the specified Supabase storage bucket under the 'suppliers' directory.
 * 
 * @param {File} file - The file to be uploaded.
 * @returns {Promise<string>} - A promise that resolves to the file path of the uploaded file.
 * @throws Will throw an error if the upload fails.
 */
export const uploadAttachment = async (file: File): Promise<string> => {
  const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS;
  const fileKey = `suppliers/attachments/${Date.now()}_${file.name}`;

  console.log('Starting upload for:', file.name);

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(fileKey, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  console.log('File uploaded successfully. Path:', fileKey);

  return fileKey;
};

/**
 * Deletes a file from the specified Supabase storage bucket.
 * 
 * @param {string} filePath - The path of the file to be deleted (e.g., 'suppliers/attachments/filename.pdf').
 * @returns {Promise<void>} - A promise that resolves when the file is successfully deleted.
 * @throws Will throw an error if the deletion fails.
 */
export const deleteAttachment = async (filePath: string): Promise<void> => {
  const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS;

  // Log the full path being used for deletion
  console.log('Attempting to delete from bucket:', bucketName);
  console.log('File path for deletion:', filePath);

  // Ensure the path is correctly formatted
  // Remove any leading slashes or 'suppliers/attachments/' if it appears twice
  const cleanPath = filePath.replace(/^\//, '').replace(/^suppliers\/attachments\/suppliers\/attachments\//, 'suppliers/attachments/');

  console.log('Cleaned file path:', cleanPath);

  const { error, data } = await supabase.storage
    .from(bucketName)
    .remove([cleanPath]);

  if (error) {
    console.error('Error deleting file from Supabase:', error);
    throw error;
  }

  console.log('Supabase deletion response:', data);
  console.log('File deleted successfully from storage:', cleanPath);
};

/**
 * Gets a signed URL for an attachment that allows temporary access to the file.
 * 
 * @param {string} filePath - The path of the file in storage (e.g., 'suppliers/attachments/filename.pdf').
 * @returns {Promise<string>} - A promise that resolves to the signed URL.
 * @throws Will throw an error if getting the signed URL fails.
 */
export const getAttachmentSignedUrl = async (filePath: string): Promise<string> => {
  const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS;

  console.log('Getting signed URL for:', filePath);
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 60 * 60); // URL expires in 1 hour

  if (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }

  if (!data?.signedUrl) {
    throw new Error('No signed URL returned');
  }

  console.log('Successfully generated signed URL');
  return data.signedUrl;
};
