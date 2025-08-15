"use client";

import { useState } from "react";
import { useFacilities } from "@/hooks/swr/admin/useFacilities";
import { FacilityDetailsModal } from "./FacilityDetailsModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Eye, MapPin, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function PendingFacilitiesTable() {
  const { data: facilities, isLoading, error, mutate } = useFacilities({ status: "PENDING" });
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [facilityForDetails, setFacilityForDetails] = useState<string | null>(null);

  const handleViewDetails = (facilityId: string) => {
    setFacilityForDetails(facilityId);
    setShowDetailsModal(true);
  };

  const handleApprove = async (facilityId: string, approvalComments?: string) => {
    try {
      const response = await fetch(`/api/admin/facilities/${facilityId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments: approvalComments }),
      });

      if (response.ok) {
        toast.success("Facility approved successfully");
        mutate();
        setShowDetailsModal(false);
        setFacilityForDetails(null);
      } else {
        throw new Error("Failed to approve facility");
      }
    } catch (error) {
      toast.error("Failed to approve facility");
    }
  };

  const handleReject = async (facilityId: string, rejectionComments: string) => {
    try {
      const response = await fetch(`/api/admin/facilities/${facilityId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments: rejectionComments }),
      });

      if (response.ok) {
        toast.success("Facility rejected successfully");
        mutate();
        setShowDetailsModal(false);
        setFacilityForDetails(null);
      } else {
        throw new Error("Failed to reject facility");
      }
    } catch (error) {
      toast.error("Failed to reject facility");
    }
  };

  const handleAction = async () => {
    if (!selectedFacility || !actionType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/facilities/${selectedFacility.id}/${actionType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments }),
      });

      if (response.ok) {
        toast.success(`Facility ${actionType}d successfully`);
        mutate();
        setSelectedFacility(null);
        setActionType(null);
        setComments("");
      } else {
        throw new Error(`Failed to ${actionType} facility`);
      }
    } catch (error) {
      toast.error(`Failed to ${actionType} facility`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-16 w-16 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load pending facilities
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Courts</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities && facilities.length > 0 ? (
              facilities.map((facility: any) => (
                <TableRow key={facility.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                        {facility.photos && facility.photos.length > 0 ? (
                          <img 
                            src={facility.photos[0].url} 
                            alt={facility.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{facility.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {facility.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{facility.owner.name}</div>
                      <div className="text-sm text-gray-500">{facility.owner.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{facility.city}, {facility.state}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {facility.venueType.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(facility.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>{facility._count?.courts || 0}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleViewDetails(facility.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                        onClick={() => {
                          setSelectedFacility(facility);
                          setActionType("approve");
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 hover:text-red-700"
                        onClick={() => {
                          setSelectedFacility(facility);
                          setActionType("reject");
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No pending facilities found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Facility Details Modal */}
      <FacilityDetailsModal
        facilityId={facilityForDetails}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setFacilityForDetails(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        showActions={true}
      />

      {/* Action Confirmation Dialog */}
      <Dialog open={!!selectedFacility && !!actionType} onOpenChange={() => {
        setSelectedFacility(null);
        setActionType(null);
        setComments("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Facility" : "Reject Facility"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" 
                ? `Are you sure you want to approve "${selectedFacility?.name}"? This will make it visible to users.`
                : `Are you sure you want to reject "${selectedFacility?.name}"? Please provide a reason below.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {actionType === "approve" ? "Approval Comments (Optional)" : "Rejection Reason"}
              </label>
              <Textarea
                placeholder={
                  actionType === "approve" 
                    ? "Add any comments for the facility owner..."
                    : "Please provide a reason for rejection..."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFacility(null);
                setActionType(null);
                setComments("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={isSubmitting || (actionType === "reject" && !comments.trim())}
            >
              {isSubmitting ? "Processing..." : (actionType === "approve" ? "Approve" : "Reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
