import useSWR from 'swr';
import { useState } from 'react';

export interface FileMetadata {
  name: string;
  bucket: string;
  size: number;
  contentType: string;
  timeCreated: string;
  updated: string;
  etag: string;
  generation: string;
  metadata?: Record<string, any>;
}

export interface SignedUrlResponse {
  signedUrl: string;
  fileName: string;
  action: string;
  expiresInMinutes: number;
  message: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileName: string;
  message: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  fileName: string;
  message: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
};

export function useStorageFiles(prefix?: string, maxResults?: number) {
  const queryParams = new URLSearchParams();
  if (prefix) queryParams.append('prefix', prefix);
  if (maxResults) queryParams.append('maxResults', maxResults.toString());
  
  const url = `/api/storage/files${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    files: data?.files as FileMetadata[] | undefined,
    count: data?.count as number | undefined,
    isLoading,
    error,
    refetch: mutate,
  };
}

export function useFileMetadata(fileName: string | null) {
  const url = fileName ? `/api/storage/files/${encodeURIComponent(fileName)}` : null;
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    file: data?.file as FileMetadata | undefined,
    isLoading,
    error,
    refetch: mutate,
  };
}

export function useStorageOperations() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);

  const generateUploadUrl = async (
    fileName: string,
    contentType?: string,
    expiresInMinutes?: number
  ): Promise<UploadUrlResponse> => {
    setIsGeneratingUrl(true);
    try {
      const response = await fetch('/api/storage/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          contentType,
          expiresInMinutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate upload URL');
      }

      return response.json();
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  const generateDownloadUrl = async (
    fileName: string,
    expiresInMinutes?: number
  ): Promise<DownloadUrlResponse> => {
    setIsGeneratingUrl(true);
    try {
      const response = await fetch('/api/storage/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          expiresInMinutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate download URL');
      }

      return response.json();
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  const generateSignedUrl = async (
    fileName: string,
    action: 'read' | 'write' | 'delete',
    expiresInMinutes?: number,
    contentType?: string,
    extensionHeaders?: Record<string, string>
  ): Promise<SignedUrlResponse> => {
    setIsGeneratingUrl(true);
    try {
      const response = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          action,
          expiresInMinutes,
          contentType,
          extensionHeaders,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate signed URL');
      }

      return response.json();
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  const uploadFile = async (
    file: File,
    fileName?: string,
    makePublic: boolean = false,
    metadata?: Record<string, any>
  ): Promise<{ file: FileMetadata; publicUrl?: string }> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (fileName) formData.append('fileName', fileName);
      formData.append('public', makePublic.toString());
      if (metadata) formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('/api/storage/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      return response.json();
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFileWithSignedUrl = async (
    file: File,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    setIsUploading(true);
    try {
      // First, get the signed upload URL
      const { uploadUrl } = await generateUploadUrl(fileName, file.type);

      // Upload the file using the signed URL
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (fileName: string): Promise<void> => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/storage/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const updateFileMetadata = async (
    fileName: string,
    metadata: Record<string, any>
  ): Promise<FileMetadata> => {
    const response = await fetch(`/api/storage/files/${encodeURIComponent(fileName)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update file metadata');
    }

    const result = await response.json();
    return result.file;
  };

  return {
    generateUploadUrl,
    generateDownloadUrl,
    generateSignedUrl,
    uploadFile,
    uploadFileWithSignedUrl,
    deleteFile,
    updateFileMetadata,
    isUploading,
    isDeleting,
    isGeneratingUrl,
  };
}
