"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Users, Filter } from "lucide-react";
import { useState } from "react";

interface CustomersHeaderProps {
  onSearch?: (search: string) => void;
  onSortChange?: (sortBy: string, sortOrder: string) => void;
}

export function CustomersHeader({ onSearch, onSortChange }: CustomersHeaderProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  const handleSortChange = (field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
    onSortChange?.(field, order);
  };

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Manage and view your facility customers
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
          const [field, order] = value.split('-');
          handleSortChange(field, order);
        }}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="totalBookings-desc">Most Bookings</SelectItem>
            <SelectItem value="totalSpent-desc">Highest Spent</SelectItem>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
