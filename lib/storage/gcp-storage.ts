import { Storage } from '@google-cloud/storage';
import path from 'path';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || 'ivory-folder-464802-b3',
  keyFilename: path.join(process.cwd(), 'service-account-key.json'),
});

const bucketName = process.env.GCP_STORAGE_BUCKET || 'odoobucket-storage';
const bucket = storage.bucket(bucketName);

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  fileName: string;
  publicUrl: string;
  gsUrl: string;
  fileSize: number;
  contentType: string;
}

export class GCPStorageService {
  /**
   * Upload a file to Google Cloud Storage
   */
  static async uploadFile(
    file: File | Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        folder = 'uploads',
        fileName,
        metadata = {},
      } = options;

      // Generate unique filename if not provided
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      
      let finalFileName: string;
      if (fileName) {
        const ext = path.extname(fileName);
        const baseName = path.basename(fileName, ext);
        finalFileName = `${folder}/${timestamp}-${randomString}-${baseName}${ext}`;
      } else {
        // Try to get extension from file if it's a File object
        const ext = file instanceof File && file.name ? 
          path.extname(file.name) : '';
        finalFileName = `${folder}/${timestamp}-${randomString}${ext}`;
      }

      // Get file buffer and content type
      let buffer: Buffer;
      let contentType: string;
      let fileSize: number;

      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer());
        contentType = file.type || 'application/octet-stream';
        fileSize = file.size;
      } else {
        buffer = file;
        contentType = 'application/octet-stream';
        fileSize = buffer.length;
      }

      // Create a file reference in the bucket
      const fileRef = bucket.file(finalFileName);

      // Upload the file
      await fileRef.save(buffer, {
        metadata: {
          contentType,
          metadata: {
            originalName: file instanceof File ? file.name : 'unknown',
            uploadedAt: new Date().toISOString(),
            ...metadata,
          },
        },
        resumable: false,
      });


      // Generate public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${finalFileName}`;
      const gsUrl = `gs://${bucketName}/${finalFileName}`;

      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          fileName: finalFileName,
          fileSize,
          contentType,
          bucket: bucketName,
        },
        message: 'File uploaded successfully to GCP Storage.',
      });

      return {
        fileName: finalFileName,
        publicUrl,
        gsUrl,
        fileSize,
        contentType,
      };
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: 'Failed to upload file to GCP Storage.',
      });
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   */
  static async deleteFile(fileName: string): Promise<void> {
    try {
      const fileRef = bucket.file(fileName);
      await fileRef.delete();

      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          fileName,
          bucket: bucketName,
        },
        message: 'File deleted successfully from GCP Storage.',
      });
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        meta: { fileName },
        message: 'Failed to delete file from GCP Storage.',
      });
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a signed URL for temporary access to a private file
   */
  static async getSignedUrl(
    fileName: string,
    action: 'read' | 'write' = 'read',
    expiresInMinutes: number = 60
  ): Promise<string> {
    try {
      const options = {
        version: 'v4' as const,
        action,
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      };

      const [url] = await bucket.file(fileName).getSignedUrl(options);
      
      return url;
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        meta: { fileName, action, expiresInMinutes },
        message: 'Failed to generate signed URL.',
      });
      throw new Error(`Signed URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a file exists in the bucket
   */
  static async fileExists(fileName: string): Promise<boolean> {
    try {
      const [exists] = await bucket.file(fileName).exists();
      return exists;
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        meta: { fileName },
        message: 'Failed to check file existence.',
      });
      return false;
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(fileName: string) {
    try {
      const [metadata] = await bucket.file(fileName).getMetadata();
      return metadata;
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        meta: { fileName },
        message: 'Failed to get file metadata.',
      });
      throw new Error(`Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in a folder
   */
  static async listFiles(folder: string = '', maxResults: number = 100) {
    try {
      const [files] = await bucket.getFiles({
        prefix: folder,
        maxResults,
      });

      return files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        timeCreated: file.metadata.timeCreated,
        updated: file.metadata.updated,
        publicUrl: `https://storage.googleapis.com/${bucketName}/${file.name}`,
      }));
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        meta: { folder, maxResults },
        message: 'Failed to list files.',
      });
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copy a file within the bucket
   */
  static async copyFile(sourceFileName: string, destinationFileName: string): Promise<void> {
    try {
      const sourceFile = bucket.file(sourceFileName);
      await sourceFile.copy(bucket.file(destinationFileName));

      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          sourceFileName,
          destinationFileName,
          bucket: bucketName,
        },
        message: 'File copied successfully.',
      });
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        meta: { sourceFileName, destinationFileName },
        message: 'Failed to copy file.',
      });
      throw new Error(`Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default GCPStorageService;
