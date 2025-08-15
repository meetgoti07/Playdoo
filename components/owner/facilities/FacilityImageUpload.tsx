'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export interface FacilityImage {
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
  error?: string;
}

interface FacilityImageUploadProps {
  onImagesChange: (images: FacilityImage[]) => void;
  maxImages?: number;
  maxSize?: number; // in MB
  className?: string;
}

export function FacilityImageUpload({
  onImagesChange,
  maxImages = 10,
  maxSize = 10,
  className = '',
}: FacilityImageUploadProps) {
  const [images, setImages] = useState<FacilityImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type - only images
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only image files are allowed (JPEG, PNG, GIF, WebP)';
    }

    return null;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const currentCount = images.length;
    const availableSlots = maxImages - currentCount;

    if (fileArray.length > availableSlots) {
      toast.error(`You can only upload ${availableSlots} more image(s). Maximum ${maxImages} images allowed.`);
      return;
    }

    const newImages: FacilityImage[] = [];
    
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      try {
        const preview = await createPreview(file);
        newImages.push({
          file,
          preview,
          uploaded: false,
        });
      } catch (error) {
        toast.error(`Failed to create preview for ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImages = async () => {
    if (images.length === 0) {
      toast.error('Please select images to upload');
      return;
    }

    setUploading(true);
    const updatedImages = [...images];

    try {
      for (let i = 0; i < updatedImages.length; i++) {
        const image = updatedImages[i];
        
        if (image.uploaded) continue; // Skip already uploaded images

        try {
          const formData = new FormData();
          formData.append('file', image.file);
          formData.append('folder', 'facility-images');
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
          updatedImages[i] = {
            ...image,
            uploaded: true,
            url: result.data.publicUrl,
            error: undefined,
          };

          toast.success(`${image.file.name} uploaded successfully`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          updatedImages[i] = {
            ...image,
            error: errorMessage,
          };
          toast.error(`${image.file.name}: ${errorMessage}`);
        }
      }

      setImages(updatedImages);
      onImagesChange(updatedImages);

    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const allImagesUploaded = images.length > 0 && images.every(img => img.uploaded);
  const hasUnuploadedImages = images.some(img => !img.uploaded);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={images.length >= maxImages}
        />
        
        <div className="flex flex-col items-center space-y-2">
          <ImageIcon className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              {images.length >= maxImages 
                ? `Maximum ${maxImages} images reached`
                : 'Click to upload or drag and drop facility images'
              }
            </p>
            <p className="text-xs text-gray-500">
              Max {maxSize}MB per image • JPEG, PNG, GIF, WebP • {images.length}/{maxImages} images
            </p>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Selected Images ({images.length}/{maxImages})
            </Label>
            {hasUnuploadedImages && (
              <Button
                onClick={uploadImages}
                disabled={uploading}
                size="sm"
                className="ml-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload All
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square">
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                    disabled={uploading}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Primary badge */}
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </span>
                    </div>
                  )}

                  {/* Upload status */}
                  <div className="absolute bottom-2 right-2">
                    {image.uploaded ? (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        ✓ Uploaded
                      </span>
                    ) : image.error ? (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        ✗ Error
                      </span>
                    ) : uploading ? (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        ⏳ Uploading
                      </span>
                    ) : (
                      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                        ○ Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* File info */}
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium truncate">{image.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.file.size)}
                  </p>
                  {image.error && (
                    <p className="text-xs text-red-500 mt-1">{image.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload status */}
          {allImagesUploaded && (
            <div className="text-center text-green-600 text-sm font-medium">
              ✓ All images uploaded successfully! You can now submit the form.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FacilityImageUpload;
