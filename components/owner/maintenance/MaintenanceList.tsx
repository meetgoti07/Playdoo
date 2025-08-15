"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, Eye, Play, CheckCircle, Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MaintenanceList() {
  const { data, error, isLoading } = useSWR("/api/owner/maintenance", fetcher);

  if (isLoading) {
    return <MaintenanceListSkeleton />;
  }

  if (error) {
    console.error("Error loading maintenance records:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load maintenance records</p>
          <p className="text-sm text-gray-500 mt-2">Error: {error.message || 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  const { maintenance = [] } = data || {};
  console.log("Maintenance data:", data);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Records</CardTitle>
      </CardHeader>
      <CardContent>
        {maintenance.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No maintenance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Facility & Court</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenance.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.title}</div>
                        {record.description && (
                          <div className="text-sm text-gray-500">{record.description}</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.court.facility.name}</div>
                        <div className="text-sm text-gray-500">{record.court.name}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(record.startDate), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>to {format(new Date(record.endDate), "MMM dd, yyyy")}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                          {record.status === "scheduled" && (
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Start Maintenance
                            </DropdownMenuItem>
                          )}
                          
                          {record.status === "active" && (
                            <DropdownMenuItem>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaintenanceListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
