"use client";

import { useFeaturedDeals } from '@/hooks/swr/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Percent, Tag } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSportType } from '@/lib/utils';

interface Deal {
  id: string;
  hashId: string;
  facilityId: string;
  facility: {
    name: string;
    city: string;
    state: string;
    rating?: number;
    photos: Array<{ url: string; isPrimary: boolean }>;
    courts: Array<{
      sportType: string;
      pricePerHour: number;
    }>;
  };
  title: string;
  description: string;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  maxBookings?: number;
  usedBookings?: number;
}

export function FeaturedDeals() {
  const { deals, isLoading, error } = useFeaturedDeals();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !deals || deals.length === 0) {
    return null; // Don't show section if no deals
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Featured Deals</h2>
          <p className="text-gray-600 mt-1">Limited time offers on popular venues</p>
        </div>
        <Link href="/deals">
          <Button variant="outline" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            View All Deals
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.slice(0, 6).map((deal) => {
          const primaryPhoto = deal.facility.photos.find(p => p.isPrimary) || deal.facility.photos[0];
          const mainSport = deal.facility.courts[0];
          const daysRemaining = getDaysRemaining(deal.validTo);
          const remainingBookings = deal.maxBookings ? deal.maxBookings - (deal.usedBookings || 0) : null;

          return (
            <Card key={deal.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <div className="relative">
                {/* Deal Image */}
                <div className="relative h-48 overflow-hidden">
                  {primaryPhoto ? (
                    <img
                      src={primaryPhoto.url}
                      alt={deal.facility.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Tag className="h-12 w-12 text-white" />
                    </div>
                  )}
                  
                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-red-600 text-white font-bold text-sm px-3 py-1">
                      <Percent className="w-3 h-3 mr-1" />
                      {deal.discountPercentage}% OFF
                    </Badge>
                  </div>

                  {/* Urgency Badge */}
                  {daysRemaining <= 3 && daysRemaining > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="destructive" className="font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        {daysRemaining} days left
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-5">
                  {/* Deal Title */}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900">
                    {deal.title}
                  </h3>
                  
                  {/* Facility Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{deal.facility.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {deal.facility.city}, {deal.facility.state}
                      </span>
                      
                      {deal.facility.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{deal.facility.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sport Type */}
                  {mainSport && (
                    <div className="mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {formatSportType(mainSport.sportType)}
                      </Badge>
                    </div>
                  )}

                  {/* Deal Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {deal.description}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-green-600">
                      ₹{deal.discountedPrice}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      ₹{deal.originalPrice}
                    </span>
                  </div>

                  {/* Deal Availability */}
                  {remainingBookings && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Bookings remaining</span>
                        <span className="font-medium">{remainingBookings}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${((deal.usedBookings || 0) / deal.maxBookings!) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Valid Until */}
                  <div className="text-xs text-gray-500 mb-4">
                    Valid until {formatDate(deal.validTo)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link href={`/venues/${deal.facility.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/deals/${deal.id}`} className="flex-1">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Claim Deal
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
