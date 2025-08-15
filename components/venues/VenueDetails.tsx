
"use client"
import { useState } from 'react';
import { useVenueDetails } from '@/hooks/swr/venues';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueReviews } from '@/components/reviews';
import { ReportButton } from '@/components/ui/ReportButton';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  Users,
  Wifi,
  Car,
  Camera,
  ChevronLeft,
  ChevronRight,
  Calendar,
  IndianRupee,
  Check,
  X,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSportType } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface VenueDetailsProps {
  id: string;
}

export function VenueDetails({ id }: VenueDetailsProps) {
  const { venue, isLoading, error } = useVenueDetails(id);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);

  if (isLoading) {
    return <VenueDetailsSkeleton />;
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Venue not found</h2>
          <p className="text-gray-600 mb-4">The venue you're looking for doesn't exist or has been removed.</p>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeCourts = venue.courts.filter(court => court.isActive);
  const primaryPhoto = venue.photos.find(p => p.isPrimary) || venue.photos[0];
  const lowestPrice = activeCourts.length > 0 ? Math.min(...activeCourts.map(c => c.pricePerHour)) : 0;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % venue.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + venue.photos.length) % venue.photos.length);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/search">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Search
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <Card className="overflow-hidden">
              <div className="relative h-96">
                {venue.photos.length > 0 ? (
                  <>
                    <Image
                      src={venue.photos[currentPhotoIndex].url}
                      alt={venue.name}
                      fill
                      className="object-cover"
                    />
                    
                    {venue.photos.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                          onClick={prevPhoto}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                          onClick={nextPhoto}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>

                        {/* Photo Counter */}
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          {currentPhotoIndex + 1} / {venue.photos.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
            </Card>

            {/* Venue Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-start justify-between mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
                      
                      {/* Report Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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
                    
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="h-5 w-5" />
                      <span>{venue.address}, {venue.city}, {venue.state}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {venue.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{venue.rating.toFixed(1)}</span>
                          <span className="text-gray-500">({venue.totalReviews} reviews)</span>
                        </div>
                      )}
                      <Badge variant="secondary">{venue.venueType}</Badge>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold text-green-600">₹{lowestPrice}+</div>
                    <div className="text-sm text-gray-500">per hour</div>
                  </div>
                </div>

                {venue.description && (
                  <p className="text-gray-700 leading-relaxed">{venue.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="courts" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="courts">Courts</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="hours">Hours</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Courts Tab */}
              <TabsContent value="courts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Courts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {activeCourts.map((court) => (
                        <div
                          key={court.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedCourt === court.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedCourt(court.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{court.name}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">{formatSportType(court.sportType)}</Badge>
                                {court.capacity && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>Max {court.capacity} players</span>
                                  </div>
                                )}
                              </div>
                              {court.description && (
                                <p className="text-gray-600 mt-2">{court.description}</p>
                              )}
                              {(court.length && court.width) && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Dimensions: {court.length}m × {court.width}m
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                ₹{court.pricePerHour}
                              </div>
                              <div className="text-sm text-gray-500">per hour</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Amenities Tab */}
              <TabsContent value="amenities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities & Facilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {venue.amenities.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {venue.amenities.map((amenity) => (
                          <div key={amenity.name} className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <span>{amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No amenities listed</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Operating Hours Tab */}
              <TabsContent value="hours" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Operating Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {venue.operatingHours.map((hours) => (
                        <div key={hours.dayOfWeek} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium">{getDayName(hours.dayOfWeek)}</span>
                          <span className={hours.isClosed ? 'text-red-600' : 'text-gray-900'}>
                            {hours.isClosed ? 'Closed' : `${formatTime(hours.openTime)} - ${formatTime(hours.closeTime)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-4">
                <VenueReviews venueId={id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Book Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">₹{lowestPrice}+</div>
                  <div className="text-sm text-gray-500">Starting price per hour</div>
                </div>
                
                <Link href={`/venues/${id}/book`} className="w-full">
                  <Button className="w-full" size="lg">
                    Book Now
                  </Button>
                </Link>
                
                <div className="text-xs text-gray-500 text-center">
                  Choose your preferred court and time slot
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{venue.phone}</span>
                </div>
                {venue.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{venue.email}</span>
                  </div>
                )}
                {venue.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a 
                      href={venue.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Courts:</span>
                  <span className="font-semibold">{activeCourts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sports Available:</span>
                  <span className="font-semibold">
                    {[...new Set(activeCourts.map(c => c.sportType))].length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Range:</span>
                  <span className="font-semibold">
                    ₹{Math.min(...activeCourts.map(c => c.pricePerHour))} - ₹{Math.max(...activeCourts.map(c => c.pricePerHour))}
                  </span>
                </div>
                {venue.rating && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Rating:</span>
                    <span className="font-semibold">{venue.rating.toFixed(1)}/5</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function VenueDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
