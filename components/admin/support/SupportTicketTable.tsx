"use client";

import { useState } from "react";
import { useSupportTickets, updateTicketStatus } from "@/hooks/swr/admin/useSupportTickets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SupportFilters {
  status: string;
  priority: string;
  category: string;
  search: string;
}

interface SupportTicketTableProps {
  filters: SupportFilters;
  onTicketSelect?: (ticketId: string) => void;
}

export function SupportTicketTable({ filters, onTicketSelect }: SupportTicketTableProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const { data: tickets = [], isLoading, error, mutate } = useSupportTickets(filters);

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      setIsUpdating(ticketId);
      await updateTicketStatus(ticketId, status);
      await mutate();
      toast.success(`Ticket status updated to ${status}`);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { label: "Open", variant: "destructive" as const },
      IN_PROGRESS: { label: "In Progress", variant: "default" as const },
      PENDING_CUSTOMER: { label: "Pending Customer", variant: "secondary" as const },
      RESOLVED: { label: "Resolved", variant: "outline" as const },
      CLOSED: { label: "Closed", variant: "secondary" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: "Low", variant: "outline" as const, icon: null },
      MEDIUM: { label: "Medium", variant: "secondary" as const, icon: null },
      HIGH: { label: "High", variant: "default" as const, icon: AlertTriangle },
      URGENT: { label: "Urgent", variant: "destructive" as const, icon: AlertTriangle },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.LOW;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {config.label}
      </Badge>
    );
  };


  const handleViewTicket = (ticketId: string) => {
    onTicketSelect?.(ticketId);
  };

  const handleReplyToTicket = (ticketId: string) => {
    onTicketSelect?.(ticketId);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Responses</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{ticket.subject}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                      {ticket.message}
                    </div>
                    <div className="text-xs text-gray-400">#{ticket.hashId}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={ticket.user?.image || undefined} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{ticket.user?.name || "Anonymous"}</div>
                      <div className="text-xs text-gray-500">{ticket.user?.email || ticket.email}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    General
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {getPriorityBadge(ticket.priority)}
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(ticket.status)}
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {ticket.assignedTo ? (
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-gray-500 text-xs">Assigned</div>
                      </div>
                    ) : (
                      <div className="text-gray-500">Unassigned</div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated {formatDistanceToNow(ticket.updatedAt, { addSuffix: true })}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{(ticket as any)._count?.replies || 0}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem key="view" onClick={() => handleViewTicket(ticket.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem key="reply" onClick={() => handleReplyToTicket(ticket.id)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Reply
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem key="progress" onClick={() => handleStatusUpdate(ticket.id, "IN_PROGRESS")}>
                        <Clock className="mr-2 h-4 w-4" />
                        Mark as In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem key="resolved" onClick={() => handleStatusUpdate(ticket.id, "RESOLVED")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
