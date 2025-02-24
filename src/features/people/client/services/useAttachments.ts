import { supabase } from '../../../../lib/supabase';

/**
 * Uploads a file to the specified Supabase storage bucket under the 'b2b_clients' directory.
 * 
 * @param {File} file - The file to be uploaded.
 * @returns {Promise<string>} - A promise that resolves to the file path of the uploaded file.
 * @throws Will throw an error if the upload fails.
 */
export const uploadAttachment = async (file: File): Promise<string> => {
  const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS;
  const fileKey = `b2b_clients/attachments/${Date.now()}_${file.name}`;

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
 * @param {string} filePath - The path of the file to be deleted (e.g., 'b2b_clients/attachments/filename.pdf').
 * @returns {Promise<void>} - A promise that resolves when the file is successfully deleted.
 * @throws Will throw an error if the deletion fails.
 */
export const deleteAttachment = async (filePath: string): Promise<void> => {
  const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS;

  console.log('Starting deletion for file:', filePath);

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }

  console.log('File deleted successfully:', filePath);
};
