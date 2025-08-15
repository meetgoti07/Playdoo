"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, Edit, Power, PowerOff, Trash2, Eye, 
  ChevronLeft, ChevronRight, Users, Ruler, DollarSign,
  Calendar, MapPin
} from "lucide-react";
import { format } from "date-fns";
import AdminCourtDetailsModal from "./AdminCourtDetailsModal";
import AdminEditCourtModal from "./AdminEditCourtModal";
import { toast } from "sonner";

interface AdminCourt {
  id: string;
  hashId: number;
  name: string;
  sportType: string;
  description?: string;
  pricePerHour: number;
  capacity?: number;
  length?: number;
  width?: number;
  surface?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    name: string;
    status: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
  _count: {
    bookings: number;
    timeSlots: number;
    maintenance: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AdminCourtsListProps {
  courts: AdminCourt[];
  isLoading: boolean;
  pagination?: Pagination;
  currentPage: number;
  onPageChange: (page: number) => void;
  onCourtUpdated: () => void;
}

export default function AdminCourtsList({ 
  courts, 
  isLoading, 
  pagination,
  currentPage,
  onPageChange,
  onCourtUpdated 
}: AdminCourtsListProps) {
  const [selectedCourt, setSelectedCourt] = useState<AdminCourt | null>(null);
  const [editingCourt, setEditingCourt] = useState<AdminCourt | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleToggleStatus = async (court: AdminCourt) => {
    try {
      const response = await fetch(`/api/admin/courts/${court.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !court.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update court status');
      }

      toast.success(`Court ${!court.isActive ? 'activated' : 'deactivated'} successfully`);
      onCourtUpdated();
    } catch (error) {
      toast.error('Failed to update court status');
    }
  };

  const handleDeleteCourt = async (court: AdminCourt) => {
    if (!confirm(`Are you sure you want to delete "${court.name}" from ${court.facility.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courts/${court.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete court');
      }

      toast.success('Court deleted successfully');
      onCourtUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete court');
    }
  };

  const handleViewDetails = (court: AdminCourt) => {
    setSelectedCourt(court);
    setShowDetailsModal(true);
  };

  const getSportIcon = (sportType: string) => {
    const icons: Record<string, string> = {
      BADMINTON: "🏸",
      TENNIS: "🎾", 
      FOOTBALL: "⚽",
      BASKETBALL: "🏀",
      CRICKET: "🏏",
      SQUASH: "🎾",
      TABLE_TENNIS: "🏓",
      VOLLEYBALL: "🏐",
      SWIMMING: "🏊",
      GYM: "🏋️",
      OTHER: "🏃",
    };
    return icons[sportType] || "🏃";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (courts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courts Found</h3>
            <p className="text-gray-600 mb-4">
              No courts match your current filters or no courts exist yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Courts ({pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Court</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Price/Hr</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courts.map((court) => (
                  <TableRow key={court.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSportIcon(court.sportType)}</span>
                        <div>
                          <div className="font-medium">{court.name}</div>
                          {court.capacity && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {court.capacity} players
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{court.facility.name}</div>
                        <Badge 
                          className={`text-xs ${getStatusColor(court.facility.status)}`}
                        >
                          {court.facility.status}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="font-medium">{court.facility.owner.name}</div>
                        <div className="text-sm text-gray-500">{court.facility.owner.email}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {court.sportType.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        ₹{court.pricePerHour}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={court.isActive ? "default" : "secondary"}>
                          {court.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {court.length && court.width && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            {court.length}x{court.width}m
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div>{court._count.bookings} bookings</div>
                        <div className="text-gray-500">{court._count.timeSlots} slots</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {format(new Date(court.createdAt), 'MMM d, yyyy')}
                      </div>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem key="view" onClick={() => handleViewDetails(court)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem key="edit" onClick={() => setEditingCourt(court)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem key="toggle" onClick={() => handleToggleStatus(court)}>
                            {court.isActive ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            key="delete"
                            onClick={() => handleDeleteCourt(court)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pagination.limit) + 1} to{" "}
                {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
                {pagination.total} courts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedCourt && (
        <AdminCourtDetailsModal
          court={selectedCourt}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCourt(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingCourt && (
        <AdminEditCourtModal
          court={editingCourt}
          isOpen={!!editingCourt}
          onClose={() => setEditingCourt(null)}
          onCourtUpdated={() => {
            onCourtUpdated();
            setEditingCourt(null);
          }}
        />
      )}
    </>
  );
}
