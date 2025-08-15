import useSWR from 'swr';

interface Facility {
  id: string;
  hashId: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string;
  website?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  venueType: 'INDOOR' | 'OUTDOOR' | 'HYBRID';
  rating?: number;
  totalReviews: number;
  isActive: boolean;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface OwnerFacilitiesResponse {
  facilities: Facility[];
}

const fetcher = async (url: string): Promise<OwnerFacilitiesResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch facilities');
  }
  return response.json();
};

export function useOwnerFacilities() {
  return useSWR<OwnerFacilitiesResponse>('/api/owner/facilities', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });
}
