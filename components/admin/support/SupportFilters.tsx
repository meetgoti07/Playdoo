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
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

interface SupportFilters {
  status: string;
  priority: string;
  category: string;
  search: string;
}

interface SupportFiltersProps {
  filters: SupportFilters;
  onFiltersChange: (filters: SupportFilters) => void;
}

export function SupportFilters({ filters, onFiltersChange }: SupportFiltersProps) {
  const handleFilterChange = (key: keyof SupportFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: "",
      priority: "",
      category: "",
      search: "",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Search tickets..."
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
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="PENDING_CUSTOMER">Pending Customer</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority Filter */}
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={filters.priority || "all"}
          onValueChange={(value) => handleFilterChange("priority", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={filters.category || "all"}
          onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="BOOKING_ISSUE">Booking Issue</SelectItem>
            <SelectItem value="PAYMENT_PROBLEM">Payment Problem</SelectItem>
            <SelectItem value="FACILITY_COMPLAINT">Facility Complaint</SelectItem>
            <SelectItem value="TECHNICAL_ISSUE">Technical Issue</SelectItem>
            <SelectItem value="ACCOUNT_HELP">Account Help</SelectItem>
            <SelectItem value="REFUND_REQUEST">Refund Request</SelectItem>
            <SelectItem value="GENERAL_INQUIRY">General Inquiry</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <div className="flex items-end">
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
}
