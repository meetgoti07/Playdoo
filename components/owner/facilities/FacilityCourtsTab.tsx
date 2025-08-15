"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Calendar, Clock } from "lucide-react";
import useSWR from "swr";
import CourtsList from "@/components/owner/courts/CourtsList";
import NewCourtWithTimeSlotsModal from "@/components/owner/courts/NewCourtWithTimeSlotsModal";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FacilityCourtsTabProps {
  facilityId: string;
  facilityStatus: string;
}

export default function FacilityCourtsTab({ facilityId, facilityStatus }: FacilityCourtsTabProps) {
  const [showNewCourtModal, setShowNewCourtModal] = useState(false);

  const { data: courtsData, isLoading, mutate } = useSWR(
    `/api/owner/courts?facilityId=${facilityId}`,
    fetcher
  );

  const courts = courtsData?.courts || [];
  const canManageCourts = facilityStatus === 'APPROVED';

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Warning */}
      {!canManageCourts && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Facility Not Approved</h3>
                <p className="text-sm text-yellow-700">
                  Your facility must be approved by admin before you can manage courts.
                  {facilityStatus === 'PENDING' && ' Your facility is currently under review.'}
                  {facilityStatus === 'REJECTED' && ' Please check the rejection reason and update your facility.'}
                  {facilityStatus === 'SUSPENDED' && ' Your facility has been suspended. Contact support for assistance.'}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Courts</CardTitle>
              <CardDescription>
                Manage courts for this facility
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowNewCourtModal(true)}
              disabled={!canManageCourts}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Court
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {courts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No courts added yet.</p>
              {canManageCourts && (
                <Button 
                  className="mt-4"
                  onClick={() => setShowNewCourtModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Court
                </Button>
              )}
            </div>
          ) : (
            <CourtsList onCourtUpdated={mutate} />
          )}
        </CardContent>
      </Card>

      {/* New Court Modal */}
      <NewCourtWithTimeSlotsModal 
        isOpen={showNewCourtModal}
        onClose={() => setShowNewCourtModal(false)}
        onCourtCreated={mutate}
        facilities={[]} // Will need to pass actual facilities
      />
    </div>
  );
}
