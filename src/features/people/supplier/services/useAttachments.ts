import { uploadFileToR2, deleteFile, getPresignedDownloadUrl } from '../../../../services/storageService';

const BUCKET = 'attachments';

/**
 * Uploads a file to R2 under the 'suppliers' directory.
 * Returns the file key (relative path).
 */
export const uploadAttachment = async (file: File): Promise<string> => {
  console.log('Starting upload for:', file.name);
  const fileKey = await uploadFileToR2(file, BUCKET, 'suppliers/attachments');
  console.log('File uploaded successfully. Path:', fileKey);
  return fileKey;
};

/**
 * Deletes a file from R2.
 */
export const deleteAttachment = async (filePath: string): Promise<void> => {
  const cleanPath = filePath
    .replace(/^\//, '')
    .replace(/^suppliers\/attachments\/suppliers\/attachments\//, 'suppliers/attachments/');

  console.log('Deleting file:', cleanPath);
  await deleteFile(BUCKET, cleanPath);
  console.log('File deleted successfully:', cleanPath);
};

/**
 * Gets a presigned download URL for an attachment (1 hour expiry).
 */
export const getAttachmentSignedUrl = async (filePath: string): Promise<string> => {
  console.log('Getting signed URL for:', filePath);
  const url = await getPresignedDownloadUrl(BUCKET, filePath);
  console.log('Successfully generated signed URL');
  return url;
};
