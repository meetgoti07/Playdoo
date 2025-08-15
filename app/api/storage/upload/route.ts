import { NextRequest, NextResponse } from 'next/server';
import { GCPStorageService } from '@/lib/storage/gcp-storage';

export async function POST(request: NextRequest) {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        endpoint: '/api/storage/upload',
        method: 'POST',
      },
      message: 'File upload request received.',
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const makePublic = formData.get('makePublic') === 'true';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (images, videos, documents)
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/webm',
      'video/x-msvideo', // .avi
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Determine folder based on file type if not specified
    let uploadFolder = folder || 'general';
    if (!folder) {
      if (file.type.startsWith('image/')) {
        uploadFolder = 'images';
      } else if (file.type.startsWith('video/')) {
        uploadFolder = 'videos';
      } else {
        uploadFolder = 'documents';
      }
    }

    // Upload file to GCP Storage
    const result = await GCPStorageService.uploadFile(file, {
      folder: uploadFolder,
      fileName: file.name,
      metadata: {
        uploadedBy: 'web-app',
        originalName: file.name,
        mimeType: file.type,
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        fileName: result.fileName,
        fileSize: result.fileSize,
        contentType: result.contentType,
        publicUrl: result.publicUrl,
      },
      message: 'File uploaded successfully.',
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'File uploaded successfully',
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'File upload failed.',
    });

    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '100');

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        folder,
        maxResults,
      },
      message: 'List files request received.',
    });

    const files = await GCPStorageService.listFiles(folder, maxResults);

    return NextResponse.json({
      success: true,
      data: files,
      message: 'Files retrieved successfully',
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to list files.',
    });

    return NextResponse.json(
      { 
        error: 'Failed to list files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
