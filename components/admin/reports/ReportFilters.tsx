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
import { Search, Shield, AlertTriangle } from "lucide-react";

interface ReportFilters {
  type: string;
  status: string;
  search: string;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
}

export function ReportFilters({ filters, onFiltersChange }: ReportFiltersProps) {
  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
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
            placeholder="Search by reporter, description..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Type Filter */}
      <div className="space-y-2">
        <Label>Report Type</Label>
        <Select
          value={filters.type || "all"}
          onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <AlertTriangle className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="FACILITY_ISSUE">Facility Issue</SelectItem>
            <SelectItem value="USER_BEHAVIOR">User Behavior</SelectItem>
            <SelectItem value="PAYMENT_ISSUE">Payment Issue</SelectItem>
            <SelectItem value="SAFETY_CONCERN">Safety Concern</SelectItem>
            <SelectItem value="SPAM">Spam</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <Shield className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
