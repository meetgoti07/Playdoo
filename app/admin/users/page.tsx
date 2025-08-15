"use client";

import { useState } from "react";
import { UserManagementTable } from "@/components/admin/users/UserManagementTable";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";

export default function UsersPage() {
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    search: "",
  });

  const handleExport = () => {
    // Export users to CSV
    console.log("Exporting users...");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all users and facility owners on the platform
          </p>
        </div>
        <div className="flex space-x-3">

          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <UserFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagementTable filters={filters} />
        </CardContent>
      </Card>
    </div>
  );
}
