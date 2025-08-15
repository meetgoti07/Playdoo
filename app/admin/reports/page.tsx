"use client";

import { useState } from "react";
import { ReportFilters } from "@/components/admin/reports/ReportFilters";
import { ReportsTable } from "@/components/admin/reports/ReportsTable";
import { ReportStats } from "@/components/admin/reports/ReportStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExport = () => {
    // Export reports to CSV
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.search) queryParams.append("search", filters.search);
    
    window.open(`/api/admin/reports/export?${queryParams.toString()}`);
    toast.success("Report export started");
  };

  const handleCreateReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const reportData = {
      type: formData.get("type") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      reportedUserId: formData.get("reportedUserId") as string || undefined,
      reportedFacilityId: formData.get("reportedFacilityId") as string || undefined,
    };

    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        toast.success("Report created successfully");
        setIsCreateDialogOpen(false);
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
        // Reset form
        (event.target as HTMLFormElement).reset();
      } else {
        throw new Error("Failed to create report");
      }
    } catch (error) {
      toast.error("Failed to create report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Moderation</h1>
          <p className="text-gray-600 mt-2">
            Manage user reports and moderate platform content
          </p>
        </div>
        <div className="flex space-x-3">
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateReport} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Report Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FACILITY_ISSUE">Facility Issue</SelectItem>
                      <SelectItem value="USER_BEHAVIOR">User Behavior</SelectItem>
                      <SelectItem value="PAYMENT_ISSUE">Payment Issue</SelectItem>
                      <SelectItem value="SAFETY_CONCERN">Safety Concern</SelectItem>
                      <SelectItem value="SPAM">Spam</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Brief description of the issue"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Detailed description of the issue"
                    rows={4}
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportedUserId">Reported User ID (optional)</Label>
                    <Input 
                      id="reportedUserId" 
                      name="reportedUserId" 
                      placeholder="User ID if applicable"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportedFacilityId">Reported Facility ID (optional)</Label>
                    <Input 
                      id="reportedFacilityId" 
                      name="reportedFacilityId" 
                      placeholder="Facility ID if applicable"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Report"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <ReportStats />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportsTable filters={filters} key={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  );
}
