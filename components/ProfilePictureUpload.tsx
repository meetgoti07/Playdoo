'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, Loader2, User } from 'lucide-react';
import Image from 'next/image';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

export function ProfilePictureUpload({
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  size = 'md',
  className = '',
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size (max 5MB for profile pictures)
    if (file.size > 5 * 1024 * 1024) {
      return 'Image size must be less than 5MB';
    }

    // Check file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed';
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      onUploadError?.(error);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'profile-pictures');
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
      const imageUrl = result.data.publicUrl;

      toast.success('Profile picture updated successfully');
      onUploadComplete?.(imageUrl);
      setPreviewUrl(null);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200`}>
        {displayImage ? (
          <Image
            src={displayImage}
            alt="Profile"
            fill
            className="object-cover"
            sizes="(max-width: 128px) 100vw, 128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <User className="w-1/2 h-1/2 text-gray-400" />
          </div>
        )}

        {/* Upload overlay */}
        <div
          className={`
            absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center
            transition-opacity cursor-pointer
            ${uploading ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
          `}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload button for accessibility */}
      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="w-4 h-4 mr-2" />
            Change Photo
          </>
        )}
      </Button>
    </div>
  );
}

export default ProfilePictureUpload;
