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
import { Search, CreditCard, Calendar } from "lucide-react";

interface PaymentFilters {
  status: string;
  method: string;
  dateRange: string;
  search: string;
}

interface PaymentFiltersProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
}

export function PaymentFilters({ filters, onFiltersChange }: PaymentFiltersProps) {
  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Search by transaction ID, user..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Payment Status</Label>
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
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Method Filter */}
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select
          value={filters.method || "all"}
          onValueChange={(value) => handleFilterChange("method", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <CreditCard className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
            <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="NET_BANKING">Net Banking</SelectItem>
            <SelectItem value="WALLET">Wallet</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
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
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="last_week">Last Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="last_quarter">Last Quarter</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
