import { supabase } from '../../../../lib/supabase';

/**
 * Uploads a sick leave attachment to Supabase storage
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The file path in storage
 */
export const uploadLeaveAttachment = async (file: File): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS;
    const fileKey = `sick_leave/${Date.now()}_${file.name}`;

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
 * Deletes a sick leave attachment from Supabase storage
 * @param {string} filePath - The path of the file to delete
 */
export const deleteLeaveAttachment = async (filePath: string): Promise<void> => {
    const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS;
    const cleanPath = filePath.replace(/^\//, '');

    const { error } = await supabase.storage
        .from(bucketName)
        .remove([cleanPath]);

    if (error) {
        console.error('Error deleting file:', error);
        throw error;
    }

    console.log('File deleted successfully:', cleanPath);
};

/**
 * Gets a signed URL for a sick leave attachment
 * @param {string} filePath - The path of the file
 * @returns {Promise<string>} - The signed URL
 */
export const getLeaveAttachmentUrl = async (filePath: string): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_ATTACHMENTS;

    const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

    if (error || !data?.signedUrl) {
        console.error('Error getting signed URL:', error);
        throw error || new Error('No signed URL returned');
    }

    return data.signedUrl;
}; 