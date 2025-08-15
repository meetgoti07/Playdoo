"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface User {
  id: string;
  hashId: number;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  role?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified?: string | null;
  lastLoginAt?: string | null;
  _count: {
    bookings: number;
    reviews?: number;
    facilities?: number;
  };
  // Additional fields for detailed view
  city?: string;
  state?: string;
  dateOfBirth?: string;
}

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onUserUpdate,
}: UserDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) return null;

  const isActive = user.status === "ACTIVE";

  const handleToggleStatus = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const newStatus = isActive ? "INACTIVE" : "ACTIVE";
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`User ${newStatus.toLowerCase()} successfully`);
        onUserUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user status");
      }
    } catch (error) {
      toast.error("Failed to update user status");
      console.error("Error updating user status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback>
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            View and manage user details and account status
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{user.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <div className="mt-1">{getRoleBadge(user.role || "user")}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <div className="mt-1">{getUserStatusBadge(user.status || "ACTIVE")}</div>
                </div>
              </div>

              {(user.city || user.state) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-gray-600">
                      {[user.city, user.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(user.createdAt), "MMM dd, yyyy")} 
                    <span className="text-gray-400 ml-1">
                      ({formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })})
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(user.updatedAt), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {user.lastLoginAt && (
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email Verified</p>
                  <p className="text-sm text-gray-600">
                    {user.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Activity Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{user._count.bookings}</p>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                </div>
                
                {user._count.reviews !== undefined && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{user._count.reviews}</p>
                    <p className="text-sm text-gray-600">Reviews Given</p>
                  </div>
                )}
                
                {user._count.facilities !== undefined && (
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{user._count.facilities}</p>
                    <p className="text-sm text-gray-600">Facilities Owned</p>
                  </div>
                )}

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {user.status === "BANNED" ? "0" : "1"}
                  </p>
                  <p className="text-sm text-gray-600">Account Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Control */}
          {user.status !== "BANNED" && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Account Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {isActive ? (
                      <UserCheck className="h-8 w-8 text-green-500" />
                    ) : (
                      <UserX className="h-8 w-8 text-gray-500" />
                    )}
                    <div>
                      <Label htmlFor="user-status" className="text-base font-medium">
                        User Status
                      </Label>
                      <p className="text-sm text-gray-600">
                        {isActive 
                          ? "User can access the platform and make bookings" 
                          : "User access is restricted"
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="user-status"
                    checked={isActive}
                    onCheckedChange={handleToggleStatus}
                    disabled={isUpdating}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
