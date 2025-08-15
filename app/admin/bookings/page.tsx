"use client";

import { useState } from "react";
import { BookingManagementTable } from "@/components/admin/bookings/BookingManagementTable";
import { BookingFilters } from "@/components/admin/bookings/BookingFilters";
import { BookingStats } from "@/components/admin/bookings/BookingStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";

export default function BookingsPage() {
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
    search: "",
  });

  const handleExport = () => {
    console.log("Exporting bookings...");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage all bookings on the platform
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Bookings
          </Button>
        </div>
      </div>

      {/* Booking Stats */}
      <BookingStats />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            All Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingManagementTable filters={filters} />
        </CardContent>
      </Card>
    </div>
  );
}
