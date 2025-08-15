"use client";

import { useState } from "react";
import { useActivityLogs } from "@/hooks/swr/admin/useActivityLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  Settings,
  Shield,
  FileText,
  AlertTriangle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";

const ENTITY_ICONS: Record<string, any> = {
  user: User,
  facility: Settings,
  booking: Calendar,
  payment: FileText,
  system: Shield,
  report: AlertTriangle,
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  approve: "bg-green-100 text-green-800",
  reject: "bg-red-100 text-red-800",
  suspend: "bg-yellow-100 text-yellow-800",
  activate: "bg-green-100 text-green-800",
  login: "bg-blue-100 text-blue-800",
  logout: "bg-gray-100 text-gray-800",
};

export default function ActivityLogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [page, setPage] = useState(1);
  
  const { 
    data: logs, 
    isLoading, 
    error, 
    mutate 
  } = useActivityLogs({
    search,
    action,
    entityType,
    page,
    limit: 50
  });

  const handleExport = () => {
    const csvContent = [
      "Timestamp,User,Action,Entity Type,Entity ID,Details,IP Address",
      ...(logs?.data || []).map((log: any) => 
        `"${log.createdAt}","${log.user?.name || log.user?.email || 'System'}","${log.action}","${log.entityType}","${log.entityId || ''}","${log.details || ''}","${log.ipAddress || ''}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Activity logs exported successfully");
  };

  const getEntityIcon = (entityType: string) => {
    const Icon = ENTITY_ICONS[entityType] || Activity;
    return Icon;
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || "bg-gray-100 text-gray-800";
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load activity logs
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-2">
            Monitor all system activities and administrative actions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
                <SelectItem value="suspend">Suspend</SelectItem>
                <SelectItem value="activate">Activate</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="facility">Facilities</SelectItem>
                <SelectItem value="booking">Bookings</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("");
                setAction("");
                setEntityType("");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Activity History
            </div>
            {logs?.total && (
              <Badge variant="secondary">
                {logs.total} total entries
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs?.data || []).map((log: any) => {
                    const EntityIcon = getEntityIcon(log.entityType);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {log.user?.name || log.user?.email || "System"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {log.user?.role || "SYSTEM"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action.toUpperCase()}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <EntityIcon className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="font-medium text-sm capitalize">
                                {log.entityType}
                              </p>
                              {log.entityId && (
                                <p className="text-xs text-gray-500 font-mono">
                                  ID: {log.entityId}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-600 truncate" title={log.details}>
                            {log.details || "No additional details"}
                          </p>
                        </TableCell>
                        
                        <TableCell className="font-mono text-sm text-gray-500">
                          {log.ipAddress || "Unknown"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {logs?.total && logs.total > 50 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, logs.total)} of {logs.total} entries
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page * 50 >= logs.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs?.total || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs?.stats?.adminActions || 0}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs?.stats?.userActions || 0}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs?.stats?.systemEvents || 0}
                </p>
              </div>
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
