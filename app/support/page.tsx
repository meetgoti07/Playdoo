"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTicketForm } from "@/components/support/CreateTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";

export default function SupportPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
            <p className="text-gray-600 mt-2">
              Get help with your bookings and account
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket
          </Button>
        </div>

        {/* Support Tickets */}
        <SupportTicketList />

        {/* Create Ticket Modal/Form */}
        {showCreateForm && (
          <CreateTicketForm
            open={showCreateForm}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  );
}
