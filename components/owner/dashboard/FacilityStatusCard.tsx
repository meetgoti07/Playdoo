"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Facility {
  hashId: number;
  id: string;
  name: string;
  status: string;
  totalCourts: number;
  activeCourts: number;
  address: string;
  city: string;
}

export function FacilityStatusCard() {
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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
      <Card>
        <CardHeader>
          <CardTitle>Your Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Your Facilities</span>
        </CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/owner/facilities">Manage All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {facilities.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No facilities registered yet</p>
            <Button asChild>
              <Link href="/owner/facilities/new">Add Your First Facility</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {facilities.map((facility) => (
              <div
                key={facility.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium">{facility.name}</h3>
                    <Badge className={getStatusColor(facility.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(facility.status)}
                        <span className="capitalize">{facility.status}</span>
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">
                    {facility.address}, {facility.city}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {facility.activeCourts} of {facility.totalCourts} courts active
                  </div>
                </div>
                
                <div className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/owner/facilities/${facility.hashId}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
