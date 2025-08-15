"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupportTicket, useSupportTicketReplies } from "@/hooks/swr/useSupportTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MessageSquare, Clock, CheckCircle, XCircle, Send, User, UserCog } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

interface SupportTicketDetailProps {
  ticketId: string;
}

export function SupportTicketDetail({ ticketId }: SupportTicketDetailProps) {
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { ticket, isLoading: ticketLoading, error: ticketError, mutate: mutateTicket } = useSupportTicket(ticketId);
  const { replies, isLoading: repliesLoading, error: repliesError, mutate: mutateReplies } = useSupportTicketReplies(ticketId);

  const handleSubmitReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/support/${ticketId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: replyMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      setReplyMessage("");
      await mutateReplies();
      await mutateTicket();
      toast.success("Reply sent successfully");
    } catch (error) {
      toast.error("Failed to send reply");
      console.error("Error sending reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ticketLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">
                {ticketError ? "Failed to load ticket" : "Ticket not found"}
              </p>
              <Button onClick={() => router.push("/support")}>
                Back to Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/support")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support
          </Button>
        </div>

        {/* Ticket Details */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{ticket.subject}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Ticket #{ticket.hashId}</span>
                  <span>Created {formatDistanceToNow(new Date(ticket.createdAt))} ago</span>
                  {ticket.resolvedAt && (
                    <span>Resolved {formatDistanceToNow(new Date(ticket.resolvedAt))} ago</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
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
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Original Message</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={ticket.user?.image || ""} />
                      <AvatarFallback>
                        {ticket.user?.name?.charAt(0) || ticket.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {ticket.user?.name || ticket.email}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Conversation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {repliesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : repliesError ? (
                <p className="text-red-600 text-center">Failed to load replies</p>
              ) : replies && replies.length > 0 ? (
                replies.map((reply) => (
                  <div key={reply.id} className="border-l-2 border-gray-100 pl-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={reply.user?.image || ""} />
                        <AvatarFallback>
                          {reply.authorType === "ADMIN" ? (
                            <UserCog className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">
                            {reply.user?.name || "Support Team"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {reply.authorType === "ADMIN" ? "Support" : "Customer"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(reply.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <div className="bg-white border rounded-lg p-3">
                          <p className="text-gray-800 whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No replies yet. Be the first to respond!</p>
              )}

              {/* Reply Form */}
              {ticket.status !== "CLOSED" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Add a reply</h4>
                    <Textarea
                      placeholder="Type your message here..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmitReply}
                        disabled={isSubmitting || !replyMessage.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? "Sending..." : "Send Reply"}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {ticket.status === "CLOSED" && (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">This ticket has been closed and no longer accepts replies.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
