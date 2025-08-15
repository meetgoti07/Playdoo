"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Power, PowerOff, Trash2, MapPin, Users, Ruler, DollarSign } from "lucide-react";
import { format } from "date-fns";
import EditCourtModal from "./EditCourtModal";
import { toast } from "sonner";

interface Court {
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
  };
  _count: {
    bookings: number;
    timeSlots: number;
  };
}

interface CourtsListProps {
  courts: Court[];
  isLoading: boolean;
  onCourtUpdated: () => void;
}

export default function CourtsList({ courts, isLoading, onCourtUpdated }: CourtsListProps) {
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  const handleToggleStatus = async (court: Court) => {
    try {
      const response = await fetch(`/api/owner/courts/${court.id}`, {
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

  const handleDeleteCourt = async (court: Court) => {
    if (!confirm(`Are you sure you want to delete "${court.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/owner/courts/${court.id}`, {
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courts Found</h3>
            <p className="text-gray-600 mb-4">
              You haven't created any courts yet or no courts match your current filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map((court) => (
          <Card key={court.id} className={`relative ${!court.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getSportIcon(court.sportType)}</span>
                  <div>
                    <CardTitle className="text-lg">{court.name}</CardTitle>
                    <p className="text-sm text-gray-600">{court.facility.name}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingCourt(court)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(court)}>
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
                      onClick={() => handleDeleteCourt(court)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={court.isActive ? "default" : "secondary"}>
                  {court.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">
                  {court.sportType.replace('_', ' ')}
                </Badge>
                <Badge 
                  variant={court.facility.status === 'APPROVED' ? 'default' : 'destructive'}
                >
                  {court.facility.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {court.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{court.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span>₹{court.pricePerHour}/hr</span>
                </div>
                {court.capacity && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{court.capacity} players</span>
                  </div>
                )}
                {court.length && court.width && (
                  <div className="flex items-center gap-1">
                    <Ruler className="h-4 w-4 text-purple-600" />
                    <span>{court.length}x{court.width}m</span>
                  </div>
                )}
                {court.surface && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span className="capitalize">{court.surface}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t text-sm">
                <div>
                  <span className="text-gray-500">Bookings:</span>
                  <span className="ml-1 font-medium">{court._count.bookings}</span>
                </div>
                <div>
                  <span className="text-gray-500">Time Slots:</span>
                  <span className="ml-1 font-medium">{court._count.timeSlots}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Created {format(new Date(court.createdAt), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingCourt && (
        <EditCourtModal
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
