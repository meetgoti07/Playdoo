"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/swr/admin/useUsers";
import { UserDetailsModal } from "./UserDetailsModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Shield, ShieldOff, Eye, Trash2, UserCheck, UserX, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface UserFilters {
  role: string;
  status: string;
  search: string;
}

interface UserManagementTableProps {
  filters: UserFilters;
}

export function UserManagementTable({ filters }: UserManagementTableProps) {
  const { data: users, isLoading, error, mutate } = useUsers(filters);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<"ban" | "unban" | "delete" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userForDetails, setUserForDetails] = useState<any>(null);

  const handleViewDetails = (user: any) => {
    setUserForDetails(user);
    setShowDetailsModal(true);
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`User marked as ${newStatus.toLowerCase()}`);
        mutate();
      } else {
        throw new Error(`Failed to update user status`);
      }
    } catch (error) {
      toast.error(`Failed to update user status`);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/${actionType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success(`User ${actionType}ned successfully`);
        mutate();
        setSelectedUser(null);
        setActionType(null);
      } else {
        throw new Error(`Failed to ${actionType} user`);
      }
    } catch (error) {
      toast.error(`Failed to ${actionType} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      BANNED: "bg-red-100 text-red-800",
      PENDING_VERIFICATION: "bg-yellow-100 text-yellow-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ").toLowerCase()}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      facility_owner: "bg-blue-100 text-blue-800",
      user: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={variants[role] || "bg-gray-100 text-gray-800"}>
        {role.replace("_", " ")}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load users
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
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
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role || "user")}</TableCell>
                  <TableCell>{getUserStatusBadge(user.status || "ACTIVE")}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>{user._count?.bookings || 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem key="view" onClick={() => handleViewDetails(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <Link href={`/admin/users/analytics?userId=${user.id}`}>
                          <DropdownMenuItem key="analytics">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                          </DropdownMenuItem>
                        </Link>
                        {user.status !== "BANNED" && (
                          <DropdownMenuItem
                            key="toggle-status"
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === "ACTIVE" ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Mark Inactive
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Mark Active
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        {user.status !== "BANNED" ? (
                          <DropdownMenuItem
                            key="ban"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("ban");
                            }}
                            className="text-red-600"
                          >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Ban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            key="unban"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("unban");
                            }}
                            className="text-green-600"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Unban User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          key="delete"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("delete");
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        user={userForDetails}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setUserForDetails(null);
        }}
        onUserUpdate={mutate}
      />

      {/* Action Confirmation Dialog */}
      <Dialog open={!!selectedUser && !!actionType} onOpenChange={() => {
        setSelectedUser(null);
        setActionType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "ban" && "Ban User"}
              {actionType === "unban" && "Unban User"}
              {actionType === "delete" && "Delete User"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "ban" && `Are you sure you want to ban ${selectedUser?.name}? They will no longer be able to access the platform.`}
              {actionType === "unban" && `Are you sure you want to unban ${selectedUser?.name}? They will regain access to the platform.`}
              {actionType === "delete" && `Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone and will permanently remove all their data.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUser(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "unban" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : `${actionType === "ban" ? "Ban" : actionType === "unban" ? "Unban" : "Delete"} User`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
