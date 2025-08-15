"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, MapPin, Phone, Mail, Globe, Calendar, Users, Star, 
  Clock, Building2, Image as ImageIcon, Settings
} from "lucide-react";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FacilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params.id as string;

  const { data: facilityData, isLoading, error, mutate } = useSWR(
    `/api/owner/facilities/${facilityId}`,
    fetcher
  );
  const facility = facilityData?.facility;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Facility Not Found</h3>
              <p className="text-gray-600 mb-4">
                The facility you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => router.push('/owner/facilities')}>
                Back to Facilities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{facility.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(facility.status)}>
              {facility.status}
            </Badge>
            <Badge variant="outline">
              {facility.venueType}
            </Badge>
            {facility.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{facility.rating}</span>
                <span className="text-sm text-gray-500">({facility.totalReviews} reviews)</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/owner/facilities/${facilityId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Facility
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Facility Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-gray-600">
                    {facility.address}<br />
                    {facility.city}, {facility.state} {facility.pincode}<br />
                    {facility.country}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-gray-600">{facility.phone}</p>
                </div>
              </div>

              {facility.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">{facility.email}</p>
                  </div>
                </div>
              )}

              {facility.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Website</p>
                    <a 
                      href={facility.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {facility.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(facility.createdAt), 'PPP')}
                  </p>
                </div>
              </div>

              {facility.approvedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">Approved</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(facility.approvedAt), 'PPP')}
                    </p>
                  </div>
                </div>
              )}

              {facility.rejectedAt && facility.rejectionReason && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-red-500 mt-1" />
                  <div>
                    <p className="font-medium">Rejected</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(facility.rejectedAt), 'PPP')}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Reason: {facility.rejectionReason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {facility.description && (
            <div className="pt-4 border-t">
              <p className="font-medium mb-2">Description</p>
              <p className="text-sm text-gray-600">{facility.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="courts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courts">Courts</TabsTrigger>
          <TabsTrigger value="hours">Operating Hours</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="courts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Courts</CardTitle>
              <CardDescription>
                Manage courts for this facility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-2">
                  Go to the dedicated courts page to manage courts and time slots.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push(`/owner/facilities/${facilityId}/courts`)}
                >
                  Manage Courts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
              <CardDescription>
                Set the operating hours for your facility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {facility.operatingHours && facility.operatingHours.length > 0 ? (
                <div className="space-y-3">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                    const hours = facility.operatingHours.find((oh: any) => oh.dayOfWeek === index);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="font-medium">{day}</div>
                        <div className="text-sm text-gray-600">
                          {hours && !hours.isClosed ? (
                            `${hours.openTime} - ${hours.closeTime}`
                          ) : (
                            <span className="text-red-600">Closed</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-2">No operating hours set yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amenities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                Facility amenities and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {facility.amenities && facility.amenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {facility.amenities.map((facilityAmenity: any) => (
                    <div 
                      key={facilityAmenity.amenity.id} 
                      className="flex items-center gap-2 p-2 border rounded-lg"
                    >
                      {facilityAmenity.amenity.icon && (
                        <span className="text-lg">{facilityAmenity.amenity.icon}</span>
                      )}
                      <span className="text-sm">{facilityAmenity.amenity.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No amenities added yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Facility photos and gallery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {facility.photos && facility.photos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facility.photos.map((photo: any) => (
                    <div 
                      key={photo.id} 
                      className="relative aspect-video rounded-lg overflow-hidden border"
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.caption || facility.name}
                        className="w-full h-full object-cover"
                      />
                      {photo.isPrimary && (
                        <Badge className="absolute top-2 left-2">Primary</Badge>
                      )}
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                          <p className="text-sm">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-2">No photos uploaded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
