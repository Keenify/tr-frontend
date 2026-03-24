import { uploadFileToR2, deleteFile, getPresignedDownloadUrl } from '../../../../services/storageService';

const BUCKET = 'attachments';

/**
 * Uploads a sick leave attachment to R2.
 * Returns the file key (relative path).
 */
export const uploadLeaveAttachment = async (file: File): Promise<string> => {
  console.log('Starting upload for:', file.name);
  const fileKey = await uploadFileToR2(file, BUCKET, 'sick_leave');
  console.log('File uploaded successfully. Path:', fileKey);
  return fileKey;
};

/**
 * Deletes a sick leave attachment from R2.
 */
export const deleteLeaveAttachment = async (filePath: string): Promise<void> => {
  const cleanPath = filePath.replace(/^\//, '');
  await deleteFile(BUCKET, cleanPath);
  console.log('File deleted successfully:', cleanPath);
};

/**
 * Gets a presigned download URL for a sick leave attachment (1 hour expiry).
 */
export const getLeaveAttachmentUrl = async (filePath: string): Promise<string> => {
  return getPresignedDownloadUrl(BUCKET, filePath);
};
