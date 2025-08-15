"use client";

import { useUserAnalytics } from "@/hooks/swr/admin/useUserAnalytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Calendar, MapPin, Mail, Phone } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface UserAnalyticsHeaderProps {
  userId: string;
}

export function UserAnalyticsHeader({ userId }: UserAnalyticsHeaderProps) {
  const { data: userDetails, isLoading, error } = useUserAnalytics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">Failed to load user details</div>
        </CardContent>
      </Card>
    );
  }

  if (!userDetails) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-gray-500">User not found</div>
        </CardContent>
      </Card>
    );
  }

  const getUserStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      ACTIVE: { className: "bg-green-100 text-green-800", label: "Active" },
      INACTIVE: { className: "bg-gray-100 text-gray-800", label: "Inactive" },
      BANNED: { className: "bg-red-100 text-red-800", label: "Banned" },
      PENDING_VERIFICATION: { className: "bg-yellow-100 text-yellow-800", label: "Pending Verification" },
    };

    const variant = variants[status] || variants.ACTIVE;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      admin: { className: "bg-purple-100 text-purple-800", label: "Admin" },
      facility_owner: { className: "bg-blue-100 text-blue-800", label: "Facility Owner" },
      user: { className: "bg-gray-100 text-gray-800", label: "User" },
    };

    const variant = variants[role] || variants.user;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          {/* User Avatar */}
          <Avatar className="h-20 w-20">
            <AvatarImage src={userDetails.image || ""} alt={userDetails.name || ""} />
            <AvatarFallback className="text-lg">
              {userDetails.name
                ? userDetails.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{userDetails.name}</h1>
                {getRoleBadge(userDetails.role || "user")}
                {getUserStatusBadge(userDetails.status || "ACTIVE")}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{userDetails.email}</span>
                </div>
                {userDetails.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{userDetails.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Joined:</span>
                  <span className="ml-1 font-medium">
                    {format(new Date(userDetails.createdAt), "MMM dd, yyyy")}
                  </span>
                  <div className="text-gray-400">
                    {formatDistanceToNow(new Date(userDetails.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {(userDetails.city || userDetails.state) && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-1 font-medium">
                      {[userDetails.city, userDetails.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              )}

              {userDetails.emailVerified && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Email Verified:</span>
                    <span className="ml-1 font-medium">
                      {format(new Date(userDetails.emailVerified), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
