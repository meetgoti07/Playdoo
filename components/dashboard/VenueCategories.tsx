"use client";

import { useVenuesByCategory } from '@/hooks/swr/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Building, Trees, Crown, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSportType } from '@/lib/utils';

const categoryIcons = {
  'Indoor Venues': Building,
  'Outdoor Venues': Trees,
  'Premium Venues': Crown,
  'Budget-Friendly': DollarSign,
};

export function VenueCategories() {
  const { categories, cities, isLoading, error } = useVenuesByCategory();

  if (isLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
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
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load venue categories</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Venue Categories */}
      {categories.map((category) => {
        if (category.venues.length === 0) return null;
        
        const IconComponent = categoryIcons[category.title as keyof typeof categoryIcons];
        
        return (
          <div key={category.title} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {IconComponent && <IconComponent className="h-6 w-6 text-gray-600" />}
                  <h2 className="text-2xl font-bold text-gray-900">
                    {category.title}
                  </h2>
                </div>
                <p className="text-gray-600">{category.description}</p>
              </div>
              <Link href={`/venues?category=${encodeURIComponent(category.title.toLowerCase())}`}>
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.venues.slice(0, 6).map((venue) => {
                const primaryPhoto = venue.photos[0];
                const lowestPriceCourt = venue.courts[0];
                
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
                          {IconComponent && <IconComponent className="h-12 w-12 text-gray-400" />}
                        </div>
                      )}
                      
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
                      
                      <Link href={`/venues/${venue.id}`} className="block mt-3">
                        <Button className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Venues by City */}
      {cities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">
                Venues by City
              </h2>
              <p className="text-gray-600">Discover sports facilities in popular cities</p>
            </div>
            <Link href="/cities">
              <Button variant="outline">View All Cities</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cities.slice(0, 8).map((cityGroup) => (
              <Card key={cityGroup.city} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{cityGroup.city}</span>
                    <Badge variant="secondary">
                      {cityGroup.venueCount} venues
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {cityGroup.venues.slice(0, 4).map((venue) => (
                      <Link
                        key={venue.id}
                        href={`/venues/${venue.id}`}
                        className="block"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden">
                          {venue.photos[0] ? (
                            <img
                              src={venue.photos[0].url}
                              alt={venue.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Building className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  <Link href={`/search?city=${encodeURIComponent(cityGroup.city)}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Explore {cityGroup.city}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
