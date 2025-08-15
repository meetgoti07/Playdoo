"use client";

import { useState } from "react";
import { PaymentManagementTable } from "@/components/admin/payments/PaymentManagementTable";
import { PaymentFilters } from "@/components/admin/payments/PaymentFilters";
import { PaymentStats } from "@/components/admin/payments/PaymentStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CreditCard } from "lucide-react";

export default function PaymentsPage() {
  const [filters, setFilters] = useState({
    status: "",
    method: "",
    dateRange: "",
    search: "",
  });

  const handleExport = () => {
    console.log("Exporting payments...");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage all payments on the platform
          </p>
        </div>

      </div>

      {/* Payment Stats */}
      <PaymentStats />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            All Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentManagementTable filters={filters} />
        </CardContent>
      </Card>
    </div>
  );
}
