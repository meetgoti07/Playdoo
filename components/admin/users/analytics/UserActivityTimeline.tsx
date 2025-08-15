"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  MapPin, 
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface UserActivityTimelineProps {
  userId: string;
}

// Mock activity data - in real implementation, this would come from an API
const mockActivities = [
  {
    id: "1",
    type: "booking_created",
    title: "New Booking Created",
    description: "Booked Basketball Court at Sports Complex",
    timestamp: "2024-08-12T10:30:00Z",
    icon: Calendar,
    color: "blue",
    details: {
      facility: "Sports Complex",
      court: "Basketball Court A",
      date: "2024-08-15",
      time: "18:00 - 20:00",
      amount: 1500
    }
  },
  {
    id: "2",
    type: "booking_confirmed",
    title: "Booking Confirmed",
    description: "Payment successful for Basketball Court booking",
    timestamp: "2024-08-12T10:35:00Z",
    icon: CheckCircle,
    color: "green",
    details: {
      transactionId: "TXN123456789",
      amount: 1500,
      method: "UPI"
    }
  },
  {
    id: "3",
    type: "profile_updated",
    title: "Profile Updated",
    description: "Updated phone number and location",
    timestamp: "2024-08-10T14:20:00Z",
    icon: User,
    color: "purple",
    details: {
      fields: ["phone", "city", "state"]
    }
  },
  {
    id: "4",
    type: "booking_cancelled",
    title: "Booking Cancelled",
    description: "Cancelled Tennis Court booking for Aug 8",
    timestamp: "2024-08-08T09:15:00Z",
    icon: XCircle,
    color: "red",
    details: {
      facility: "Elite Tennis Club",
      court: "Tennis Court 2",
      reason: "Schedule conflict",
      refundAmount: 800
    }
  },
  {
    id: "5",
    type: "booking_completed",
    title: "Booking Completed",
    description: "Completed Badminton session at Ace Sports",
    timestamp: "2024-08-05T20:00:00Z",
    icon: Activity,
    color: "orange",
    details: {
      facility: "Ace Sports Center",
      court: "Badminton Court 1",
      duration: "2 hours",
      amount: 600
    }
  },
  {
    id: "6",
    type: "account_created",
    title: "Account Created",
    description: "Welcome to the sports booking platform!",
    timestamp: "2024-07-15T12:00:00Z",
    icon: User,
    color: "blue",
    details: {
      registrationMethod: "Email",
      referralCode: null
    }
  }
];

export function UserActivityTimeline({ userId }: UserActivityTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [isLoading] = useState(false); // This would be connected to actual API call

  const displayedActivities = showAll ? mockActivities : mockActivities.slice(0, 5);

  const getActivityIcon = (type: string, IconComponent: any) => {
    const colorMap: Record<string, string> = {
      blue: "text-blue-600 bg-blue-50",
      green: "text-green-600 bg-green-50",
      purple: "text-purple-600 bg-purple-50",
      red: "text-red-600 bg-red-50",
      orange: "text-orange-600 bg-orange-50",
    };

    const activity = mockActivities.find(a => a.type === type);
    const colorClass = colorMap[activity?.color || "blue"];

    return (
      <div className={`p-2 rounded-full ${colorClass}`}>
        <IconComponent className="h-4 w-4" />
      </div>
    );
  };

  const renderActivityDetails = (activity: any) => {
    switch (activity.type) {
      case "booking_created":
      case "booking_completed":
        return (
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span>{activity.details.facility} - {activity.details.court}</span>
            </div>
            {activity.details.date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(activity.details.date), "MMM dd, yyyy")}</span>
              </div>
            )}
            {activity.details.time && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{activity.details.time}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3" />
              <span>₹{activity.details.amount?.toLocaleString()}</span>
            </div>
          </div>
        );
      
      case "booking_confirmed":
        return (
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <div>Transaction ID: {activity.details.transactionId}</div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3" />
              <span>₹{activity.details.amount?.toLocaleString()} via {activity.details.method}</span>
            </div>
          </div>
        );
      
      case "booking_cancelled":
        return (
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span>{activity.details.facility} - {activity.details.court}</span>
            </div>
            <div>Reason: {activity.details.reason}</div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3" />
              <span>Refund: ₹{activity.details.refundAmount?.toLocaleString()}</span>
            </div>
          </div>
        );
      
      case "profile_updated":
        return (
          <div className="mt-2 text-sm text-gray-600">
            <div>Updated fields: {activity.details.fields.join(", ")}</div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4 p-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {displayedActivities.map((activity, index) => (
          <div key={activity.id} className="relative flex items-start space-x-4 pb-6">
            {/* Timeline line */}
            {index < displayedActivities.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
            )}
            
            {/* Activity icon */}
            <div className="relative z-10">
              {getActivityIcon(activity.type, activity.icon)}
            </div>
            
            {/* Activity content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                </div>
                <time className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </time>
              </div>
              
              {/* Activity details */}
              {renderActivityDetails(activity)}
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less button */}
      {mockActivities.length > 5 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All Activities ({mockActivities.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
