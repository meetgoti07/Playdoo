"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { z } from "zod";

interface AdminCourt {
  id: string;
  hashId: number;
  name: string;
  sportType: string;
  description?: string;
  pricePerHour: number;
  capacity?: number;
  length?: number;
  width?: number;
  surface?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    name: string;
    status: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
  _count: {
    bookings: number;
    timeSlots: number;
    maintenance: number;
  };
}

interface AdminEditCourtModalProps {
  court: AdminCourt;
  isOpen: boolean;
  onClose: () => void;
  onCourtUpdated: () => void;
}

const adminUpdateCourtSchema = z.object({
  name: z.string().min(1, "Court name is required").optional(),
  sportType: z.string().min(1, "Please select a sport type").optional(),
  description: z.string().optional(),
  pricePerHour: z.number().min(0, "Price must be non-negative").optional(),
  capacity: z.number().min(1).optional(),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  surface: z.string().optional(),
  isActive: z.boolean().optional(),
  adminNotes: z.string().optional(),
});

export default function AdminEditCourtModal({ court, isOpen, onClose, onCourtUpdated }: AdminEditCourtModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    sportType: "",
    description: "",
    pricePerHour: "",
    capacity: "",
    length: "",
    width: "",
    surface: "",
    isActive: true,
    adminNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sportTypes = [
    { value: "BADMINTON", label: "Badminton" },
    { value: "TENNIS", label: "Tennis" },
    { value: "FOOTBALL", label: "Football" },
    { value: "BASKETBALL", label: "Basketball" },
    { value: "CRICKET", label: "Cricket" },
    { value: "SQUASH", label: "Squash" },
    { value: "TABLE_TENNIS", label: "Table Tennis" },
    { value: "VOLLEYBALL", label: "Volleyball" },
    { value: "SWIMMING", label: "Swimming" },
    { value: "GYM", label: "Gym" },
    { value: "OTHER", label: "Other" },
  ];

  const surfaces = [
    "Grass", "Concrete", "Wooden", "Synthetic", "Clay", "Rubber", "Tiles", "Other"
  ];

  // Initialize form data when court changes
  useEffect(() => {
    if (court) {
      setFormData({
        name: court.name || "",
        sportType: court.sportType || "",
        description: court.description || "",
        pricePerHour: court.pricePerHour?.toString() || "",
        capacity: court.capacity?.toString() || "",
        length: court.length?.toString() || "",
        width: court.width?.toString() || "",
        surface: court.surface || "",
        isActive: court.isActive,
        adminNotes: "",
      });
    }
  }, [court]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare data for validation - only include changed fields
      const changedData: any = {};
      
      if (formData.name !== court.name) changedData.name = formData.name;
      if (formData.sportType !== court.sportType) changedData.sportType = formData.sportType;
      if (formData.description !== (court.description || "")) changedData.description = formData.description || undefined;
      if (parseFloat(formData.pricePerHour) !== court.pricePerHour) changedData.pricePerHour = parseFloat(formData.pricePerHour);
      if (formData.capacity && parseInt(formData.capacity) !== (court.capacity || 0)) changedData.capacity = parseInt(formData.capacity);
      if (formData.length && parseFloat(formData.length) !== (court.length || 0)) changedData.length = parseFloat(formData.length);
      if (formData.width && parseFloat(formData.width) !== (court.width || 0)) changedData.width = parseFloat(formData.width);
      if (formData.surface !== (court.surface || "")) changedData.surface = formData.surface || undefined;
      if (formData.isActive !== court.isActive) changedData.isActive = formData.isActive;
      if (formData.adminNotes.trim()) changedData.adminNotes = formData.adminNotes.trim();

      // If no changes, just close the modal
      if (Object.keys(changedData).length === 0) {
        toast.info('No changes to save');
        onClose();
        return;
      }

      // Validate the changed data
      const validatedData = adminUpdateCourtSchema.parse(changedData);

      const response = await fetch(`/api/admin/courts/${court.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          // Handle Zod validation errors
          const fieldErrors: Record<string, string> = {};
          errorData.details.forEach((error: any) => {
            if (error.path) {
              fieldErrors[error.path[0]] = error.message;
            }
          });
          setErrors(fieldErrors);
          return;
        }
        throw new Error(errorData.message || 'Failed to update court');
      }

      toast.success('Court updated successfully by admin');
      onCourtUpdated();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to update court');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (court) {
      setFormData({
        name: court.name || "",
        sportType: court.sportType || "",
        description: court.description || "",
        pricePerHour: court.pricePerHour?.toString() || "",
        capacity: court.capacity?.toString() || "",
        length: court.length?.toString() || "",
        width: court.width?.toString() || "",
        surface: court.surface || "",
        isActive: court.isActive,
        adminNotes: "",
      });
    }
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin Edit: {court.name}</DialogTitle>
          <DialogDescription>
            Admin privileges: Edit any court details. Changes will be logged.
            <br />
            <span className="text-sm text-gray-500">
              Facility: {court.facility.name} | Owner: {court.facility.owner.name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Court Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Court Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Court 1, Main Court"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Sport Type */}
            <div className="space-y-2">
              <Label htmlFor="sportType">Sport Type *</Label>
              <Select 
                value={formData.sportType || undefined} 
                onValueChange={(value) => handleInputChange("sportType", value)}
              >
                <SelectTrigger className={errors.sportType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select sport type" />
                </SelectTrigger>
                <SelectContent>
                  {sportTypes.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      {sport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sportType && <p className="text-sm text-red-500">{errors.sportType}</p>}
            </div>

            {/* Price Per Hour */}
            <div className="space-y-2">
              <Label htmlFor="pricePerHour">Price Per Hour (₹) *</Label>
              <Input
                id="pricePerHour"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerHour}
                onChange={(e) => handleInputChange("pricePerHour", e.target.value)}
                placeholder="e.g., 500"
                className={errors.pricePerHour ? "border-red-500" : ""}
              />
              {errors.pricePerHour && <p className="text-sm text-red-500">{errors.pricePerHour}</p>}
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Players)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                placeholder="e.g., 4"
                className={errors.capacity ? "border-red-500" : ""}
              />
              {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
            </div>

            {/* Surface Type */}
            <div className="space-y-2">
              <Label htmlFor="surface">Surface Type</Label>
              <Select 
                value={formData.surface || undefined} 
                onValueChange={(value) => handleInputChange("surface", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select surface type" />
                </SelectTrigger>
                <SelectContent>
                  {surfaces.map((surface) => (
                    <SelectItem key={surface} value={surface.toLowerCase()}>
                      {surface}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Length */}
            <div className="space-y-2">
              <Label htmlFor="length">Length (meters)</Label>
              <Input
                id="length"
                type="number"
                min="0"
                step="0.1"
                value={formData.length}
                onChange={(e) => handleInputChange("length", e.target.value)}
                placeholder="e.g., 20"
                className={errors.length ? "border-red-500" : ""}
              />
              {errors.length && <p className="text-sm text-red-500">{errors.length}</p>}
            </div>

            {/* Width */}
            <div className="space-y-2">
              <Label htmlFor="width">Width (meters)</Label>
              <Input
                id="width"
                type="number"
                min="0"
                step="0.1"
                value={formData.width}
                onChange={(e) => handleInputChange("width", e.target.value)}
                placeholder="e.g., 10"
                className={errors.width ? "border-red-500" : ""}
              />
              {errors.width && <p className="text-sm text-red-500">{errors.width}</p>}
            </div>

            {/* Court Status */}
            <div className="space-y-2">
              <Label htmlFor="isActive" className="flex items-center space-x-2">
                <span>Court Status</span>
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                />
                <Label htmlFor="isActive" className="font-normal">
                  {formData.isActive ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Optional description of the court..."
              rows={2}
            />
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              value={formData.adminNotes}
              onChange={(e) => handleInputChange("adminNotes", e.target.value)}
              placeholder="Optional admin notes about this change..."
              rows={2}
              className="border-orange-200 focus:border-orange-400"
            />
            <p className="text-xs text-orange-600">
              Admin notes will be logged with this change for audit purposes.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Court"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
