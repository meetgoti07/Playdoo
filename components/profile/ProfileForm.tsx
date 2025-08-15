"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile, User, UpdateProfileData } from '@/hooks/swr/profile/useProfile';
import { 
  Save, 
  User as UserIcon, 
  MapPin, 
  Calendar,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { updateProfile } = useProfile();

  const [formData, setFormData] = useState<UpdateProfileData>({
    name: user.name || '',
    fullName: user.userProfile?.fullName || '',
    bio: user.userProfile?.bio || '',
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    gender: user.gender as any || undefined,
    city: user.city || '',
    state: user.state || '',
    country: user.country || 'India',
  });

  const handleInputChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Only send fields that have values or have been explicitly changed
      const dataToSend: UpdateProfileData = {};
      
      if (formData.name && formData.name.trim() !== '') {
        dataToSend.name = formData.name.trim();
      }
      if (formData.fullName !== undefined) {
        dataToSend.fullName = formData.fullName.trim();
      }
      if (formData.bio !== undefined) {
        dataToSend.bio = formData.bio.trim();
      }
      if (formData.phone !== undefined) {
        dataToSend.phone = formData.phone.trim();
      }
      if (formData.dateOfBirth !== undefined) {
        dataToSend.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.gender !== undefined) {
        dataToSend.gender = formData.gender;
      }
      if (formData.city !== undefined) {
        dataToSend.city = formData.city.trim();
      }
      if (formData.state !== undefined) {
        dataToSend.state = formData.state.trim();
      }
      if (formData.country !== undefined) {
        dataToSend.country = formData.country.trim();
      }

      await updateProfile(dataToSend);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your personal details and contact information.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your display name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full legal name"
              />
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {formData.bio?.length || 0}/500 characters
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={formData.gender || ''} 
                onValueChange={(value) => handleInputChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter your city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter your state"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter your country"
                />
              </div>
            </div>
          </div>

          {/* Success Message */}
          {isSaved && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Profile updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading} className="min-w-32">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
