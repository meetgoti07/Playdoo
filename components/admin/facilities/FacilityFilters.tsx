"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface FacilityFiltersProps {
  filters: {
    status: string;
    city: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function FacilityFilters({ filters, onFiltersChange }: FacilityFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: "",
      city: "",
      search: "",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="search"
            placeholder="Search facilities..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* City Filter */}
      <div className="space-y-2">
        <Label>City</Label>
        <Input
          placeholder="Filter by city..."
          value={filters.city}
          onChange={(e) => handleFilterChange("city", e.target.value)}
        />
      </div>

      {/* Clear Filters */}
      <div className="flex items-end">
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
