"use client";

import { useReports } from "@/hooks/swr/admin/useReports";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building,
  Calendar,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportDetails } from "./ReportDetails";

interface ReportFilters {
  type: string;
  status: string;
  search: string;
}

interface ReportsTableProps {
  filters: ReportFilters;
}

const reportTypeColors = {
  FACILITY_ISSUE: "bg-orange-100 text-orange-800",
  USER_BEHAVIOR: "bg-red-100 text-red-800",
  PAYMENT_ISSUE: "bg-yellow-100 text-yellow-800",
  SAFETY_CONCERN: "bg-red-100 text-red-800",
  SPAM: "bg-gray-100 text-gray-800",
  OTHER: "bg-blue-100 text-blue-800",
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  DISMISSED: "bg-gray-100 text-gray-800",
};

export function ReportsTable({ filters }: ReportsTableProps) {
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    reportId: string;
    action: string;
    reportData?: any;
  }>({
    open: false,
    reportId: "",
    action: "",
  });
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    reportId: "",
  });
  const [actionData, setActionData] = useState({
    notes: "",
    banUser: false,
    banExpires: "",
    suspendFacility: false,
  });

  const { data, isLoading, error, mutate } = useReports({
    page,
    limit: 20,
    type: filters.type,
    status: filters.status,
    search: filters.search,
  });

  const handleAction = async (reportId: string, action: string, reportData?: any) => {
    if (action === "resolve" || action === "dismiss") {
      setActionDialog({
        open: true,
        reportId,
        action,
        reportData,
      });
      return;
    }

    try {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          reportId,
          action,
        },
        message: `Admin report action: ${action}`,
      });

      const response = await fetch(`/api/admin/reports/${reportId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success(`Report ${action} successfully`);
        mutate(); // Refresh the data
      } else {
        throw new Error(`Failed to ${action} report`);
      }
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: `Failed to ${action} report`,
      });
      toast.error(`Failed to ${action} report`);
    }
  };

  const handleActionSubmit = async () => {
    try {
      const { reportId, action } = actionDialog;
      
      const response = await fetch(`/api/admin/reports/${reportId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData),
      });

      if (response.ok) {
        toast.success(`Report ${action}d successfully`);
        setActionDialog({ open: false, reportId: "", action: "" });
        setActionData({ notes: "", banUser: false, banExpires: "", suspendFacility: false });
        mutate(); // Refresh the data
      } else {
        throw new Error(`Failed to ${action} report`);
      }
    } catch (error) {
      toast.error(`Failed to ${actionDialog.action} report`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load reports. Please try again.
      </div>
    );
  }

  const reports = data?.reports || [];
  const totalCount = data?.totalCount || 0;

  // Handle no reports found
  if (!isLoading && !error && reports.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          {filters.search || filters.type || filters.status 
            ? "No reports match your current filters. Try adjusting your search criteria."
            : "There are no reports in the system yet. Reports will appear here when users submit them."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report: any) => (
              <TableRow key={report.hashId}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={report.reportedBy.image} />
                      <AvatarFallback>
                        {report.reportedBy.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{report.reportedBy.name}</div>
                      <div className="text-sm text-gray-500">
                        {report.reportedBy.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={reportTypeColors[report.type as keyof typeof reportTypeColors]}
                  >
                    {report.type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {report.reportedUser && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span className="text-sm">{report.reportedUser.name}</span>
                      </div>
                    )}
                    {report.reportedFacility && (
                      <div className="flex items-center space-x-1">
                        <Building className="w-3 h-3" />
                        <span className="text-sm">{report.reportedFacility.name}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={report.description}>
                    {report.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={statusColors[report.status as keyof typeof statusColors]}
                  >
                    {report.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle
                      className={`w-3 h-3 ${
                        report.priority === "HIGH"
                          ? "text-red-500"
                          : report.priority === "MEDIUM"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    />
                    <span className="text-sm">{report.priority}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateTime(report.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setDetailsDialog({ open: true, reportId: report.hashId })}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {report.status === "PENDING" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleAction(report.hashId, "review")}
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Start Review
                          </DropdownMenuItem>
                        </>
                      )}
                      {report.status === "UNDER_REVIEW" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleAction(report.hashId, "resolve", report)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction(report.hashId, "dismiss", report)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Dismiss Report
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalCount)} of{" "}
            {totalCount} reports
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= totalCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, reportId: "", action: "" });
            setActionData({ notes: "", banUser: false, banExpires: "", suspendFacility: false });
          }
        }}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "resolve" ? "Resolve Report" : "Dismiss Report"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this action..."
                value={actionData.notes}
                onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {actionDialog.action === "resolve" && actionDialog.reportData && (
              <>
                {actionDialog.reportData.reportedUser && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">User Actions</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="banUser"
                        checked={actionData.banUser}
                        onCheckedChange={(checked) => 
                          setActionData(prev => ({ ...prev, banUser: !!checked }))
                        }
                      />
                      <Label htmlFor="banUser" className="text-sm">
                        Ban user: {actionDialog.reportData.reportedUser.name}
                      </Label>
                    </div>
                    {actionData.banUser && (
                      <div className="space-y-2 ml-6">
                        <Label htmlFor="banExpires">Ban Expires (optional)</Label>
                        <Input
                          id="banExpires"
                          type="datetime-local"
                          value={actionData.banExpires}
                          onChange={(e) => setActionData(prev => ({ ...prev, banExpires: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                )}

                {actionDialog.reportData.reportedFacility && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Facility Actions</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="suspendFacility"
                        checked={actionData.suspendFacility}
                        onCheckedChange={(checked) => 
                          setActionData(prev => ({ ...prev, suspendFacility: !!checked }))
                        }
                      />
                      <Label htmlFor="suspendFacility" className="text-sm">
                        Suspend facility: {actionDialog.reportData.reportedFacility.name}
                      </Label>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setActionDialog({ open: false, reportId: "", action: "" })}
              >
                Cancel
              </Button>
              <Button onClick={handleActionSubmit}>
                {actionDialog.action === "resolve" ? "Resolve Report" : "Dismiss Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Details Dialog */}
      <ReportDetails
        open={detailsDialog.open}
        onOpenChange={(open) => setDetailsDialog({ open, reportId: open ? detailsDialog.reportId : "" })}
        reportId={detailsDialog.reportId}
      />
    </div>
  );
}
