"use client";

import { usePopularVenues } from '@/hooks/swr/dashboard';
import { useAuthRedirect } from '@/hooks/auth/useAuthRedirect';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSportType } from '@/lib/utils';

export function PopularVenues() {
  const { venues, isLoading, error } = usePopularVenues();
  const { checkAuthForBooking } = useAuthRedirect();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (error || venues.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No popular venues found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Popular Venues</h2>
        <Link href="/venues">
          <Button variant="outline">View All</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {venues.map((venue) => {
          const primaryPhoto = venue.photos?.[0];
          const lowestPriceCourt = venue.courts?.[0];
          
          return (
            <Card key={venue.id} className="group overflow-hidden hover:shadow-lg transition-shadow pt-0">
              <div className="relative h-48 overflow-hidden">
                {primaryPhoto ? (
                  <img
                    src={primaryPhoto.url}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Venue Type Badge */}
                <Badge 
                  className="absolute top-3 left-3 bg-white text-gray-900"
                  variant="secondary"
                >
                  {venue.venueType}
                </Badge>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                  {venue.name}
                </h3>
                
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{venue.city}, {venue.state}</span>
                </div>
                
                {venue.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{venue.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({venue.totalReviews} reviews)
                    </span>
                  </div>
                )}
                
                {lowestPriceCourt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {formatSportType(lowestPriceCourt.sportType)}
                    </span>
                    <span className="font-semibold text-green-600">
                      ₹{lowestPriceCourt.pricePerHour}/hr
                    </span>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="p-4 pt-0 space-x-2">
                <Link href={`/venues/${venue.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Button 
                  className="flex-1"
                  onClick={() => checkAuthForBooking(venue.id)}
                >
                  Book Now
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
