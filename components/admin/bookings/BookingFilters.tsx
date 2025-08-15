"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";

interface BookingFilters {
  status: string;
  dateRange: string;
  search: string;
}

interface BookingFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
}

export function BookingFilters({ filters, onFiltersChange }: BookingFiltersProps) {
  const handleFilterChange = (key: keyof BookingFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Search by user, facility, or booking ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="NO_SHOW">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label>Date Range</Label>
        <Select
          value={filters.dateRange || "all"}
          onValueChange={(value) => handleFilterChange("dateRange", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="next_week">Next Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="next_month">Next Month</SelectItem>
            <SelectItem value="past_week">Past Week</SelectItem>
            <SelectItem value="past_month">Past Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
