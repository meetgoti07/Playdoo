"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Settings, Clock, Calendar } from "lucide-react";
import useSWR from "swr";
import CourtsList from "@/components/owner/courts/CourtsList";
import NewCourtWithTimeSlotsModal from "@/components/owner/courts/NewCourtWithTimeSlotsModal";
import TimeSlotManagement from "@/components/owner/facilities/TimeSlotManagement";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FacilityCourtsPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params.id as string;
  const [showNewCourtModal, setShowNewCourtModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);

  const { data: facilityData, isLoading: facilityLoading } = useSWR(
    `/api/owner/facilities/${facilityId}`,
    fetcher
  );
  
  const { data: courtsData, isLoading: courtsLoading, mutate: mutateCourts } = useSWR(
    `/api/owner/courts?facilityId=${facilityId}`,
    fetcher
  );

  const facility = facilityData?.facility;
  const courts = courtsData?.courts || [];

  if (facilityLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!facility) {
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

  const canManageCourts = facility.status === 'APPROVED';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/owner/facilities/${facilityId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Facility
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courts Management</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600">{facility.name}</span>
              <Badge className={getStatusColor(facility.status)}>
                {facility.status}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTimeSlotModal(true)}
            disabled={!canManageCourts}
          >
            <Clock className="h-4 w-4 mr-2" />
            Time Slots
          </Button>
          <Button 
            onClick={() => setShowNewCourtModal(true)}
            disabled={!canManageCourts}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Court
          </Button>
        </div>
      </div>

      {/* Status Warning */}
      {!canManageCourts && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Facility Not Approved</h3>
                <p className="text-sm text-yellow-700">
                  Your facility must be approved by admin before you can manage courts and time slots.
                  {facility.status === 'PENDING' && ' Your facility is currently under review.'}
                  {facility.status === 'REJECTED' && ' Please check the rejection reason and update your facility.'}
                  {facility.status === 'SUSPENDED' && ' Your facility has been suspended. Contact support for assistance.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courts Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{courts.length}</p>
                <p className="text-sm text-gray-600">Total Courts</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {courts.filter((court: any) => court.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-gray-600">Active Courts</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {courts.filter((court: any) => court.status === 'MAINTENANCE').length}
                </p>
                <p className="text-sm text-gray-600">Under Maintenance</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Settings className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {courts.filter((court: any) => court.status === 'INACTIVE').length}
                </p>
                <p className="text-sm text-gray-600">Inactive Courts</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courts List */}
      <Card>
        <CardHeader>
          <CardTitle>Courts</CardTitle>
          <CardDescription>
            Manage courts for {facility.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courtsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <CourtsList 
              courts={courts}
              isLoading={courtsLoading}
              onCourtUpdated={mutateCourts}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NewCourtWithTimeSlotsModal 
        isOpen={showNewCourtModal}
        onClose={() => setShowNewCourtModal(false)}
        onCourtCreated={mutateCourts}
        facilities={[facility].filter(Boolean)}
      />

      <TimeSlotManagement 
        isOpen={showTimeSlotModal}
        onClose={() => setShowTimeSlotModal(false)}
        facilityId={facilityId}
      />
    </div>
  );
}
