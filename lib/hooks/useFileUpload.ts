'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UploadedFile {
  fileName: string;
  publicUrl: string;
  fileSize: number;
  contentType: string;
}

export interface UseFileUploadOptions {
  folder?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    folder,
    maxSize = 50,
    allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/webm',
      'application/pdf',
      'text/plain',
    ],
    onUploadComplete,
    onUploadError,
  } = options;

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return 'File type not allowed';
    }

    return null;
  }, [maxSize, allowedTypes]);

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const error = validateFile(file);
    if (error) {
      throw new Error(error);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    formData.append('makePublic', 'true');

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  }, [folder, validateFile]);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    if (files.length === 0) {
      throw new Error('No files provided');
    }

    setUploading(true);
    setUploadProgress({});

    try {
      const results: UploadedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 0,
          }));

          const result = await uploadFile(file);
          results.push(result);

          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100,
          }));

          toast.success(`${file.name} uploaded successfully`);
          onUploadComplete?.(result);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          toast.error(`${file.name}: ${errorMessage}`);
          onUploadError?.(errorMessage);
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: -1, // Error state
          }));
        }
      }

      return results;

    } finally {
      setUploading(false);
      // Clear progress after a delay
      setTimeout(() => setUploadProgress({}), 2000);
    }
  }, [uploadFile, onUploadComplete, onUploadError]);

  const uploadSingleFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const results = await uploadFiles([file]);
    return results[0];
  }, [uploadFiles]);

  const deleteFile = useCallback(async (fileName: string): Promise<void> => {
    try {
      const response = await fetch(`/api/storage/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Delete failed');
      }

      toast.success('File deleted successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const getSignedUrl = useCallback(async (
    fileName: string,
    action: 'read' | 'write' = 'read',
    expiresInMinutes: number = 60
  ): Promise<string> => {
    try {
      const params = new URLSearchParams({
        action,
        expires: expiresInMinutes.toString(),
      });

      const response = await fetch(
        `/api/storage/${encodeURIComponent(fileName)}?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to get signed URL');
      }

      const result = await response.json();
      return result.data.signedUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get signed URL';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const listFiles = useCallback(async (
    folderPath?: string,
    maxResults: number = 100
  ): Promise<any[]> => {
    try {
      const params = new URLSearchParams();
      if (folderPath) params.set('folder', folderPath);
      params.set('maxResults', maxResults.toString());

      const response = await fetch(`/api/storage/upload?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to list files');
      }

      const result = await response.json();
      return result.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  return {
    // State
    uploading,
    uploadProgress,

    // Methods
    uploadFile: uploadSingleFile,
    uploadFiles,
    deleteFile,
    getSignedUrl,
    listFiles,
    validateFile,
  };
}

export default useFileUpload;
