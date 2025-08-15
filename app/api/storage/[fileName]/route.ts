import { NextRequest, NextResponse } from 'next/server';
import { GCPStorageService } from '@/lib/storage/gcp-storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const fileName = decodeURIComponent(params.fileName);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        fileName,
        endpoint: '/api/storage/delete',
      },
      message: 'File deletion request received.',
    });

    // Check if file exists before attempting deletion
    const exists = await GCPStorageService.fileExists(fileName);
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    await GCPStorageService.deleteFile(fileName);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        fileName,
      },
      message: 'File deleted successfully.',
    });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'File deletion failed.',
    });

    return NextResponse.json(
      { 
        error: 'Deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const fileName = decodeURIComponent(params.fileName);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') as 'read' | 'write' || 'read';
    const expiresInMinutes = parseInt(searchParams.get('expires') || '60');

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        fileName,
        action,
        expiresInMinutes,
      },
      message: 'Signed URL request received.',
    });

    const signedUrl = await GCPStorageService.getSignedUrl(
      fileName,
      action,
      expiresInMinutes
    );

    return NextResponse.json({
      success: true,
      data: {
        signedUrl,
        fileName,
        expiresInMinutes,
      },
      message: 'Signed URL generated successfully',
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to generate signed URL.',
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate signed URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
