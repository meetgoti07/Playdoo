"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CourtsList from "@/components/owner/courts/CourtsList";
import NewCourtWithTimeSlotsModal from "@/components/owner/courts/NewCourtWithTimeSlotsModal";
import { useOwnerCourts } from "@/hooks/swr/courts/useOwnerCourts";
import { useOwnerFacilities } from "@/hooks/swr/facilities/useOwnerFacilities";

export default function OwnerCourtsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [showNewCourtModal, setShowNewCourtModal] = useState(false);

  const { data: facilitiesData } = useOwnerFacilities();
  const facilities = facilitiesData?.facilities || [];

  const { data: courtsData, isLoading, mutate } = useOwnerCourts({
    facilityId: selectedFacility !== "all" ? selectedFacility : undefined,
    sportType: selectedSport !== "all" ? selectedSport : undefined,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
  });

  const courts = courtsData?.courts || [];

  const activeCourts = courts.filter((court: any) => court.isActive).length;
  const inactiveCourts = courts.filter((court: any) => !court.isActive).length;
  const totalBookings = courts.reduce((sum: number, court: any) => sum + (court._count?.bookings || 0), 0);

  const filteredCourts = courts.filter((court: any) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        court.name.toLowerCase().includes(searchLower) ||
        court.facility.name.toLowerCase().includes(searchLower) ||
        court.sportType.toLowerCase().includes(searchLower) ||
        court.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const sportTypes = [
    "BADMINTON", "TENNIS", "FOOTBALL", "BASKETBALL", "CRICKET",
    "SQUASH", "TABLE_TENNIS", "VOLLEYBALL", "SWIMMING", "GYM", "OTHER"
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Court Management</h1>
          <p className="text-gray-600 mt-1">Manage your facility courts and inventory</p>
        </div>
        <Button 
          onClick={() => setShowNewCourtModal(true)}
          className="flex items-center gap-2"
          disabled={facilities.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add New Court
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCourts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Courts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveCourts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter and search your courts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger>
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map((facility: any) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger>
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sportTypes.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedFacility("all");
                setSelectedSport("all");
                setIsActiveFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No Facilities Warning */}
      {facilities.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-800">No Facilities Found</h3>
              <p className="text-orange-700 mt-2">
                You need to create a facility first before adding courts.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="/owner/facilities/new">Create Facility</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courts List */}
      <CourtsList 
        courts={filteredCourts} 
        isLoading={isLoading}
        onCourtUpdated={mutate}
      />

      {/* New Court Modal */}
      <NewCourtWithTimeSlotsModal
        isOpen={showNewCourtModal}
        onClose={() => setShowNewCourtModal(false)}
        facilities={facilities}
        onCourtCreated={() => {
          mutate();
          setShowNewCourtModal(false);
        }}
      />
    </div>
  );
}
