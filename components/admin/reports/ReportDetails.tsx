"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Building,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ReportDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
}

interface Report {
  id: string;
  hashId: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt?: string;
  adminNotes?: string;
  reportedBy: {
    name: string;
    email: string;
    image?: string;
  };
  reportedUser?: {
    name: string;
    email: string;
    banned: boolean;
  };
  reportedFacility?: {
    name: string;
    address: string;
    status: string;
  };
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

export function ReportDetails({ open, onOpenChange, reportId }: ReportDetailsProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReportDetails = async () => {
    if (!reportId || !open) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      }
    } catch (error) {
      console.error("Failed to fetch report details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch details when dialog opens
  useEffect(() => {
    fetchReportDetails();
  }, [reportId, open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className={reportTypeColors[report.type as keyof typeof reportTypeColors]}>
                    {report.type.replace("_", " ")}
                  </Badge>
                  <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                    {report.status.replace("_", " ")}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        report.priority === "HIGH"
                          ? "text-red-500"
                          : report.priority === "MEDIUM"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    />
                    <span className="text-sm text-gray-600">{report.priority}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold">{report.title}</h3>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateTime(report.createdAt)}</span>
                </div>
                {report.resolvedAt && (
                  <div className="flex items-center space-x-1 mt-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolved: {formatDateTime(report.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reporter Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reporter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={report.reportedBy.image} />
                    <AvatarFallback>
                      {report.reportedBy.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{report.reportedBy.name}</div>
                    <div className="text-sm text-gray-500">{report.reportedBy.email}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Description</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
              </CardContent>
            </Card>

            {/* Reported Subject */}
            {(report.reportedUser || report.reportedFacility) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reported Subject</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.reportedUser && (
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">{report.reportedUser.name}</div>
                        <div className="text-sm text-gray-500">{report.reportedUser.email}</div>
                        <div className="mt-1">
                          <Badge variant={report.reportedUser.banned ? "destructive" : "secondary"}>
                            {report.reportedUser.banned ? "Banned" : "Active"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                  {report.reportedFacility && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">{report.reportedFacility.name}</div>
                        <div className="text-sm text-gray-500">{report.reportedFacility.address}</div>
                        <div className="mt-1">
                          <Badge 
                            variant={
                              report.reportedFacility.status === "SUSPENDED" 
                                ? "destructive" 
                                : report.reportedFacility.status === "ACTIVE" 
                                ? "default" 
                                : "secondary"
                            }
                          >
                            {report.reportedFacility.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Admin Notes */}
            {report.adminNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{report.adminNotes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Report not found or failed to load.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
