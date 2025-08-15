"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Ruler, DollarSign, Calendar, MapPin, Phone, Mail,
  Building, Clock, Activity, Settings
} from "lucide-react";
import { format } from "date-fns";

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

interface AdminCourtDetailsModalProps {
  court: AdminCourt;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCourtDetailsModal({ court, isOpen, onClose }: AdminCourtDetailsModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{getSportIcon(court.sportType)}</span>
            <div>
              <div>{court.name}</div>
              <div className="text-sm font-normal text-gray-600">{court.facility.name}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Detailed information about this court and its associated facility
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={court.isActive ? "default" : "secondary"}>
              {court.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {court.sportType.replace('_', ' ')}
            </Badge>
            <Badge className={getStatusColor(court.facility.status)}>
              Facility: {court.facility.status}
            </Badge>
          </div>

          {/* Court Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Court Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">₹{court.pricePerHour}/hour</span>
                </div>
                
                {court.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{court.capacity} players capacity</span>
                  </div>
                )}

                {court.length && court.width && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-purple-600" />
                    <span>{court.length} x {court.width} meters</span>
                  </div>
                )}

                {court.surface && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span className="capitalize">{court.surface} surface</span>
                  </div>
                )}

                {court.description && (
                  <div className="pt-2 border-t">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{court.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Facility & Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Facility</h4>
                  <p className="text-sm text-gray-600">{court.facility.name}</p>
                  <Badge className={`text-xs mt-1 ${getStatusColor(court.facility.status)}`}>
                    {court.facility.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium">Owner</h4>
                  <p className="text-sm text-gray-600">{court.facility.owner.name}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Mail className="h-3 w-3" />
                    {court.facility.owner.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{court._count.bookings}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{court._count.timeSlots}</div>
                  <div className="text-sm text-gray-600">Time Slots</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{court._count.maintenance}</div>
                  <div className="text-sm text-gray-600">Maintenance Records</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Created:</span>
                <span>{format(new Date(court.createdAt), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Last Updated:</span>
                <span>{format(new Date(court.updatedAt), 'PPP')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
