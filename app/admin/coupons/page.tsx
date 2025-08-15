"use client";

import { useState } from "react";
import { useCoupons, createCoupon, toggleCouponStatus, deleteCoupon } from "@/hooks/swr/admin/useCoupons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Download, MoreHorizontal, Eye, Edit, Trash2, Tag, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

export default function CouponsPage() {
  const [filters, setFilters] = useState({
    isActive: "all",
    search: "",
  });

  const { data: coupons, isLoading, error, mutate } = useCoupons(filters);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const couponData = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      discountType: formData.get("discountType") as string,
      discountValue: parseFloat(formData.get("discountValue") as string),
      minBookingAmount: formData.get("minBookingAmount") ? parseFloat(formData.get("minBookingAmount") as string) : undefined,
      maxDiscountAmount: formData.get("maxDiscountAmount") ? parseFloat(formData.get("maxDiscountAmount") as string) : undefined,
      usageLimit: formData.get("usageLimit") ? parseInt(formData.get("usageLimit") as string) : undefined,
      userUsageLimit: formData.get("userUsageLimit") ? parseInt(formData.get("userUsageLimit") as string) : undefined,
      validFrom: formData.get("validFrom") as string,
      validUntil: formData.get("validUntil") as string,
      applicableSports: [], // Can be enhanced to include sports selection
    };

    try {
      await createCoupon(couponData);
      toast.success("Coupon created successfully");
      setIsCreateDialogOpen(false);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      await toggleCouponStatus(couponId, !currentStatus);
      toast.success(`Coupon ${!currentStatus ? "activated" : "deactivated"} successfully`);
      mutate();
    } catch (error) {
      toast.error("Failed to update coupon status");
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await deleteCoupon(couponId);
      toast.success("Coupon deleted successfully");
      mutate();
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  const handleExport = () => {
    const queryParams = new URLSearchParams();
    if (filters.isActive && filters.isActive !== "all") queryParams.append("isActive", filters.isActive);
    if (filters.search) queryParams.append("search", filters.search);
    
    window.open(`/api/admin/coupons/export?${queryParams.toString()}`);
    toast.success("Coupon export started");
  };

  const getStatusBadge = (isActive: boolean, validUntil: string) => {
    const isExpired = new Date(validUntil) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getDiscountDisplay = (type: string, value: number) => {
    if (type === "PERCENTAGE") {
      return `${value}%`;
    }
    return `₹${value}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load coupons
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage discount coupons for the platform
          </p>
        </div>
        <div className="flex space-x-3">
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input 
                      id="code" 
                      name="code" 
                      placeholder="e.g., SAVE20"
                      required 
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="e.g., Save 20%"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Describe the coupon offer"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Discount Type</Label>
                    <Select name="discountType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">Discount Value</Label>
                    <Input 
                      id="discountValue" 
                      name="discountValue" 
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 20 or 100"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minBookingAmount">Min Booking Amount (optional)</Label>
                    <Input 
                      id="minBookingAmount" 
                      name="minBookingAmount" 
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmount">Max Discount Amount (optional)</Label>
                    <Input 
                      id="maxDiscountAmount" 
                      name="maxDiscountAmount" 
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Total Usage Limit (optional)</Label>
                    <Input 
                      id="usageLimit" 
                      name="usageLimit" 
                      type="number"
                      min="1"
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userUsageLimit">Per User Limit (optional)</Label>
                    <Input 
                      id="userUsageLimit" 
                      name="userUsageLimit" 
                      type="number"
                      min="1"
                      placeholder="e.g., 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Input 
                      id="validFrom" 
                      name="validFrom" 
                      type="datetime-local"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input 
                      id="validUntil" 
                      name="validUntil" 
                      type="datetime-local"
                      required 
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Coupon"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <Tag className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons?.filter(c => c.isActive && new Date(c.validUntil) > new Date()).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons?.reduce((sum, c) => sum + (c._count?.bookingCoupons || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Coupons</CardTitle>
            <Tag className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons?.filter(c => new Date(c.validUntil) < new Date()).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select 
                value={filters.isActive} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons && coupons.length > 0 ? (
                  coupons.map((coupon: any) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="font-mono font-medium">{coupon.code}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{coupon.name}</div>
                          {coupon.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {coupon.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getDiscountDisplay(coupon.discountType, coupon.discountValue)}
                        </div>
                        {coupon.minBookingAmount && (
                          <div className="text-xs text-gray-500">
                            Min: ₹{coupon.minBookingAmount}
                          </div>
                        )}
                        {coupon.maxDiscountAmount && (
                          <div className="text-xs text-gray-500">
                            Max: ₹{coupon.maxDiscountAmount}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {coupon._count?.bookingCoupons || 0}
                            {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                          </div>
                          {coupon.userUsageLimit && (
                            <div className="text-xs text-gray-500">
                              Limit: {coupon.userUsageLimit} per user
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(coupon.validFrom), "MMM dd, yyyy")}</div>
                          <div className="text-gray-500">
                            to {format(new Date(coupon.validUntil), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(coupon.isActive, coupon.validUntil)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Usage
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Coupon
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                            >
                              <Switch className="mr-2 h-4 w-4" />
                              {coupon.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No coupons found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
