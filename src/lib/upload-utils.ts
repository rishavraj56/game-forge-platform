// Upload utilities for Game Forge Platform
// This file contains utilities for handling file uploads

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  type: string;
}

export interface UploadError {
  code: string;
  message: string;
}

// Validate file type for avatars
export function validateAvatarFile(file: File): UploadError | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: 'Avatar must be a JPEG, PNG, WebP, or GIF image'
    };
  }

  if (file.size > maxSize) {
    return {
      code: 'FILE_TOO_LARGE',
      message: 'Avatar file must be smaller than 5MB'
    };
  }

  return null;
}

// Generate a unique filename for uploads
export function generateFileName(originalName: string, userId: string, prefix: string = 'file'): string {
  const extension = originalName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${userId}_${timestamp}_${randomSuffix}.${extension}`;
}

// Mock upload function - replace with actual implementation
export async function uploadToStorage(file: File, fileName: string): Promise<UploadResult> {
  // TODO: Implement actual file upload to your chosen storage service
  // Options include:
  // - Vercel Blob Storage
  // - AWS S3
  // - Cloudinary
  // - Supabase Storage
  // - Google Cloud Storage
  
  // For now, return a mock result
  return {
    url: `/api/uploads/${fileName}`,
    fileName,
    size: file.size,
    type: file.type
  };
}

// Delete file from storage
export async function deleteFromStorage(fileUrl: string): Promise<void> {
  // TODO: Implement actual file deletion
  // Extract filename from URL and delete from storage service
  console.log(`Would delete file: ${fileUrl}`);
}

// Get file URL for serving
export function getFileUrl(fileName: string, type: 'avatar' | 'attachment' = 'avatar'): string {
  // TODO: Return actual URL based on your storage configuration
  return `/api/uploads/${type}s/${fileName}`;
}

// Validate file for general uploads (posts, attachments, etc.)
export function validateUploadFile(file: File, maxSize: number = 10 * 1024 * 1024): UploadError | null {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    // Documents
    'application/pdf', 'text/plain', 'text/markdown',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Archives
    'application/zip', 'application/x-rar-compressed',
    // Code files
    'text/javascript', 'text/css', 'application/json'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: 'File type not supported'
    };
  }

  if (file.size > maxSize) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File must be smaller than ${Math.round(maxSize / (1024 * 1024))}MB`
    };
  }

  return null;
}

// Convert file size to human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Extract file extension from filename
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Check if file is an image
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

// Generate thumbnail URL (for future implementation)
export function getThumbnailUrl(fileUrl: string, size: number = 150): string {
  // TODO: Implement thumbnail generation
  // For now, return original URL
  return fileUrl;
}