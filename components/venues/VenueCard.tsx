"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReportButton } from '@/components/ui/ReportButton';
import { 
  Star, 
  MapPin, 
  IndianRupee, 
  Users,
  Calendar,
  Clock,
  Wifi,
  Car,
  Camera,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Venue } from '@/hooks/swr/venues/useVenues';

interface VenueCardProps {
  venue: Venue;
  viewMode: 'grid' | 'list';
}

export function VenueCard({ venue, viewMode }: VenueCardProps) {
  const formatSportType = (sportType: string) => {
    return sportType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatVenueType = (venueType: string) => {
    return venueType.charAt(0).toUpperCase() + venueType.slice(1).toLowerCase();
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 pt-0 pb-0">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative w-full md:w-80 h-48 md:h-auto">
            {venue.primaryPhoto ? (
              <Image
                src={venue.primaryPhoto}
                alt={venue.name}
                fill
                className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-lg md:rounded-l-lg md:rounded-t-none">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Venue Type Badge */}
            <Badge 
              variant="secondary" 
              className="absolute top-3 left-3 bg-white/90 text-gray-700"
            >
              {formatVenueType(venue.venueType)}
            </Badge>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                    {venue.name}
                  </h3>
                  <div className="flex items-center ml-2 gap-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-700 ml-1">
                        {venue.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({venue.totalReviews})
                      </span>
                    </div>
                    
                    {/* Report Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <ReportButton
                            targetType="VENUE"
                            targetId={venue.id}
                            variant="ghost"
                            size="sm"
                            inDropdown={true}
                            className="w-full justify-start border-0 p-0 h-auto font-normal"
                          />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{venue.city}, {venue.state}</span>
                </div>

                {venue.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {venue.description}
                  </p>
                )}

                {/* Sport Types */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {venue.sportTypes.slice(0, 3).map((sport) => (
                    <Badge key={sport} variant="outline" className="text-xs">
                      {formatSportType(sport)}
                    </Badge>
                  ))}
                  {venue.sportTypes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{venue.sportTypes.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Amenities */}
                {venue.amenities.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    {venue.amenities.slice(0, 4).map((amenity) => (
                      <div
                        key={amenity.id}
                        className="flex items-center text-xs text-gray-500"
                        title={amenity.name}
                      >
                        {amenity.icon === 'wifi' && <Wifi className="w-3 h-3" />}
                        {amenity.icon === 'parking' && <Car className="w-3 h-3" />}
                        {amenity.icon === 'users' && <Users className="w-3 h-3" />}
                      </div>
                    ))}
                    {venue.amenities.length > 4 && (
                      <span className="text-xs text-gray-400">
                        +{venue.amenities.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center">
                  <IndianRupee className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    {venue.minPrice}
                  </span>
                  {venue.minPrice !== venue.maxPrice && (
                    <span className="text-sm text-gray-500 ml-1">
                      - ₹{venue.maxPrice}
                    </span>
                  )}
                  <span className="text-sm text-gray-500 ml-1">/hour</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/venues/${venue.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/venues/${venue.id}?action=book`}>
                      <Calendar className="w-4 h-4 mr-1" />
                      Book Now
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden pt-0">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {venue.primaryPhoto ? (
          <Image
            src={venue.primaryPhoto}
            alt={venue.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Camera className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Venue Type Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 bg-white/90 text-gray-700"
        >
          {formatVenueType(venue.venueType)}
        </Badge>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {/* Rating Badge */}
          <div className="bg-white/90 rounded-full px-2 py-1 flex items-center">
            <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
            <span className="text-xs font-medium text-gray-700">
              {venue.rating.toFixed(1)}
            </span>
          </div>

          {/* Report Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white w-8 h-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <ReportButton
                  targetType="VENUE"
                  targetId={venue.id}
                  variant="ghost"
                  size="sm"
                  inDropdown={true}
                  className="w-full justify-start border-0 p-0 h-auto font-normal"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
            {venue.name}
          </h3>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm line-clamp-1">{venue.city}, {venue.state}</span>
          </div>
        </div>

        {/* Description */}
        {venue.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {venue.description}
          </p>
        )}

        {/* Sport Types */}
        <div className="flex flex-wrap gap-1 mb-3">
          {venue.sportTypes.slice(0, 2).map((sport) => (
            <Badge key={sport} variant="outline" className="text-xs">
              {formatSportType(sport)}
            </Badge>
          ))}
          {venue.sportTypes.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{venue.sportTypes.length - 2} more
            </Badge>
          )}
        </div>

        {/* Amenities */}
        {venue.amenities.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {venue.amenities.slice(0, 3).map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-center text-xs text-gray-500"
                title={amenity.name}
              >
                {amenity.icon === 'wifi' && <Wifi className="w-3 h-3" />}
                {amenity.icon === 'parking' && <Car className="w-3 h-3" />}
                {amenity.icon === 'users' && <Users className="w-3 h-3" />}
              </div>
            ))}
            {venue.amenities.length > 3 && (
              <span className="text-xs text-gray-400">
                +{venue.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center">
            <IndianRupee className="w-4 h-4 text-green-600" />
            <span className="text-lg font-semibold text-gray-900">
              {venue.minPrice}
            </span>
            {venue.minPrice !== venue.maxPrice && (
              <span className="text-sm text-gray-500 ml-1">
                - ₹{venue.maxPrice}
              </span>
            )}
            <span className="text-sm text-gray-500 ml-1">/hr</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500">{venue.totalReviews} reviews</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/venues/${venue.id}`}>
              View Details
            </Link>
          </Button>
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/venues/${venue.id}?action=book`}>
              <Calendar className="w-4 h-4 mr-1" />
              Book
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
