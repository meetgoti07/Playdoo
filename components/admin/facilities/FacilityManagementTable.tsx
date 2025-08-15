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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Building2, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface FacilityFilters {
  status: string;
  city: string;
  search: string;
}

interface FacilityManagementTableProps {
  filters: FacilityFilters;
}

export function FacilityManagementTable({ filters }: FacilityManagementTableProps) {
  const { data: facilities, isLoading, error } = useFacilities(filters);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [facilityForDetails, setFacilityForDetails] = useState<string | null>(null);

  const handleViewDetails = (facilityId: string) => {
    setFacilityForDetails(facilityId);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      SUSPENDED: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.toLowerCase()}
      </Badge>
    );
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
        Failed to load facilities
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Facility</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Courts</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
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
                <TableCell>{getStatusBadge(facility.status)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {facility.venueType.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>{facility._count?.courts || 0}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(facility.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(facility.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No facilities found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Facility Details Modal */}
      <FacilityDetailsModal
        facilityId={facilityForDetails}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setFacilityForDetails(null);
        }}
        showActions={false}
      />
    </div>
  );
}
