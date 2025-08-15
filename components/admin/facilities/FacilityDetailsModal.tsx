"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  Star,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  ImageIcon,
  Wifi,
  Car,
  Coffee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface FacilityDetailsModalProps {
  facilityId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (facilityId: string, comments?: string) => void;
  onReject?: (facilityId: string, comments: string) => void;
  showActions?: boolean;
}

interface FacilityDetails {
  id: string;
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
  status: string;
  venueType: string;
  rating?: number;
  totalReviews: number;
  isActive: boolean;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    name: string;
    email: string;
    phone?: string;
    image?: string;
  };
  courts: Array<{
    id: string;
    name: string;
    sportType: string;
    isActive: boolean;
    pricePerHour: number;
  }>;
  amenities: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
  photos: Array<{
    id: string;
    url: string;
    description?: string;
  }>;
  operatingHours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  _count: {
    bookings: number;
    reviews: number;
  };
}

export function FacilityDetailsModal({
  facilityId,
  isOpen,
  onClose,
  onApprove,
  onReject,
  showActions = false,
}: FacilityDetailsModalProps) {
  const [facility, setFacility] = useState<FacilityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [actionComments, setActionComments] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    if (facilityId && isOpen) {
      fetchFacilityDetails();
    }
  }, [facilityId, isOpen]);

  const fetchFacilityDetails = async () => {
    if (!facilityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/facilities/${facilityId}/details`);
      if (!response.ok) {
        throw new Error("Failed to fetch facility details");
      }
      const data = await response.json();
      setFacility(data);
    } catch (err) {
      setError("Failed to load facility details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (type: "approve" | "reject") => {
    setActionType(type);
    setShowActionDialog(true);
  };

  const executeAction = async () => {
    if (!facility || !actionType) return;

    if (actionType === "approve" && onApprove) {
      onApprove(facility.id, actionComments);
    } else if (actionType === "reject" && onReject) {
      onReject(facility.id, actionComments);
    }

    setShowActionDialog(false);
    setActionComments("");
    setActionType(null);
    onClose();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      PENDING: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      APPROVED: { className: "bg-green-100 text-green-800", label: "Approved" },
      REJECTED: { className: "bg-red-100 text-red-800", label: "Rejected" },
      SUSPENDED: { className: "bg-gray-100 text-gray-800", label: "Suspended" },
    };

    const variant = variants[status] || variants.PENDING;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const nextImage = () => {
    if (facility?.photos) {
      setCurrentImageIndex((prev) => 
        prev === facility.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (facility?.photos) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? facility.photos.length - 1 : prev - 1
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-w-[80%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Facility Details</span>
              {showActions && facility && facility.status === "PENDING" && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50 hover:border-green-700"
                    onClick={() => handleAction("approve")}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700"
                    onClick={() => handleAction("reject")}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-6 p-6">
              <div className="flex items-start space-x-6">
                <Skeleton className="h-24 w-24 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-96" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <Button onClick={fetchFacilityDetails}>Retry</Button>
            </div>
          ) : facility ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {facility.photos && facility.photos.length > 0 ? (
                    <img 
                      src={facility.photos[0].url} 
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{facility.name}</h2>
                    {getStatusBadge(facility.status)}
                    <Badge variant="outline">{facility.venueType}</Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{facility.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{facility.address}, {facility.city}, {facility.state}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{facility.phone}</span>
                    </div>
                    {facility.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{facility.email}</span>
                      </div>
                    )}
                    {facility.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a href={facility.website} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tabs Section */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-12">
                  <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="courts" className="text-sm">Courts</TabsTrigger>
                  <TabsTrigger value="photos" className="text-sm">Photos</TabsTrigger>
                  <TabsTrigger value="owner" className="text-sm">Owner</TabsTrigger>
                  <TabsTrigger value="activity" className="text-sm">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-500">Status</span>
                            <div className="mt-1">{getStatusBadge(facility.status)}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Type</span>
                            <div className="mt-1 font-medium">{facility.venueType}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Rating</span>
                            <div className="mt-1 flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="font-medium">
                                {facility.rating ? facility.rating.toFixed(1) : 'N/A'}
                              </span>
                              <span className="text-gray-500 ml-1">
                                ({facility.totalReviews} reviews)
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Courts</span>
                            <div className="mt-1 font-medium">{facility.courts.length}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {facility._count.bookings}
                            </div>
                            <div className="text-sm text-gray-600">Total Bookings</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {facility._count.reviews}
                            </div>
                            <div className="text-sm text-gray-600">Reviews</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Amenities */}
                  {facility.amenities && facility.amenities.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Star className="h-5 w-5 mr-2" />
                          Amenities & Features
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {facility.amenities.map((amenity) => (
                            <div key={amenity.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm font-medium">{amenity.name}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Operating Hours */}
                  {facility.operatingHours && facility.operatingHours.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Clock className="h-5 w-5 mr-2" />
                          Operating Hours
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {facility.operatingHours
                            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                            .map((hours) => {
                              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                              const dayName = dayNames[hours.dayOfWeek] || `Day ${hours.dayOfWeek}`;
                              
                              return (
                                <div key={hours.dayOfWeek} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                                  <span className="font-medium text-gray-900">{dayName}</span>
                                  <span className={`font-medium ${!hours.isClosed ? "text-green-600" : "text-red-600"}`}>
                                    {!hours.isClosed ? `${hours.openTime} - ${hours.closeTime}` : "Closed"}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="courts">
                  <Card>
                    <CardHeader>
                      <CardTitle>Courts ({facility.courts.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {facility.courts.map((court) => (
                          <div key={court.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-semibold text-lg">{court.name}</h4>
                              <Badge variant={court.isActive ? "default" : "secondary"} className="ml-2">
                                {court.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600 font-medium">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                {court.sportType.replace('_', ' ')}
                              </p>
                              <p className="text-xl font-bold text-green-600">
                                ₹{court.pricePerHour}/hour
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {facility.courts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No courts configured yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="photos">
                  <Card>
                    <CardHeader>
                      <CardTitle>Photos ({facility.photos.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {facility.photos.length > 0 ? (
                        <div className="space-y-4">
                          {/* Main Image Display */}
                          <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={facility.photos[currentImageIndex].url}
                              alt={facility.photos[currentImageIndex].description || facility.name}
                              className="w-full h-full object-cover"
                            />
                            {facility.photos.length > 1 && (
                              <>
                                <button
                                  onClick={prevImage}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={nextImage}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                          
                          {/* Image Thumbnails */}
                          {facility.photos.length > 1 && (
                            <div className="grid grid-cols-6 gap-2">
                              {facility.photos.map((photo, index) => (
                                <button
                                  key={photo.id}
                                  onClick={() => setCurrentImageIndex(index)}
                                  className={`aspect-square rounded overflow-hidden border-2 ${
                                    index === currentImageIndex ? "border-blue-500" : "border-gray-200"
                                  }`}
                                >
                                  <img
                                    src={photo.url}
                                    alt={photo.description || ""}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                          <p>No photos available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="owner">
                  <Card>
                    <CardHeader>
                      <CardTitle>Facility Owner</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={facility.owner.image || ""} alt={facility.owner.name} />
                          <AvatarFallback>
                            {facility.owner.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{facility.owner.name}</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{facility.owner.email}</span>
                            </div>
                            {facility.owner.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{facility.owner.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Facility Created</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(facility.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                              <span className="ml-2">
                                ({formatDistanceToNow(new Date(facility.createdAt), { addSuffix: true })})
                              </span>
                            </p>
                          </div>
                        </div>

                        {facility.approvedAt && (
                          <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="font-medium">Facility Approved</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(facility.approvedAt), "MMM dd, yyyy 'at' HH:mm")}
                                <span className="ml-2">
                                  ({formatDistanceToNow(new Date(facility.approvedAt), { addSuffix: true })})
                                </span>
                              </p>
                            </div>
                          </div>
                        )}

                        {facility.rejectedAt && (
                          <div className="flex items-start space-x-3">
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div>
                              <p className="font-medium">Facility Rejected</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(facility.rejectedAt), "MMM dd, yyyy 'at' HH:mm")}
                                <span className="ml-2">
                                  ({formatDistanceToNow(new Date(facility.rejectedAt), { addSuffix: true })})
                                </span>
                              </p>
                              {facility.rejectionReason && (
                                <p className="text-sm text-red-600 mt-1">
                                  Reason: {facility.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-start space-x-3">
                          <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Last Updated</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(facility.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                              <span className="ml-2">
                                ({formatDistanceToNow(new Date(facility.updatedAt), { addSuffix: true })})
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Facility" : "Reject Facility"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              {actionType === "approve" 
                ? `Are you sure you want to approve "${facility?.name}"? This will make it visible to users.`
                : `Are you sure you want to reject "${facility?.name}"? Please provide a reason below.`
              }
            </p>
            <div>
              <label className="text-sm font-medium">
                {actionType === "approve" ? "Approval Comments (Optional)" : "Rejection Reason"}
              </label>
              <textarea
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
                placeholder={
                  actionType === "approve" 
                    ? "Add any comments for the facility owner..."
                    : "Please provide a reason for rejection..."
                }
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={executeAction}
              disabled={actionType === "reject" && !actionComments.trim()}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
