"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Phone,
  Star,
  Calendar,
  Users,
  ChevronRight,
  Eye,
  Edit,
  Settings,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Facility {
  hashId: number;
  id: string;
  name: string;
  status: string;
  address: string;
  city: string;
  totalCourts: number;
  activeCourts: number;
  totalBookings: number;
  totalReviews: number;
  rating: number | null;
  createdAt: string;
}

export function FacilitiesList() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await fetch("/api/owner/facilities");
      if (response.ok) {
        const data = await response.json();
        setFacilities(data.facilities || []);
      }
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No facilities yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first sports facility to the platform
          </p>
          <Button asChild>
            <Link href="/owner/facilities/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Facility
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
      {facilities.map((facility) => (
        <Card key={facility.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CardTitle className="text-xl">{facility.name}</CardTitle>
                  <Badge className={getStatusColor(facility.status)}>
                    {facility.status}
                  </Badge>
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{facility.address}, {facility.city}</span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{facility.activeCourts} of {facility.totalCourts} courts active</span>
                  <span>•</span>
                  <span>{facility.totalBookings} total bookings</span>
                  {facility.rating && (
                    <>
                      <span>•</span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1 fill-current" />
                        <span>{facility.rating.toFixed(1)} ({facility.totalReviews} reviews)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/owner/facilities/${facility.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/owner/facilities/${facility.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/owner/facilities/${facility.id}/courts`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Manage Courts
                  </Link>
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
