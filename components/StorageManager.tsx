'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useStorageFiles, useStorageOperations, useFileMetadata } from '@/lib/hooks/useStorage';
import { Upload, Download, Trash2, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function StorageManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [deleteFileName, setDeleteFileName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [selectedFileForMetadata, setSelectedFileForMetadata] = useState('');
  const [connectionTest, setConnectionTest] = useState<{
    tested: boolean;
    success: boolean;
    error?: string;
    authMethod?: string;
  }>({ tested: false, success: false });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files, isLoading: filesLoading, refetch } = useStorageFiles(prefix || undefined);
  const { file: fileMetadata, isLoading: metadataLoading } = useFileMetadata(
    selectedFileForMetadata || null
  );
  
  const {
    uploadFile,
    uploadFileWithSignedUrl,
    generateDownloadUrl,
    deleteFile,
    isUploading,
    isDeleting,
    isGeneratingUrl,
  } = useStorageOperations();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleDirectUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const result = await uploadFile(selectedFile, fileName || selectedFile.name, false);
      toast.success(`File uploaded successfully: ${result.file.name}`);
      setSelectedFile(null);
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      refetch();
    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSignedUrlUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      await uploadFileWithSignedUrl(
        selectedFile,
        fileName || selectedFile.name,
        (progress) => setUploadProgress(progress)
      );
      toast.success(`File uploaded successfully: ${fileName || selectedFile.name}`);
      setSelectedFile(null);
      setFileName('');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      refetch();
    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
    }
  };

  const handleDownload = async () => {
    if (!downloadFileName) {
      toast.error('Please enter a file name to download');
      return;
    }

    try {
      const result = await generateDownloadUrl(downloadFileName);
      // Open the download URL in a new window/tab
      window.open(result.downloadUrl, '_blank');
      toast.success('Download URL generated successfully');
    } catch (error) {
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteFileName) {
      toast.error('Please enter a file name to delete');
      return;
    }

    try {
      await deleteFile(deleteFileName);
      toast.success(`File deleted successfully: ${deleteFileName}`);
      setDeleteFileName('');
      refetch();
    } catch (error) {
      toast.error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileItemDownload = async (fileName: string) => {
    try {
      const result = await generateDownloadUrl(fileName);
      window.open(result.downloadUrl, '_blank');
      toast.success('Download URL generated successfully');
    } catch (error) {
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileItemDelete = async (fileName: string) => {
    try {
      await deleteFile(fileName);
      toast.success(`File deleted successfully: ${fileName}`);
      refetch();
    } catch (error) {
      toast.error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/storage/test');
      const result = await response.json();
      
      setConnectionTest({
        tested: true,
        success: result.success,
        error: result.error,
        authMethod: result.authMethod
      });

      if (result.success) {
        toast.success(`Connection successful! Using: ${result.authMethod}`);
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionTest({
        tested: true,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Failed to test connection');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">GCP Cloud Storage Manager</h1>
        <p className="text-gray-600">Upload, download, and manage files in Google Cloud Storage</p>
      </div>

      {/* Connection Test Section */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          <Button
            onClick={testConnection}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Test Connection
          </Button>
        </div>
        
        {connectionTest.tested && (
          <div className={`p-4 rounded-lg ${
            connectionTest.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {connectionTest.success ? (
              <div>
                <p className="font-semibold">✅ Connection Successful!</p>
                {connectionTest.authMethod && (
                  <p className="text-sm mt-1">Authentication method: {connectionTest.authMethod}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-semibold">❌ Connection Failed</p>
                <p className="text-sm mt-1">{connectionTest.error}</p>
                <div className="mt-3">
                  <p className="text-sm font-medium">Troubleshooting suggestions:</p>
                  <ul className="text-xs mt-1 space-y-1 ml-4 list-disc">
                    <li>Set <code className="bg-red-100 px-1 rounded">GCP_STORAGE_BUCKET</code> in your .env.local</li>
                    <li>Set <code className="bg-red-100 px-1 rounded">GCP_API_KEY</code> or <code className="bg-red-100 px-1 rounded">GCP_KEY_FILE</code></li>
                    <li>Set <code className="bg-red-100 px-1 rounded">GCP_PROJECT_ID</code> if using API key</li>
                    <li>Verify bucket exists and you have proper permissions</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-input">Select File</Label>
            <Input
              id="file-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {selectedFile && (
            <div>
              <Label htmlFor="file-name">File Name (optional)</Label>
              <Input
                id="file-name"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={selectedFile.name}
                className="mt-1"
              />
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleDirectUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Direct Upload'}
            </Button>
            
            <Button
              onClick={handleSignedUrlUpload}
              disabled={!selectedFile || isUploading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Signed URL Upload'}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Download Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Download File</h2>
        
        <div className="flex gap-2">
          <Input
            type="text"
            value={downloadFileName}
            onChange={(e) => setDownloadFileName(e.target.value)}
            placeholder="Enter file name to download"
            className="flex-1"
          />
          <Button
            onClick={handleDownload}
            disabled={!downloadFileName || isGeneratingUrl}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isGeneratingUrl ? 'Generating...' : 'Download'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Delete Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Delete File</h2>
        
        <div className="flex gap-2">
          <Input
            type="text"
            value={deleteFileName}
            onChange={(e) => setDeleteFileName(e.target.value)}
            placeholder="Enter file name to delete"
            className="flex-1"
          />
          <Button
            onClick={handleDelete}
            disabled={!deleteFileName || isDeleting}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* File List Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Files in Storage</h2>
          <Button
            onClick={() => refetch()}
            disabled={filesLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${filesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-4">
          <Label htmlFor="prefix-filter">Filter by prefix</Label>
          <Input
            id="prefix-filter"
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="Enter prefix to filter files"
            className="mt-1"
          />
        </div>

        {filesLoading ? (
          <div className="text-center py-8">Loading files...</div>
        ) : files && files.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Size</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Modified</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.name} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {file.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {file.contentType}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {formatDate(file.updated)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => handleFileItemDownload(file.name)}
                          disabled={isGeneratingUrl}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                        <Button
                          onClick={() => setSelectedFileForMetadata(file.name)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Info
                        </Button>
                        <Button
                          onClick={() => handleFileItemDelete(file.name)}
                          disabled={isDeleting}
                          size="sm"
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No files found in storage
          </div>
        )}
      </div>

      {/* File Metadata Section */}
      {selectedFileForMetadata && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">File Metadata</h2>
            <Button
              onClick={() => setSelectedFileForMetadata('')}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>

          {metadataLoading ? (
            <div className="text-center py-4">Loading metadata...</div>
          ) : fileMetadata ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm text-gray-600">{fileMetadata.name}</p>
              </div>
              <div>
                <Label>Size</Label>
                <p className="text-sm text-gray-600">{formatFileSize(fileMetadata.size)}</p>
              </div>
              <div>
                <Label>Content Type</Label>
                <p className="text-sm text-gray-600">{fileMetadata.contentType}</p>
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm text-gray-600">{formatDate(fileMetadata.timeCreated)}</p>
              </div>
              <div>
                <Label>Modified</Label>
                <p className="text-sm text-gray-600">{formatDate(fileMetadata.updated)}</p>
              </div>
              <div>
                <Label>ETag</Label>
                <p className="text-sm text-gray-600 truncate">{fileMetadata.etag}</p>
              </div>
              <div className="col-span-2">
                <Label>Bucket</Label>
                <p className="text-sm text-gray-600">{fileMetadata.bucket}</p>
              </div>
              {fileMetadata.metadata && Object.keys(fileMetadata.metadata).length > 0 && (
                <div className="col-span-2">
                  <Label>Custom Metadata</Label>
                  <pre className="text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(fileMetadata.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-red-500">
              Failed to load file metadata
            </div>
          )}
        </div>
      )}
    </div>
  );
}
