const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Each public R2 bucket has its own dev domain. Key is used as-is (no bucket in path).
const BUCKET_PUBLIC_URLS: Record<string, string> = {
  'attachments':      (import.meta.env.VITE_R2_PUBLIC_URL_ATTACHMENTS as string || '').replace(/\/$/, ''),
  'content-image':    (import.meta.env.VITE_R2_PUBLIC_URL_CONTENT_IMAGE as string || '').replace(/\/$/, ''),
  'documents':        (import.meta.env.VITE_R2_PUBLIC_URL_DOCUMENTS as string || '').replace(/\/$/, ''),
  'jd-images':        (import.meta.env.VITE_R2_PUBLIC_URL_JD_IMAGES as string || '').replace(/\/$/, ''),
  'job-applications': (import.meta.env.VITE_R2_PUBLIC_URL_JOB_APPLICATIONS as string || '').replace(/\/$/, ''),
};

/**
 * Upload a file to R2 via the backend (avoids CORS issues with the R2 S3 endpoint).
 * Returns the file key (relative storage path).
 */
export async function uploadFileToR2(
  file: File,
  bucket: string,
  pathPrefix: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('path_prefix', pathPrefix);

  const res = await fetch(`${API_DOMAIN}/storage/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload file: ${res.statusText}`);
  }

  const { file_key } = await res.json();
  return file_key;
}

/**
 * Get a presigned download URL for a private file (e.g. attachments bucket).
 */
export async function getPresignedDownloadUrl(
  bucket: string,
  filePath: string
): Promise<string> {
  const res = await fetch(`${API_DOMAIN}/storage/presigned-download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, file_path: filePath }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get presigned download URL: ${res.statusText}`);
  }

  const { download_url } = await res.json();
  return download_url;
}

/**
 * Delete a file from R2 via the backend.
 */
export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  const res = await fetch(`${API_DOMAIN}/storage/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, file_path: filePath }),
  });

  if (!res.ok) {
    throw new Error(`Failed to delete file: ${res.statusText}`);
  }
}

/**
 * Construct a public URL for files in public R2 buckets.
 * URL format: {bucket-domain}/{key}  (bucket domain is bucket-specific)
 */
export function getPublicUrl(bucket: string, key: string): string {
  const base = BUCKET_PUBLIC_URLS[bucket] || '';
  return `${base}/${key}`;
}
