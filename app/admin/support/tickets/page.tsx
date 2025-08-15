"use client";

import { useState } from "react";
import { SupportTicketTable } from "@/components/admin/support/SupportTicketTable";
import { SupportFilters } from "@/components/admin/support/SupportFilters";
import { SupportStats } from "@/components/admin/support/SupportStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, HelpCircle, RefreshCw } from "lucide-react";

export default function SupportTicketsPage() {
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    search: "",
  });

  const handleExport = () => {
    console.log("Exporting support tickets...");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-2">
            Manage customer support requests and inquiries
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Tickets
          </Button>
        </div>
      </div>

      {/* Support Stats */}
      <SupportStats />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <SupportFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Support Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SupportTicketTable filters={filters} />
        </CardContent>
      </Card>
    </div>
  );
}
