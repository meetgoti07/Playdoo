"use client";

import { useState } from "react";
import { FacilityManagementTable } from "@/components/admin/facilities/FacilityManagementTable";
import { FacilityFilters } from "@/components/admin/facilities/FacilityFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Building2 } from "lucide-react";

export default function FacilitiesPage() {
  const [filters, setFilters] = useState({
    status: "",
    city: "",
    search: "",
  });

  const handleExport = () => {
    console.log("Exporting facilities...");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facility Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all facilities and courts on the platform
          </p>
        </div>

      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <FacilityFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Facilities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            All Facilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FacilityManagementTable filters={filters} />
        </CardContent>
      </Card>
    </div>
  );
}
