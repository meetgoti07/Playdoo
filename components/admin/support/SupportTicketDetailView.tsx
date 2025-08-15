"use client";

import { useState } from "react";
import { useSupportTicketDetails, updateTicketStatus } from "@/hooks/swr/admin/useSupportTickets";
import { useSupportTicketReplies } from "@/hooks/swr/useSupportTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  MessageSquare,
  User,
  Calendar,
  Mail,
  Hash,
  Send,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface SupportTicketDetailViewProps {
  ticketId: string;
  onBack: () => void;
}

export function SupportTicketDetailView({ ticketId, onBack }: SupportTicketDetailViewProps) {
  const [reply, setReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: ticket, isLoading, error, mutate } = useSupportTicketDetails(ticketId);
  const { replies: ticketReplies } = useSupportTicketReplies(ticketId);

  const handleStatusUpdate = async (status: string) => {
    try {
      setIsUpdatingStatus(true);
      await updateTicketStatus(ticketId, status, reply || undefined);
      await mutate();
      toast.success(`Ticket status updated to ${status}`);
      if (reply) {
        setReply("");
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      setIsReplying(true);
      const response = await fetch(`/api/admin/support/${ticketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: reply }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      await mutate();
      setReply("");
      toast.success("Reply sent successfully");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <div className="text-center py-8">Loading ticket details...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <div className="text-center py-8 text-red-500">
          Error loading ticket details. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
              <Hash className="w-4 h-4" />
              <span>#{ticket.hashId}</span>
              <Separator orientation="vertical" className="h-4" />
              <Calendar className="w-4 h-4" />
              <span>Created {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Original Request</span>
                <span className="text-sm font-normal text-gray-500">
                  {format(new Date(ticket.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={ticket.user?.image || undefined} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">{ticket.user?.name || "Anonymous"}</span>
                    <span className="text-sm text-gray-500">{ticket.user?.email || ticket.email}</span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Replies Section */}
          {ticketReplies && ticketReplies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Conversation ({ticketReplies.length} replies)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketReplies.map((reply) => (
                  <div key={reply.id} className="flex items-start space-x-4 border-b pb-4 last:border-b-0">
                    <Avatar>
                      <AvatarImage src={reply.user?.image || undefined} />
                      <AvatarFallback>
                        {reply.authorType === "ADMIN" ? "A" : <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">
                          {reply.authorType === "ADMIN" ? "Admin" : reply.user?.name || "Customer"}
                        </span>
                        <Badge variant={reply.authorType === "ADMIN" ? "default" : "secondary"}>
                          {reply.authorType}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(reply.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reply Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Add Reply
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your reply here..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                className="w-full"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Your reply will be sent to the customer via email
                </p>
                <Button onClick={handleReply} disabled={isReplying || !reply.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  {isReplying ? "Sending..." : "Send Reply"}
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
                <Avatar>
                  <AvatarImage src={ticket.user?.image || undefined} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{ticket.user?.name || "Anonymous User"}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {ticket.user?.email || ticket.email}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.status === "OPEN" && (
                <Button
                  onClick={() => handleStatusUpdate("IN_PROGRESS")}
                  disabled={isUpdatingStatus}
                  className="w-full"
                  variant="default"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Mark as In Progress
                </Button>
              )}
              
              {(ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
                <Button
                  onClick={() => handleStatusUpdate("RESOLVED")}
                  disabled={isUpdatingStatus}
                  className="w-full"
                  variant="outline"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}

              {ticket.status === "RESOLVED" && (
                <Button
                  onClick={() => handleStatusUpdate("CLOSED")}
                  disabled={isUpdatingStatus}
                  className="w-full"
                  variant="secondary"
                >
                  Close Ticket
                </Button>
              )}

              {ticket.status !== "OPEN" && (
                <Button
                  onClick={() => handleStatusUpdate("OPEN")}
                  disabled={isUpdatingStatus}
                  className="w-full"
                  variant="ghost"
                >
                  Reopen Ticket
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Priority</label>
                <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(ticket.status)}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <div className="mt-1 text-sm">
                  {format(new Date(ticket.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <div className="mt-1 text-sm">
                  {format(new Date(ticket.updatedAt), "MMM dd, yyyy 'at' h:mm a")}
                </div>
              </div>

              {ticket.resolvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Resolved</label>
                  <div className="mt-1 text-sm">
                    {format(new Date(ticket.resolvedAt), "MMM dd, yyyy 'at' h:mm a")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
