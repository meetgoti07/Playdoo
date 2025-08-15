"use client";

import { useState } from "react";
import { PendingFacilitiesTable } from "@/components/admin/facilities/PendingFacilitiesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Building2 } from "lucide-react";
import { usePendingFacilities } from "@/hooks/swr/admin/usePendingFacilities";

export default function PendingFacilitiesPage() {
  const { data: pendingCount } = usePendingFacilities();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facility Approvals</h1>
          <p className="text-gray-600 mt-2">
            Review and approve pending facility registrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-500" />
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            {pendingCount || 0} Pending
          </Badge>
        </div>
      </div>

      {/* Pending Facilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Pending Facility Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PendingFacilitiesTable />
        </CardContent>
      </Card>
    </div>
  );
}
