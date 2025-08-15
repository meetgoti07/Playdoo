"use client";

import { useState } from "react";
import { useSupportTicketDetails, updateTicketStatus } from "@/hooks/swr/admin/useSupportTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  User,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SupportTicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

export function SupportTicketDetail({ ticketId, onBack }: SupportTicketDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: ticket, isLoading, error, mutate } = useSupportTicketDetails(ticketId);

  const handleStatusUpdate = async (status: string) => {
    try {
      setIsUpdating(true);
      await updateTicketStatus(ticketId, status);
      await mutate();
      toast.success(`Ticket status updated to ${status}`);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    
    try {
      // In a real implementation, you'd have an API endpoint for adding replies
      toast.success("Reply sent successfully");
      setReply("");
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load ticket details</p>
        <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <p className="text-gray-600">Ticket #{ticket.hashId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Original Message</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={ticket.user?.image || undefined} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">{ticket.user?.name || "Anonymous"}</span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reply Section */}
          <Card>
            <CardHeader>
              <CardTitle>Send Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your response here..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex justify-end">
                <Button onClick={handleSendReply} disabled={!reply.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={ticket.user?.image || undefined} />
                  <AvatarFallback>
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{ticket.user?.name || "Anonymous"}</div>
                  <div className="text-sm text-gray-500">{ticket.user?.email || ticket.email}</div>
                </div>
              </div>
              {ticket.user && (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span>{ticket.user.email}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-sm">{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="text-sm">{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
                </div>
                {ticket.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Resolved:</span>
                    <span className="text-sm">{formatDistanceToNow(new Date(ticket.resolvedAt), { addSuffix: true })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigned to:</span>
                  <span className="text-sm">{ticket.assignedTo || "Unassigned"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status:</label>
                <Select
                  value={newStatus || ticket.status}
                  onValueChange={setNewStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                {newStatus && newStatus !== ticket.status && (
                  <Button
                    onClick={() => handleStatusUpdate(newStatus)}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    {isUpdating ? "Updating..." : "Update Status"}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate("IN_PROGRESS")}
                  disabled={isUpdating || ticket.status === "IN_PROGRESS"}
                  className="w-full"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Mark as In Progress
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate("RESOLVED")}
                  disabled={isUpdating || ticket.status === "RESOLVED"}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
