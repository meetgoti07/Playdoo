"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface UserFiltersProps {
  filters: {
    role: string;
    status: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      role: "",
      status: "",
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
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Role Filter */}
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={filters.role || "all"} onValueChange={(value) => handleFilterChange("role", value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="facility_owner">Facility Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
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
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
            <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
          </SelectContent>
        </Select>
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
