import useSWR from 'swr';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  fullName?: string;
  avatar?: string;
  bio?: string;
  preferredSports: string[];
  maxDistance?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  isPhoneVerified?: boolean;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userProfile?: UserProfile;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  city?: string;
  state?: string;
  country?: string;
  fullName?: string;
  bio?: string;
  preferredSports?: string[];
  maxDistance?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<{ user: User }>(
    '/api/profile',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      
      // Update the cached data
      await mutate();
      
      toast.success('Profile updated successfully');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateAvatar = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile picture');
      }

      const result = await response.json();
      
      // Update the cached data
      await mutate();
      
      toast.success('Profile picture updated successfully');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteAvatar = async () => {
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete profile picture');
      }

      const result = await response.json();
      
      // Update the cached data
      await mutate();
      
      toast.success('Profile picture deleted successfully');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete profile picture';
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    user: data?.user,
    isLoading,
    error,
    updateProfile,
    updateAvatar,
    deleteAvatar,
    mutate,
  };
}
