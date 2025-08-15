"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileUpload, { UploadedFile } from '@/components/FileUpload';
import { useProfile, User } from '@/hooks/swr/profile/useProfile';
import { 
  Camera, 
  Trash2, 
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileImageUploadProps {
  user: User;
}

export function ProfileImageUpload({ user }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateAvatar, deleteAvatar } = useProfile();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const currentAvatar = user.image || user.userProfile?.avatar;

  const handleUploadComplete = async (file: UploadedFile) => {
    setIsUploading(true);
    try {
      await updateAvatar(file.publicUrl);
    } catch (error) {
      console.error('Failed to update avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(`Upload failed: ${error}`);
    setIsUploading(false);
  };

  const handleDeleteAvatar = async () => {
    if (!currentAvatar) return;

    setIsDeleting(true);
    try {
      await deleteAvatar();
    } catch (error) {
      console.error('Failed to delete avatar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Profile Picture
        </CardTitle>
        <CardDescription>
          Upload a profile picture to personalize your account. Recommended size: 400x400px.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
        {/* Current Avatar */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={currentAvatar} alt={user.name} />
            <AvatarFallback className="text-2xl font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          {currentAvatar && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAvatar}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Remove Picture'}
            </Button>
          )}
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            folder="avatars"
            maxSize={5} // 5MB
            allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
            multiple={false}
            className="w-full"
          />

          {/* Upload Guidelines */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="text-sm space-y-1 mt-1">
                <li>• Maximum file size: 5MB</li>
                <li>• Supported formats: JPEG, PNG, WebP</li>
                <li>• Square images work best (1:1 ratio)</li>
                <li>• Minimum resolution: 100x100px</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        {/* Upload Status */}
        {isUploading && (
          <Alert>
            <Upload className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Uploading and updating your profile picture...
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {currentAvatar && !isUploading && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Profile picture updated successfully!
            </AlertDescription>
          </Alert>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
