"use client";

import { useState } from "react";
import { SupportTicketTable } from "@/components/admin/support/SupportTicketTable";
import { SupportTicketDetailView } from "@/components/admin/support/SupportTicketDetailView";
import { SupportFilters } from "@/components/admin/support/SupportFilters";
import { SupportStats } from "@/components/admin/support/SupportStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

export default function SupportPage() {
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    search: "",
  });
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketId(ticketId);
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
  };

  // Show detailed view if a ticket is selected
  if (selectedTicketId) {
    return (
      <SupportTicketDetailView 
        ticketId={selectedTicketId} 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support & Help</h1>
          <p className="text-gray-600 mt-2">
            Manage support tickets and help documentation
          </p>
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
            <MessageSquare className="w-5 h-5 mr-2" />
            Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SupportTicketTable 
            filters={filters} 
            onTicketSelect={handleTicketSelect}
          />
        </CardContent>
      </Card>
    </div>
  );
}
