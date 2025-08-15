"use client";

import { useState } from 'react';
import { useUserReports, UserReport } from '@/hooks/swr/useUserReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Shield,
  Calendar,
  User,
  Building,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

const reportTypeColors = {
  FACILITY_ISSUE: 'bg-orange-100 text-orange-800',
  USER_BEHAVIOR: 'bg-red-100 text-red-800',
  PAYMENT_ISSUE: 'bg-yellow-100 text-yellow-800',
  SAFETY_CONCERN: 'bg-red-100 text-red-800',
  SPAM: 'bg-gray-100 text-gray-800',
  OTHER: 'bg-blue-100 text-blue-800',
};

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
};

export function UserReportsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { reports, totalCount, totalPages, isLoading, error } = useUserReports({
    status: statusFilter,
    type: typeFilter,
    page,
    limit: 10,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'UNDER_REVIEW':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'DISMISSED':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatReportType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load reports</h3>
        <p className="text-gray-500">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-600 mt-2">
            Track the status of your submitted reports
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter((r: UserReport) => r.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter((r: UserReport) => r.status === 'UNDER_REVIEW').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter((r: UserReport) => r.status === 'RESOLVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="FACILITY_ISSUE">Facility Issue</SelectItem>
                  <SelectItem value="USER_BEHAVIOR">User Behavior</SelectItem>
                  <SelectItem value="PAYMENT_ISSUE">Payment Issue</SelectItem>
                  <SelectItem value="SAFETY_CONCERN">Safety Concern</SelectItem>
                  <SelectItem value="SPAM">Spam</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500">
                {statusFilter || typeFilter 
                  ? "No reports match your current filters."
                  : "You haven't submitted any reports yet."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report: UserReport) => (
                <Card key={report.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={reportTypeColors[report.type as keyof typeof reportTypeColors]}>
                            {formatReportType(report.type)}
                          </Badge>
                          <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(report.status)}
                              {report.status.replace('_', ' ')}
                            </div>
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {report.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {report.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted {format(new Date(report.createdAt), 'MMM dd, yyyy')}</span>
                          </div>
                          
                          {report.reportedUser && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>User: {report.reportedUser.name}</span>
                            </div>
                          )}
                          
                          {report.reportedFacility && (
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span>Facility: {report.reportedFacility.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm text-gray-500">Report #{report.hashId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalCount)} of{" "}
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
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
