"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupportTickets } from "@/hooks/swr/useSupportTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-800";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-800";
    case "RESOLVED":
      return "bg-green-100 text-green-800";
    case "CLOSED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "LOW":
      return "bg-gray-100 text-gray-800";
    case "MEDIUM":
      return "bg-blue-100 text-blue-800";
    case "HIGH":
      return "bg-orange-100 text-orange-800";
    case "URGENT":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "OPEN":
      return <MessageSquare className="w-4 h-4" />;
    case "IN_PROGRESS":
      return <Clock className="w-4 h-4" />;
    case "RESOLVED":
      return <CheckCircle className="w-4 h-4" />;
    case "CLOSED":
      return <XCircle className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
};

export function SupportTicketList() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const { tickets, pagination, isLoading, error } = useSupportTickets({
    status: statusFilter,
    page: currentPage,
    limit: 10,
  });

  const handleViewDetails = (ticketId: string) => {
    router.push(`/support/${ticketId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Failed to load support tickets</p>
          <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-gray-600">
                {statusFilter
                  ? `No tickets found with status "${statusFilter}"`
                  : "You haven't created any support tickets yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{ticket.subject}</CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ticket.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex space-x-2">
                      <Badge className={cn("flex items-center space-x-1", getStatusColor(ticket.status))}>
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status.replace("_", " ")}</span>
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>#{ticket.hashId}</span>
                    <span>Created {formatDistanceToNow(new Date(ticket.createdAt))} ago</span>
                    {ticket.resolvedAt && (
                      <span>Resolved {formatDistanceToNow(new Date(ticket.resolvedAt))} ago</span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(ticket.id)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === pagination.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
